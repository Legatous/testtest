import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import BuyModal from '../components/BuyModal';

export default function Books() {
  const { token, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  const [selectedBook, setSelectedBook] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [modalError, setModalError] = useState('');

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

  function openBuyModal(book) {
    setModalError('');
    setSelectedBook(book);
  }

  async function handleConfirm(signature) {
    setPlacing(true);
    setModalError('');
    try {
      const order = await api.placeOrder(token, selectedBook.id, 1, signature);
      setSelectedBook(null);
      setToast(
        `Order placed for "${order.title}" — invoice ${order.invoice_number} is ready in My Orders.`
      );
      await load();
      setTimeout(() => setToast(''), 5000);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  const filteredBooks = books.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    // A single-character search matches the spine letter (first letter of
    // the title) specifically, rather than any substring — so typing "T"
    // shows only books whose spine shows "T", not any title containing a t.
    if (q.length === 1) {
      return b.title.trim()[0]?.toLowerCase() === q;
    }

    return (
      b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="page">Loading catalog…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Catalog</h1>
        <p className="muted">
          {books.length} titles on the shelf
          {!user && ' — browsing as guest, log in to place an order'}
        </p>
      </div>
      {toast && <div className="alert success">{toast}</div>}
      {err && <div className="alert">{err}</div>}
      <input
        type="text"
        className="search-input"
        placeholder="Search by title or author…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filteredBooks.length === 0 && (
        <p className="muted" style={{ marginTop: '1rem' }}>
          No books match "{search}".
        </p>
      )}
      <div className="book-grid">
        {filteredBooks.map((book) => (
          <div className="book-card" key={book.id}>
            <div
              className="book-spine"
              style={{ background: book.cover_color }}
            >
              <span>{book.title[0]}</span>
              {isAdmin && (
                <button
                  className="spine-edit-btn"
                  title="Edit this book"
                  onClick={() => navigate(`/admin/books?edit=${book.id}`)}
                >
                  ✎
                </button>
              )}
            </div>
            <div className="book-body">
              <h3>{book.title}</h3>
              <p className="author">by {book.author}</p>
              <p className="desc">{book.description}</p>
              <div className="book-footer">
                <span className="price">${book.price.toFixed(2)}</span>
                <span className={`stock ${book.stock === 0 ? 'out' : ''}`}>
                  {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {!user && (
                <Link to="/login" className="btn full ghost">
                  Log in to order
                </Link>
              )}

              {user && !isAdmin && (
                <button
                  className="btn full"
                  disabled={book.stock === 0}
                  onClick={() => openBuyModal(book)}
                >
                  {book.stock === 0 ? 'Out of stock' : 'Order this book'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <a
        className="btn ghost small"
        href={api.demoInvoiceUrl()}
        style={{ marginTop: '1.5rem', display: 'inline-block' }}
      >
        Preview order
      </a>

      {selectedBook && (
        <BuyModal
          book={selectedBook}
          busy={placing}
          error={modalError}
          onConfirm={handleConfirm}
          onClose={() => !placing && setSelectedBook(null)}
        />
      )}
    </div>
  );
}
