import { Router } from "express";
import { db, nextId, nowIso } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Anyone logged in can view books
router.get("/", requireAuth, (req, res) => {
  const books = [...db.data.books].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  res.json(books);
});

router.get("/:id", requireAuth, (req, res) => {
  const book = db.data.books.find((b) => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

// Only admins can create, update, delete
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { title, author, description, price, stock, cover_color } = req.body;
  if (!title || !author || price == null) {
    return res.status(400).json({ error: "title, author and price are required" });
  }

  const book = {
    id: nextId("books"),
    title,
    author,
    description: description || "",
    price: Number(price),
    stock: Number(stock ?? 0),
    cover_color: cover_color || "#6366f1",
    created_at: nowIso(),
  };
  db.data.books.push(book);
  await db.write();

  res.status(201).json(book);
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const book = db.data.books.find((b) => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: "Book not found" });

  const { title, author, description, price, stock, cover_color } = req.body;
  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (description !== undefined) book.description = description;
  if (price !== undefined) book.price = Number(price);
  if (stock !== undefined) book.stock = Number(stock);
  if (cover_color !== undefined) book.cover_color = cover_color;

  await db.write();
  res.json(book);
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const index = db.data.books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Book not found" });

  db.data.books.splice(index, 1);
  await db.write();
  res.json({ success: true });
});

export default router;
