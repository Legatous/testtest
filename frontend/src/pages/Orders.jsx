import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const statusColor = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  shipped: '#22c55e',
  cancelled: '#ef4444',
};

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .getMyOrders(token)
      .then(setOrders)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownloadAll() {
    setDownloading(true);
    setErr('');
    try {
      const blob = await api.downloadMyOrdersInvoice(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-orders-invoice.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p className="muted">Everything you've ordered from the shop.</p>
      </div>

      {err && <div className="alert">{err}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p className="muted">
          You haven't placed any orders yet — browse the catalog to get started.
        </p>
      ) : (
        <>
          <div className="order-list">
            {orders.map((o) => (
              <div className="order-row" key={o.id}>
                <div>
                  <strong>{o.title}</strong>
                  <span className="muted"> by {o.author}</span>
                </div>
                <span>Qty: {o.quantity}</span>
                <span>${(o.price * o.quantity).toFixed(2)}</span>
                <span
                  className="badge"
                  style={{ background: statusColor[o.status] }}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>

          <button
            className="btn ghost"
            style={{ marginTop: '1.5rem' }}
            onClick={handleDownloadAll}
            disabled={downloading}
          >
            {downloading ? 'Preparing…' : 'Download invoice for all orders'}
          </button>
        </>
      )}
    </div>
  );
}
