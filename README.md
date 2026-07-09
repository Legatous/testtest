# Bindery & Co. — Bookstore (React + Express, Auth & Roles)

A full-stack CRUD example with two roles:

- **admin** — add, edit, and delete books; view all customer orders and update order status
- **user** — browse the catalog, sign a Terms-of-Service + signature to place an order, and download a PDF invoice

## Stack

- **Backend**: Node + Express, a plain JSON file as the data store (via `lowdb` — pure JavaScript, no native/compiled dependencies), JWT auth, bcrypt password hashing, `pdfkit` for invoices
- **Frontend**: React (Vite), React Router, role-based protected routes

The backend also serves the frontend's built static files, so the whole app runs as **one server on one port** — no CORS setup, no separate dev servers to juggle, and it runs unmodified in browser-based sandboxes like StackBlitz.

## Project structure

```
bookstore-app/
  package.json     Root scripts — installs + builds + starts everything
  backend/         Express API (auth, books, orders, invoices) + serves the built frontend
  frontend/        React app (Vite)
```

## Quickest way to run it: one command

From the `bookstore-app` root:

```bash
npm install     # installs backend + frontend deps, builds the frontend
npm start       # starts the single combined server on http://localhost:4000
```

Open http://localhost:4000 and log in with a demo account (or register a new
one — new accounts are always regular users):

| Role  | Email               | Password |
|-------|---------------------|----------|
| admin | admin@bookstore.com | admin123 |
| user  | user@bookstore.com  | user123  |

The data store (`backend/db.json`) is created and seeded automatically on
first run. Delete it and restart to reset to a clean slate.

## Running it online, with no local install

Because the backend now uses a pure-JS data store (no native compiled
modules), you can drag this whole folder straight into **StackBlitz**
(stackblitz.com) — no GitHub, no Codespaces, no local Node required:

1. Go to stackblitz.com and start a blank Node project (or open any existing one).
2. Drag the unzipped `bookstore-app` folder into the file tree.
3. StackBlitz auto-runs `npm install`, which triggers the root `postinstall`
   script — installing both `backend/` and `frontend/`, and building the
   frontend.
4. It should auto-detect `npm start` and run it; if not, open the terminal
   and run `npm start` yourself.
5. StackBlitz will pop up a preview at its forwarded URL — that's your app,
   fully running (frontend + API + invoice PDFs), all in the browser.

If you'd rather use **GitHub Codespaces** or a **local machine with Node**,
those work exactly the same way — the one-command `npm install && npm start`
setup above is identical everywhere.

### If you want frontend hot-reload while developing

The single-server setup above serves a *built* frontend, so it won't
hot-reload on edits. For active frontend development, run the two dev
servers separately instead:

```bash
# terminal 1
cd backend && npm install && npm run dev      # http://localhost:4000

# terminal 2
cd frontend && npm install
cp .env.example .env   # then uncomment/set VITE_API_URL=http://localhost:4000/api
npm run dev             # http://localhost:5173, hot-reloads on save
```

## How roles/auth work

- On login/register, the backend signs a JWT containing `{ id, name, email, role }`
  and returns it to the client.
- The frontend stores the token + user in `localStorage` via `AuthContext`
  and attaches `Authorization: Bearer <token>` to every API call.
- **Backend enforcement (the real security boundary)**: every books/orders
  route runs through `requireAuth` (valid token required) and, for
  admin-only actions, `requireRole("admin")` (see `backend/middleware/auth.js`).
  A regular user's token will get a `403` from the API even if they call the
  admin endpoints directly with curl/Postman.
- **Frontend enforcement (UX only)**: `ProtectedRoute` redirects logged-out
  users to `/login`, and redirects non-admins away from `/admin/*` pages.
  The "Order this book" button is hidden for admins; admin nav links are
  hidden for regular users. This is purely for a clean UX — it is not a
  security measure by itself, which is why the backend check above matters.

## API overview

| Method | Path                     | Who          | Purpose                            |
|--------|--------------------------|--------------|-------------------------------------|
| POST   | /api/auth/register       | public       | create a `user` account             |
| POST   | /api/auth/login          | public       | log in, get a JWT                   |
| GET    | /api/books               | any logged-in| list books                          |
| POST   | /api/books               | admin        | create a book                       |
| PUT    | /api/books/:id           | admin        | update a book                       |
| DELETE | /api/books/:id           | admin        | delete a book                       |
| POST   | /api/orders              | any logged-in| place an order (signature + ToS required) |
| GET    | /api/orders/mine         | any logged-in| your own orders                     |
| GET    | /api/orders              | admin        | all orders, with customer info      |
| PUT    | /api/orders/:id/status   | admin        | update order status                 |
| GET    | /api/orders/:id/invoice  | owner/admin  | download the order's PDF invoice    |

## Buy flow: signature, ToS agreement, and invoices

Clicking "Order this book" opens a modal instead of ordering immediately:

1. The customer reads a Terms of Service excerpt and checks "I agree."
2. They sign in a canvas-based signature pad (mouse or touch) — this is
   converted to a PNG data URL client-side.
3. On submit, the frontend calls `POST /api/orders` with
   `{ book_id, quantity, signature, tos_accepted: true }`.
4. The backend **rejects the order** (`400`) if `tos_accepted` is falsy or
   `signature` is missing/not an image data URL — this check happens
   server-side, so it can't be bypassed by tampering with the frontend.
5. On success, the order is stored with the signature (as a data URL),
   a `tos_accepted_at` timestamp, and an auto-generated `invoice_number`
   (e.g. `INV-2026-000004`).
6. "My Orders" (and the admin's "All Orders") get a "Download invoice"
   button that fetches `GET /api/orders/:id/invoice` and saves a PDF
   generated on the fly with `pdfkit` (`backend/invoice.js`), embedding the
   book, price, total, ToS acceptance time, and the customer's signature
   image.

Notes for production use:
- The ToS text in `BuyModal.jsx` (`TOS_TEXT`) is placeholder copy — swap in
  your real terms.
- Signatures are stored as base64 PNGs directly in `backend/db.json` for
  simplicity. At scale you'd likely store them in object storage (S3, etc.)
  and keep only a reference in the data store.
- Invoice numbers currently reuse the row id (`INV-<year>-<padded id>`),
  which is fine for a demo but not collision-proof across a resettable/
  re-seeded database — use a dedicated sequence or UUID for production.
- `lowdb` (the JSON-file store) is great for a demo but is not meant for
  concurrent writers at production scale — swap `backend/db.js` for a real
  database (Postgres, etc.) when you outgrow it. Because routes read/write
  through `db.data.<collection>` arrays rather than raw SQL, the swap is
  localized to `db.js` and the query lines in each route file.

## Extending this

- Promote a user to admin: update the `role` column for their row directly in
  `bookstore.db` (or add an admin-only "promote user" endpoint).
- Swap SQLite for Postgres by replacing `db.js` with a `pg` connection — the
  route files only use `db.prepare(...).get/all/run(...)`-style calls, so the
  swap is localized.
- Add refresh tokens / shorter JWT expiry for production use; currently
  tokens last 7 days for demo convenience.
