import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./db.js"; // ensures the JSON data store exists + is seeded
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import orderRoutes from "./routes/orders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the built frontend (frontend/dist) from this same server, so the
// whole app runs as a single origin/port — no separate dev server, no CORS
// or cross-origin preview-URL setup needed in sandboxed environments like
// StackBlitz. Run `npm run build` in frontend/ first (the root `npm start`
// script does this automatically).
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Bindery & Co. running on http://localhost:${PORT}`);
  console.log(`Seeded accounts -> admin: admin@bookstore.com / admin123  |  user: user@bookstore.com / user123`);
});
