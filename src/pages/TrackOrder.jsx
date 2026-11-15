import { useState } from "react";
import { Link } from "react-router-dom";

const styles = `
.md-track {
  min-height: 80vh;
  padding: 48px 18px 75px;
  background: #f6f7fb;
  color: #172033;
}
.md-track * { box-sizing: border-box; }
.md-track-container { width: min(900px, 100%); margin: auto; }
.md-track-hero { margin-bottom: 32px; text-align: center; }
.md-track-eyebrow {
  color: #635bff;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}
.md-track-title {
  margin: 12px 0;
  color: #172033;
  font-size: clamp(30px, 5vw, 43px);
  font-weight: 850;
  letter-spacing: -1.5px;
}
.md-track-description {
  max-width: 570px;
  margin: auto;
  color: #7b8798;
  font-size: 14px;
  line-height: 1.8;
}
.md-track-card {
  margin-bottom: 20px;
  padding: 27px;
  border: 1px solid #e7eaf0;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(23,32,51,.045);
}
.md-track-card-title {
  margin: 0 0 7px;
  color: #172033;
  font-size: 17px;
  font-weight: 850;
}
.md-track-card-description {
  margin: 0 0 23px;
  color: #8791a1;
  font-size: 12px;
  line-height: 1.7;
}
.md-track-field { margin-bottom: 17px; }
.md-track-label {
  display: block;
  margin-bottom: 8px;
  color: #475467;
  font-size: 12px;
  font-weight: 750;
}
.md-track-input-wrap { position: relative; }
.md-track-input-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: #98a2b3;
  font-size: 15px;
}
.md-track-input {
  width: 100%;
  min-height: 49px;
  padding: 12px 14px 12px 43px;
  border: 1px solid #e1e5ed;
  border-radius: 9px;
  outline: none;
  background: #fff;
  color: #172033;
  font-size: 13px;
  transition: .2s ease;
}
.md-track-input:focus {
  border-color: #635bff;
  box-shadow: 0 0 0 3px rgba(99,91,255,.1);
}
.md-track-submit {
  display: flex;
  width: 100%;
  min-height: 49px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 7px;
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: #635bff;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 850;
  transition: .2s ease;
}
.md-track-submit:hover { background: #5148e5; }
.md-track-submit:disabled { opacity: .6; cursor: not-allowed; }
.md-track-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e2e6ff;
  border-radius: 11px;
  background: #f0f1ff;
  color: #555b7b;
  font-size: 12px;
  line-height: 1.7;
}
.md-track-notice i {
  flex-shrink: 0;
  color: #635bff;
  font-size: 17px;
}
.md-track-help {
  margin-top: 22px;
  color: #8791a1;
  font-size: 12px;
  line-height: 1.8;
  text-align: center;
}
.md-track-help a {
  color: #635bff;
  font-weight: 800;
  text-decoration: none;
}
.md-track-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 24px;
}
.md-track-step {
  padding: 17px 12px;
  border: 1px solid #e7eaf0;
  border-radius: 12px;
  background: #fff;
  text-align: center;
}
.md-track-step-icon {
  display: grid;
  width: 39px;
  height: 39px;
  place-items: center;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: #f0efff;
  color: #635bff;
  font-size: 16px;
}
.md-track-step strong {
  display: block;
  margin-bottom: 5px;
  color: #344054;
  font-size: 11px;
  font-weight: 850;
}
.md-track-step span {
  color: #98a2b3;
  font-size: 10px;
  line-height: 1.5;
}
@media(max-width:600px) {
  .md-track { padding: 30px 13px 50px; }
  .md-track-card { padding: 20px; }
  .md-track-steps { grid-template-columns: 1fr; }
  .md-track-step {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
  }
  .md-track-step-icon { flex-shrink: 0; margin: 0; }
}
`;

function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!orderNumber.trim() || !phone.trim()) return;

    setSubmitted(true);
  };

  return (
    <main className="md-track">
      <style>{styles}</style>

      <div className="md-track-container">
        <header className="md-track-hero">
          <div className="md-track-eyebrow">Customer order services</div>
          <h1 className="md-track-title">Track your order</h1>
          <p className="md-track-description">
            Stay informed about your purchase. Enter your order number
            and the phone number used during checkout to find your order.
          </p>
        </header>

        <section className="md-track-card">
          <h2 className="md-track-card-title">Find your order</h2>
          <p className="md-track-card-description">
            Your order number can be found in your order confirmation.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="md-track-field">
              <label className="md-track-label" htmlFor="track-order-number">
                Order number
              </label>
              <div className="md-track-input-wrap">
                <i className="bi bi-receipt md-track-input-icon"></i>
                <input
                  id="track-order-number"
                  className="md-track-input"
                  type="text"
                  placeholder="e.g. ORD-000123"
                  value={orderNumber}
                  onChange={(event) => {
                    setOrderNumber(event.target.value);
                    setSubmitted(false);
                  }}
                  required
                />
              </div>
            </div>

            <div className="md-track-field">
              <label className="md-track-label" htmlFor="track-phone">
                Phone number
              </label>
              <div className="md-track-input-wrap">
                <i className="bi bi-telephone md-track-input-icon"></i>
                <input
                  id="track-phone"
                  className="md-track-input"
                  type="tel"
                  placeholder="Enter the phone number used at checkout"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setSubmitted(false);
                  }}
                  required
                />
              </div>
            </div>

            <button className="md-track-submit" type="submit">
              <i className="bi bi-search"></i>
              Find my order
            </button>
          </form>
        </section>

        {submitted && (
          <div className="md-track-notice" role="status">
            <i className="bi bi-info-circle"></i>
            <div>
              <strong>Order lookup is not connected yet.</strong>
              <br />
              Your details have been entered, but live order verification
              will become available when the order-tracking backend is
              integrated. No order status has been assumed or fabricated.
            </div>
          </div>
        )}

        <section className="md-track-card">
          <h2 className="md-track-card-title">How order tracking works</h2>
          <p className="md-track-card-description">
            Once a shop updates your order, you will be able to follow
            its progress through these stages.
          </p>

          <div className="md-track-steps">
            <div className="md-track-step">
              <div className="md-track-step-icon">
                <i className="bi bi-clipboard-check"></i>
              </div>
              <div>
                <strong>Order received</strong>
                <span>The shop receives your order.</span>
              </div>
            </div>

            <div className="md-track-step">
              <div className="md-track-step-icon">
                <i className="bi bi-box-seam"></i>
              </div>
              <div>
                <strong>Processing</strong>
                <span>The shop prepares your items.</span>
              </div>
            </div>

            <div className="md-track-step">
              <div className="md-track-step-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div>
                <strong>Completed</strong>
                <span>Your order is ready or delivered.</span>
              </div>
            </div>
          </div>
        </section>

        <div className="md-track-help">
          Need help with an order?{" "}
          <Link to="/ask-support">Contact customer support</Link>.
          <br />
          <Link to="/">Return to MyDuka home</Link>
        </div>
      </div>
    </main>
  );
}

export default TrackOrder;
