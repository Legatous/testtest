import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const emptyForm = { title: "", author: "", description: "", price: "", stock: "", cover_color: "#6366f1" };

export default function AdminBooks() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setBooks(await api.getBooks(token));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      description: book.description || "",
      price: book.price,
      stock: book.stock,
      cover_color: book.cover_color,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10) || 0,
    };
    try {
      if (editingId) {
        await api.updateBook(token, editingId, payload);
      } else {
        await api.createBook(token, payload);
      }
      cancelEdit();
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this book? This cannot be undone.")) return;
    try {
      await api.deleteBook(token, id);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Manage Books</h1>
        <p className="muted">Add new titles, edit details, or remove books from the catalog.</p>
      </div>

      {err && <div className="alert">{err}</div>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit book" : "Add a new book"}</h2>
        <div className="form-grid">
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Author
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
            />
          </label>
          <label>
            Price ($)
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </label>
          <label>
            Spine color
            <input
              type="color"
              value={form.cover_color}
              onChange={(e) => setForm({ ...form, cover_color: e.target.value })}
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="form-actions">
          <button className="btn" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add book"}
          </button>
          {editingId && (
            <button type="button" className="btn ghost" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="section-title">Current catalog</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>${b.price.toFixed(2)}</td>
                <td>{b.stock}</td>
                <td className="row-actions">
                  <button className="btn ghost small" onClick={() => startEdit(b)}>
                    Edit
                  </button>
                  <button className="btn danger small" onClick={() => handleDelete(b.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
