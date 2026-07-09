import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import BuyModal from "../components/BuyModal";

export default function Books() {
  const { token, isAdmin } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const [selectedBook, setSelectedBook] = useState(null); // book currently in the buy modal
  const [placing, setPlacing] = useState(false);
  const [modalError, setModalError] = useState("");

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
    setModalError("");
    setSelectedBook(book);
  }

  async function handleConfirm(signature) {
    setPlacing(true);
    setModalError("");
    try {
      const order = await api.placeOrder(token, selectedBook.id, 1, signature);
      setSelectedBook(null);
      setToast(`Order placed for "${order.title}" — invoice ${order.invoice_number} is ready in My Orders.`);
      await load();
      setTimeout(() => setToast(""), 5000);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <div className="page">Loading catalog…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Catalog</h1>
        <p className="muted">{books.length} titles on the shelf</p>
      </div>

      {toast && <div className="alert success">{toast}</div>}
      {err && <div className="alert">{err}</div>}

      <div className="book-grid">
        {books.map((book) => (
          <div className="book-card" key={book.id}>
            <div className="book-spine" style={{ background: book.cover_color }}>
              <span>{book.title[0]}</span>
            </div>
            <div className="book-body">
              <h3>{book.title}</h3>
              <p className="author">by {book.author}</p>
              <p className="desc">{book.description}</p>
              <div className="book-footer">
                <span className="price">${book.price.toFixed(2)}</span>
                <span className={`stock ${book.stock === 0 ? "out" : ""}`}>
                  {book.stock > 0 ? `${book.stock} in stock` : "Out of stock"}
                </span>
              </div>
              {!isAdmin && (
                <button
                  className="btn full"
                  disabled={book.stock === 0}
                  onClick={() => openBuyModal(book)}
                >
                  {book.stock === 0 ? "Out of stock" : "Order this book"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
