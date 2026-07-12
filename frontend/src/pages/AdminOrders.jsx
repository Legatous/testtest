import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const statuses = ["pending", "confirmed", "shipped", "cancelled"];

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setOrders(await api.getAllOrders(token));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id, status) {
    try {
      await api.updateOrderStatus(token, id, status);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

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
        <h1>All Orders</h1>
        <p className="muted">Manage every customer order and update its fulfillment status.</p>
      </div>

      {err && <div className="alert">{err}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Book</th>
              <th>Qty</th>
              <th>Invoice</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.customer_name}
                  <div className="muted small">{o.customer_email}</div>
                </td>
                <td>{o.title}</td>
                <td>{o.quantity}</td>
                <td className="muted small">{o.invoice_number}</td>
                <td>
                  <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="btn ghost small"
                    onClick={() => handleDownload(o)}
                    disabled={downloadingId === o.id}
                  >
                    {downloadingId === o.id ? "Preparing…" : "Invoice"}
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
