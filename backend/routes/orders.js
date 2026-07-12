import { Router } from 'express';
import { db, nextId, nowIso } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { renderInvoicePdf } from '../invoice.js';
import { groupItems } from './demo.js';

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

router.post('/', requireAuth, async (req, res) => {
  const { book_id, quantity = 1, signature, tos_accepted } = req.body;

  if (!tos_accepted) {
    return res
      .status(400)
      .json({
        error: 'You must agree to the Terms of Service to place an order',
      });
  }
  if (
    !signature ||
    typeof signature !== 'string' ||
    !signature.startsWith('data:image')
  ) {
    return res
      .status(400)
      .json({ error: 'A signature is required to place an order' });
  }

  const book = db.data.books.find((b) => b.id === Number(book_id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (quantity < 1)
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  if (book.stock < quantity)
    return res.status(400).json({ error: 'Not enough stock available' });

  book.stock -= quantity;

  const id = nextId('orders');
  const order = {
    id,
    user_id: req.user.id,
    book_id: book.id,
    quantity,
    status: 'pending',
    invoice_number: `INV-${new Date().getFullYear()}-${String(id).padStart(
      6,
      '0'
    )}`,
    signature,
    tos_accepted_at: nowIso(),
    created_at: nowIso(),
  };
  db.data.orders.push(order);
  await db.write();

  res.status(201).json(withBook(order));
});

router.get('/mine', requireAuth, (req, res) => {
  const orders = db.data.orders
    .filter((o) => o.user_id === req.user.id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(withBook);
  res.json(orders);
});

router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const orders = [...db.data.orders]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(withCustomer);
  res.json(orders);
});

router.get('/mine/invoice', requireAuth, (req, res) => {
  const myOrders = db.data.orders
    .filter((o) => o.user_id === req.user.id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (myOrders.length === 0) {
    return res.status(404).json({ error: 'You have no orders yet' });
  }

  const user = db.data.users.find((u) => u.id === req.user.id);
  const rawItems = myOrders.map((o) => {
    const book = db.data.books.find((b) => b.id === o.book_id);
    return {
      title: book?.title || '(removed book)',
      author: book?.author || '',
      price: book?.price ?? 0,
      quantity: o.quantity,
    };
  });
  const items = groupItems(rawItems);

  const mostRecent = myOrders[0];
  const combined = {
    id: 0,
    invoice_number: `INV-ALL-${String(req.user.id).padStart(4, '0')}`,
    status: 'combined',
    created_at: nowIso(),
    tos_accepted_at: mostRecent.tos_accepted_at,
    signature: mostRecent.signature,
    customer_name: user?.name,
    customer_email: user?.email,
    items,
  };

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="my-orders-invoice.pdf"'
  );
  renderInvoicePdf(combined, res);
});

router.get('/:id/invoice', requireAuth, (req, res) => {
  const order = db.data.orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'You do not have access to this invoice' });
  }

  const full = withCustomer(order);
  full.items = [
    {
      title: full.title,
      author: full.author,
      price: full.price,
      quantity: full.quantity,
    },
  ];

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${
      order.invoice_number || 'invoice-' + order.id
    }.pdf"`
  );
  renderInvoicePdf(full, res);
});

router.put(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'shipped', 'cancelled'];
    if (!valid.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of ${valid.join(', ')}` });
    }
    const order = db.data.orders.find((o) => o.id === Number(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    await db.write();
    res.json(withBook(order));
  }
);

export default router;
