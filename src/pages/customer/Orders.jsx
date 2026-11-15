import { useState } from "react";
import { Link } from "react-router-dom";

const styles = `
.md-orders {
  min-height: 75vh;
  padding: 32px 18px 65px;
  color: var(--text-primary, #172033);
  background: var(--background-color, transparent);
}

.md-orders * { box-sizing: border-box; }

.md-orders-inner {
  width: min(1050px, 100%);
  margin: 0 auto;
}

.md-orders-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 27px;
}

.md-orders-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--accent-color, #635bff);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.md-orders-header h1 {
  margin: 0 0 8px;
  font-size: clamp(27px, 4vw, 35px);
  font-weight: 850;
  letter-spacing: -1px;
}

.md-orders-header p {
  max-width: 560px;
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.7;
}

.md-orders-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 10px 14px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 10px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
}

.md-orders-back:hover {
  border-color: var(--accent-color, #635bff);
  color: var(--accent-color, #635bff);
}

.md-orders-panel {
  overflow: hidden;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 17px;
  background: var(--surface-color, #fff);
}

.md-orders-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 21px 23px;
  border-bottom: 1px solid var(--border-color, #e7eaf0);
}

.md-orders-panel-heading h2 {
  margin: 0 0 5px;
  font-size: 15px;
  font-weight: 850;
}

.md-orders-panel-heading p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}

.md-orders-count {
  padding: 7px 11px;
  border-radius: 8px;
  background: var(--surface-secondary, #f1f5f9);
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.md-orders-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 57px 22px 62px;
  text-align: center;
}

.md-orders-empty-icon {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  margin-bottom: 20px;
  border-radius: 23px;
  background: var(--surface-secondary, #f1f5f9);
  color: var(--accent-color, #635bff);
  font-size: 30px;
}

.md-orders-empty h3 {
  margin: 0 0 9px;
  font-size: 19px;
  font-weight: 850;
}

.md-orders-empty p {
  max-width: 430px;
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.8;
}

.md-orders-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 23px;
}

.md-orders-primary,
.md-orders-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 43px;
  padding: 0 17px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 800;
}

.md-orders-primary {
  background: var(--accent-color, #635bff);
  color: #fff;
}

.md-orders-primary:hover {
  filter: brightness(.95);
  color: #fff;
}

.md-orders-secondary {
  border: 1px solid var(--border-color, #e7eaf0);
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
}

.md-orders-secondary:hover {
  border-color: var(--accent-color, #635bff);
  color: var(--accent-color, #635bff);
}

.md-orders-notice {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 19px;
  padding: 14px 16px;
  border: 1px solid #d8e5fa;
  border-radius: 11px;
  background: #f5f8ff;
  color: #365b91;
  font-size: 11px;
  line-height: 1.7;
}

.md-orders-notice i {
  margin-top: 2px;
  font-size: 15px;
}

.md-orders-notice strong {
  display: block;
  margin-bottom: 2px;
}

.md-orders-help {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-top: 22px;
  padding: 19px 21px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 14px;
  background: var(--surface-color, #fff);
}

.md-orders-help h3 {
  margin: 0 0 5px;
  font-size: 13px;
  font-weight: 850;
}

.md-orders-help p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.6;
}

.md-orders-help a {
  flex-shrink: 0;
  color: var(--accent-color, #635bff);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.md-orders-signin {
  max-width: 520px;
  margin: 45px auto;
  padding: 38px 25px;
  border: 1px solid var(--border-color, #e7eaf0);
  border-radius: 17px;
  background: var(--surface-color, #fff);
  text-align: center;
}

.md-orders-signin-icon {
  display: grid;
  width: 65px;
  height: 65px;
  place-items: center;
  margin: 0 auto 18px;
  border-radius: 19px;
  background: var(--surface-secondary, #f1f5f9);
  color: var(--accent-color, #635bff);
  font-size: 26px;
}

.md-orders-signin h2 {
  margin: 0 0 9px;
  font-size: 21px;
  font-weight: 850;
}

.md-orders-signin p {
  margin: 0 auto 21px;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 600px) {
  .md-orders {
    padding: 24px 14px 45px;
  }

  .md-orders-header {
    flex-direction: column;
  }

  .md-orders-back {
    width: 100%;
    justify-content: center;
  }

  .md-orders-panel-heading {
    padding: 17px;
  }

  .md-orders-empty {
    padding: 43px 17px;
  }

  .md-orders-help {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;

function getCustomer() {
  try {
    const token = localStorage.getItem("customerToken");
    const customer = JSON.parse(
      localStorage.getItem("customer") || "null"
    );

    return token && customer?.id ? customer : null;
  } catch {
    return null;
  }
}

function Orders() {
  const [customer] = useState(getCustomer);

  return (
    <>
      <style>{styles}</style>

      <main className="md-orders">
        <div className="md-orders-inner">
          {!customer ? (
            <section className="md-orders-signin">
              <div className="md-orders-signin-icon">
                <i className="bi bi-person-lock" />
              </div>

              <h2>Sign in to view your orders</h2>

              <p>
                Your order history belongs to your customer account.
                Sign in to access your purchases and follow their progress.
              </p>

              <Link to="/login" className="md-orders-primary">
                <i className="bi bi-box-arrow-in-right" />
                Sign in
              </Link>
            </section>
          ) : (
            <>
              <header className="md-orders-header">
                <div>
                  <span className="md-orders-eyebrow">
                    <i className="bi bi-bag-check" />
                    Your shopping
                  </span>

                  <h1>My Orders</h1>

                  <p>
                    View your purchases, payment information and delivery
                    progress from your MyDuka stores.
                  </p>
                </div>

                <Link to="/account" className="md-orders-back">
                  <i className="bi bi-arrow-left" />
                  My account
                </Link>
              </header>

              <section className="md-orders-panel">
                <div className="md-orders-panel-heading">
                  <div>
                    <h2>Order history</h2>
                    <p>
                      Your purchases will be listed here.
                    </p>
                  </div>

                  <span className="md-orders-count">
                    Order history
                  </span>
                </div>

                <div className="md-orders-empty">
                  <div className="md-orders-empty-icon">
                    <i className="bi bi-receipt" />
                  </div>

                  <h3>Your orders will appear here</h3>

                  <p>
                    Once your customer order history is connected,
                    you will be able to see order numbers, purchase dates,
                    totals, payment status and fulfilment progress here.
                  </p>

                  <div className="md-orders-empty-actions">
                    <Link to="/" className="md-orders-primary">
                      <i className="bi bi-shop" />
                      Explore stores
                    </Link>

                    <Link to="/track-order" className="md-orders-secondary">
                      <i className="bi bi-geo-alt" />
                      Track an order
                    </Link>
                  </div>
                </div>
              </section>

              <div className="md-orders-notice">
                <i className="bi bi-info-circle" />
                <div>
                  <strong>Order history connection is pending.</strong>
                  Your account is recognised, but this page does not yet
                  retrieve saved orders from the server. No sample or
                  unverified orders are displayed.
                </div>
              </div>

              <section className="md-orders-help">
                <div>
                  <h3>Need help with a purchase?</h3>
                  <p>
                    Contact support if you need assistance with an order.
                  </p>
                </div>

                <Link to="/ask-support">
                  Contact support
                  <i className="bi bi-arrow-right ms-2" />
                </Link>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Orders;
