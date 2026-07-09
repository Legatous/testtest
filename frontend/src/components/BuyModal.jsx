import { useState } from "react";
import SignaturePad from "./SignaturePad";

const TOS_TEXT = `By placing this order you agree that: (1) prices are shown in USD and charged at checkout, (2) orders are fulfilled subject to stock availability, (3) you are the account holder authorizing this purchase, and (4) an invoice will be generated and stored on your account as a record of this transaction. This is placeholder Terms of Service text for demo purposes.`;

export default function BuyModal({ book, onConfirm, onClose, busy, error }) {
  const [signature, setSignature] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const canSubmit = Boolean(signature) && agreed && !busy;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm your order</h2>
        <p className="muted">
          {book.title} <span className="muted">by {book.author}</span> — $
          {book.price.toFixed(2)}
        </p>

        {error && <div className="alert">{error}</div>}

        <div className="tos-box">{TOS_TEXT}</div>

        <label className="checkbox-row">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I have read and agree to the Terms of Service
        </label>

        <p className="muted small" style={{ marginTop: "0.6rem" }}>
          Sign below to confirm — your signature and agreement timestamp will be recorded on the invoice.
        </p>
        <SignaturePad onChange={setSignature} />

        <div className="form-actions" style={{ marginTop: "1.2rem" }}>
          <button
            className="btn full"
            disabled={!canSubmit}
            onClick={() => onConfirm(signature)}
          >
            {busy ? "Placing order…" : "Sign & place order"}
          </button>
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
