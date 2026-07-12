import { Router } from 'express';
import { db, nowIso } from '../db.js';
import { renderInvoicePdf } from '../invoice.js';

const router = Router();

export function groupItems(rawItems) {
  const groups = new Map();
  for (const item of rawItems) {
    const key = `${item.title}|${item.author}|${item.price}`;
    if (groups.has(key)) {
      groups.get(key).quantity += item.quantity;
    } else {
      groups.set(key, { ...item });
    }
  }
  return [...groups.values()];
}

router.get('/invoice', (req, res) => {
  const rawItems = db.data.books.map((b) => ({
    title: b.title,
    author: b.author,
    price: b.price,
    quantity: 1,
  }));
  const items = groupItems(rawItems);

  const sampleOrder = {
    id: 0,
    invoice_number: 'INV-PREVIEW-000000',
    status: 'preview',
    created_at: nowIso(),
    tos_accepted_at: nowIso(),
    signature: null,
    customer_name: 'Guest Explorer',
    customer_email: 'guest@example.com',
    items,
  };

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
  renderInvoicePdf(sampleOrder, res);
});

export default router;
