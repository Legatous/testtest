import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const statusColor = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  shipped: "#22c55e",
  cancelled: "#ef4444",
};

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api
      .getMyOrders(token)
      .then(setOrders)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(order) {
    setDownloadingId(order.id);
    setErr("");
    try {
      const blob = await api.downloadInvoice(token, order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.invoice_number || "invoice-" + order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p className="muted">Everything you've ordered from the shop, with signed invoices.</p>
      </div>

      {err && <div className="alert">{err}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <p className="muted">You haven't placed any orders yet — browse the catalog to get started.</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <div className="order-row invoice-row" key={o.id}>
              <div>
                <strong>{o.title}</strong>
                <span className="muted"> by {o.author}</span>
                <div className="muted small">{o.invoice_number}</div>
              </div>
              <span>Qty: {o.quantity}</span>
              <span>${(o.price * o.quantity).toFixed(2)}</span>
              <span className="badge" style={{ background: statusColor[o.status] }}>
                {o.status}
              </span>
              <button
                className="btn ghost small"
                onClick={() => handleDownload(o)}
                disabled={downloadingId === o.id}
              >
                {downloadingId === o.id ? "Preparing…" : "Download invoice"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
