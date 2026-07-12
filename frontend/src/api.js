// In the default single-server setup (backend serves the built frontend),
// same-origin "/api" just works. Set VITE_API_URL only if you're running
// the frontend and backend as two separate dev servers.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),

  getBooks: (token) => request('/books', { token }),
  createBook: (token, book) =>
    request('/books', { method: 'POST', body: book, token }),
  updateBook: (token, id, book) =>
    request(`/books/${id}`, { method: 'PUT', body: book, token }),
  deleteBook: (token, id) =>
    request(`/books/${id}`, { method: 'DELETE', token }),
  demoInvoiceUrl: () => `${BASE_URL}/demo/invoice?t=${Date.now()}`,

  async downloadMyOrdersInvoice(token) {
    const res = await fetch(`${BASE_URL}/orders/mine/invoice?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Could not download invoice');
    }
    return res.blob();
  },

  placeOrder: (token, book_id, quantity, signature) =>
    request('/orders', {
      method: 'POST',
      body: { book_id, quantity, signature, tos_accepted: true },
      token,
    }),
  getMyOrders: (token) => request('/orders/mine', { token }),
  getAllOrders: (token) => request('/orders', { token }),
  updateOrderStatus: (token, id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: { status }, token }),

  // Invoices are binary PDFs, not JSON, so this bypasses the request() helper
  // and returns a Blob the caller can turn into a download link.
  async downloadInvoice(token, orderId) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Could not download invoice');
    }
    return res.blob();
  },
};
