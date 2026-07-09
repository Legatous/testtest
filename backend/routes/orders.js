import { Router } from "express";
import { db, nextId, nowIso } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { renderInvoicePdf } from "../invoice.js";

const router = Router();

function withBook(order) {
  const book = db.data.books.find((b) => b.id === order.book_id);
  return {
    ...order,
    title: book?.title,
    author: book?.author,
    price: book?.price,
  };
}

function withCustomer(order) {
  const user = db.data.users.find((u) => u.id === order.user_id);
  return {
    ...withBook(order),
    customer_name: user?.name,
    customer_email: user?.email,
  };
}

// Users place an order for a book. Requires an explicit ToS acceptance and a
// drawn signature (a data:image/png;base64,... string from the frontend's
// signature pad) — both are stored so the invoice can prove agreement.
router.post("/", requireAuth, async (req, res) => {
  const { book_id, quantity = 1, signature, tos_accepted } = req.body;

  if (!tos_accepted) {
    return res.status(400).json({ error: "You must agree to the Terms of Service to place an order" });
  }
  if (!signature || typeof signature !== "string" || !signature.startsWith("data:image")) {
    return res.status(400).json({ error: "A signature is required to place an order" });
  }

  const book = db.data.books.find((b) => b.id === Number(book_id));
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (quantity < 1) return res.status(400).json({ error: "Quantity must be at least 1" });
  if (book.stock < quantity) return res.status(400).json({ error: "Not enough stock available" });

  book.stock -= quantity;

  const id = nextId("orders");
  const order = {
    id,
    user_id: req.user.id,
    book_id: book.id,
    quantity,
    status: "pending",
    invoice_number: `INV-${new Date().getFullYear()}-${String(id).padStart(6, "0")}`,
    signature,
    tos_accepted_at: nowIso(),
    created_at: nowIso(),
  };
  db.data.orders.push(order);
  await db.write();

  res.status(201).json(withBook(order));
});

// A regular user sees only their own orders
router.get("/mine", requireAuth, (req, res) => {
  const orders = db.data.orders
    .filter((o) => o.user_id === req.user.id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(withBook);
  res.json(orders);
});

// Admins see every order, with the customer's info
router.get("/", requireAuth, requireRole("admin"), (req, res) => {
  const orders = [...db.data.orders]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(withCustomer);
  res.json(orders);
});

// Download the PDF invoice for a single order.
// A customer can only fetch their own invoice; an admin can fetch any.
router.get("/:id/invoice", requireAuth, (req, res) => {
  const order = db.data.orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You do not have access to this invoice" });
  }

  const full = withCustomer(order);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${order.invoice_number || "invoice-" + order.id}.pdf"`
  );
  renderInvoicePdf(full, res);
});

// Admins update order status (confirm, ship, cancel)
router.put("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  const { status } = req.body;
  const valid = ["pending", "confirmed", "shipped", "cancelled"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${valid.join(", ")}` });
  }
  const order = db.data.orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  await db.write();
  res.json(withBook(order));
});

export default router;
