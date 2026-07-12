import { JSONFilePreset } from 'lowdb/node';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultData = {
  users: [],
  books: [],
  orders: [],
  nextIds: { users: 1, books: 1, orders: 1 },
};

export const db = await JSONFilePreset(
  path.join(__dirname, 'db.json'),
  defaultData
);

export function nextId(collection) {
  const id = db.data.nextIds[collection]++;
  return id;
}

export function nowIso() {
  return new Date().toISOString();
}

if (db.data.users.length === 0) {
  db.data.users.push(
    {
      id: nextId('users'),
      name: 'Admin',
      email: 'admin@bookstore.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      created_at: nowIso(),
    },
    {
      id: nextId('users'),
      name: 'Demo User',
      email: 'user@bookstore.com',
      password: bcrypt.hashSync('user123', 10),
      role: 'user',
      created_at: nowIso(),
    }
  );

  const seedBooks = [
    [
      'The Pragmatic Programmer',
      'Andrew Hunt',
      'A classic guide to software craftsmanship.',
      34.99,
      12,
      '#0ea5e9',
    ],
    [
      'Clean Code',
      'Robert C. Martin',
      'Principles of writing maintainable code.',
      29.99,
      8,
      '#22c55e',
    ],
    [
      'Dune',
      'Frank Herbert',
      'Epic science fiction saga set on a desert planet.',
      19.99,
      20,
      '#f59e0b',
    ],
    [
      '1984',
      'George Orwell',
      'Dystopian classic about surveillance and control.',
      12.5,
      15,
      '#ef4444',
    ],
    [
      'Atomic Habits',
      'James Clear',
      'A practical guide to building good habits.',
      24.0,
      25,
      '#8b5cf6',
    ],
  ];
  for (const [
    title,
    author,
    description,
    price,
    stock,
    cover_color,
  ] of seedBooks) {
    db.data.books.push({
      id: nextId('books'),
      title,
      author,
      description,
      price,
      stock,
      cover_color,
      created_at: nowIso(),
    });
  }

  await db.write();
}

export default db;
