import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  title: '',
  author: '',
  description: '',
  price: '',
  stock: '',
  cover_color: '#6366f1',
};

const placeholderBooks = [
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    description: 'A novel about all the lives you could have lived.',
    price: 16.99,
    stock: 10,
    cover_color: '#334155',
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    description: 'A brief history of humankind.',
    price: 21.99,
    stock: 14,
    cover_color: '#b45309',
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    description: "A hobbit's unexpected journey.",
    price: 14.5,
    stock: 18,
    cover_color: '#166534',
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    description:
      'A memoir about family and the transformative power of education.',
    price: 18.0,
    stock: 9,
    cover_color: '#7c2d12',
  },
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    description: 'A lone astronaut must save humanity from extinction.',
    price: 19.99,
    stock: 16,
    cover_color: '#1e3a5f',
  },
];

export default function AdminBooks() {
  const { token } = useAuth();
  const formId = useRef(Math.random().toString(36).slice(2)).current;
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
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

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && books.length > 0) {
      const target = books.find((b) => String(b.id) === editId);
      if (target) startEdit(target);
    }
  }, [books]);

  function startEdit(book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      description: book.description || '',
      price: book.price,
      stock: book.stock,
      cover_color: book.cover_color,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleTitleChange(value) {
    const match = placeholderBooks.find((b) => b.title === value);
    if (match) {
      setForm({
        title: match.title,
        author: match.author,
        description: match.description,
        price: match.price,
        stock: match.stock,
        cover_color: match.cover_color,
      });
    } else {
      setForm({ ...form, title: value });
    }
  }

  function handleAuthorChange(value) {
    const match = placeholderBooks.find((b) => b.author === value);
    if (match) {
      setForm({
        title: match.title,
        author: match.author,
        description: match.description,
        price: match.price,
        stock: match.stock,
        cover_color: match.cover_color,
      });
    } else {
      setForm({ ...form, author: value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
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

  async function handleAddPlaceholders() {
    setSaving(true);
    setErr('');
    try {
      for (const book of placeholderBooks) {
        await api.createBook(token, book);
      }
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this book? This cannot be undone.')) return;
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
        <p className="muted">
          Add new titles, edit details, or remove books from the catalog.
        </p>
      </div>

      {err && <div className="alert">{err}</div>}

      <datalist id="title-suggestions">
        {placeholderBooks.map((b) => (
          <option key={b.title} value={b.title} />
        ))}
      </datalist>
      <datalist id="author-suggestions">
        {[...new Set(placeholderBooks.map((b) => b.author))].map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      <form className="admin-form" onSubmit={handleSubmit} autoComplete="off">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2>{editingId ? 'Edit book' : 'Add a new book'}</h2>
          {!editingId && (
            <button
              type="button"
              className="btn ghost small"
              onClick={handleAddPlaceholders}
              disabled={saving}
            >
              {saving ? 'Adding…' : '+ Add 5 sample books'}
            </button>
          )}
        </div>
        <div className="form-grid">
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              name={`title-${formId}`}
              autoComplete="off"
              list="title-suggestions"
              required
            />
          </label>
          <label>
            Author
            <input
              value={form.author}
              onChange={(e) => handleAuthorChange(e.target.value)}
              name={`author-${formId}`}
              autoComplete="off"
              list="author-suggestions"
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
              name={`price-${formId}`}
              autoComplete="off"
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
              name={`stock-${formId}`}
              autoComplete="off"
              required
            />
          </label>
          <label>
            Spine color
            <input
              type="color"
              value={form.cover_color}
              onChange={(e) =>
                setForm({ ...form, cover_color: e.target.value })
              }
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
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add book'}
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
                  <button
                    className="btn ghost small"
                    onClick={() => startEdit(b)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn danger small"
                    onClick={() => handleDelete(b.id)}
                  >
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
