import { useMemo, useState } from "react";

const styles = `
.md-subscription {
  width: 100%;
  color: var(--text-primary, #172033);
  padding: 4px 0 30px;
}

.md-subscription * {
  box-sizing: border-box;
}

.md-subscription .sub-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.md-subscription .sub-header h1 {
  margin: 0 0 7px;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.6px;
}

.md-subscription .sub-header p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
}

.md-subscription .sub-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--surface-secondary, #f8fafc);
  color: var(--text-secondary, #64748b);
  border-radius: 30px;
  padding: 8px 13px;
  font-size: 12px;
  font-weight: 650;
}

.md-subscription .sub-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.md-subscription .sub-banner {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 16px;
  margin-bottom: 23px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  border-radius: 13px;
  color: #1e40af;
}

.md-subscription .sub-banner-icon {
  width: 35px;
  height: 35px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: #dbeafe;
  border-radius: 10px;
  font-size: 17px;
}

.md-subscription .sub-banner strong {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
}

.md-subscription .sub-banner p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

.md-subscription .sub-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.md-subscription .sub-card {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 15px;
  padding: 19px;
  min-width: 0;
}

.md-subscription .sub-stat-label {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  margin-bottom: 10px;
}

.md-subscription .sub-stat-value {
  font-size: 20px;
  font-weight: 750;
  margin-bottom: 5px;
}

.md-subscription .sub-stat-note {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}

.md-subscription .sub-section {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 15px;
  margin-bottom: 22px;
  overflow: hidden;
}

.md-subscription .sub-section-head {
  padding: 19px 20px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.md-subscription .sub-section-head h2 {
  font-size: 15px;
  font-weight: 750;
  margin: 0 0 5px;
}

.md-subscription .sub-section-head p {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin: 0;
}

.md-subscription .sub-section-body {
  padding: 20px;
}

.md-subscription .sub-empty {
  text-align: center;
  padding: 35px 20px;
}

.md-subscription .sub-empty-icon {
  width: 55px;
  height: 55px;
  display: grid;
  place-items: center;
  margin: 0 auto 14px;
  background: var(--surface-secondary, #f1f5f9);
  border-radius: 15px;
  font-size: 23px;
}

.md-subscription .sub-empty h3 {
  margin: 0 0 7px;
  font-size: 15px;
}

.md-subscription .sub-empty p {
  max-width: 440px;
  margin: 0 auto;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary, #64748b);
}

.md-subscription .sub-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.md-subscription .sub-detail {
  padding-bottom: 13px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.md-subscription .sub-detail-label {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  margin-bottom: 7px;
}

.md-subscription .sub-detail-value {
  font-size: 13px;
  font-weight: 650;
}

.md-subscription .sub-tabs {
  display: flex;
  gap: 5px;
  padding: 5px;
  background: var(--surface-secondary, #f1f5f9);
  border-radius: 10px;
  width: fit-content;
  margin-bottom: 20px;
}

.md-subscription .sub-tab {
  border: 0;
  background: transparent;
  color: var(--text-secondary, #64748b);
  padding: 9px 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.md-subscription .sub-tab.active {
  background: var(--surface-color, #fff);
  color: var(--text-primary, #172033);
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}

.md-subscription .sub-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.md-subscription table {
  width: 100%;
  border-collapse: collapse;
  min-width: 550px;
}

.md-subscription th {
  text-align: left;
  padding: 12px 15px;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  font-weight: 700;
  background: var(--surface-secondary, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.md-subscription td {
  padding: 14px 15px;
  font-size: 12px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.md-subscription .sub-muted {
  color: var(--text-secondary, #64748b);
}

.md-subscription .sub-help {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 17px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--surface-secondary, #f8fafc);
  border-radius: 12px;
  margin-top: 20px;
}

.md-subscription .sub-help-icon {
  font-size: 19px;
}

.md-subscription .sub-help strong {
  display: block;
  font-size: 12px;
  margin-bottom: 5px;
}

.md-subscription .sub-help p {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.6;
  margin: 0;
}

.md-subscription .sub-btn {
  border: 1px solid var(--border-color, #cbd5e1);
  color: var(--text-primary, #172033);
  background: var(--surface-color, #fff);
  border-radius: 9px;
  padding: 9px 13px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.md-subscription .sub-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

@media (max-width: 800px) {
  .md-subscription .sub-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 540px) {
  .md-subscription .sub-grid {
    grid-template-columns: 1fr;
  }

  .md-subscription .sub-details {
    grid-template-columns: 1fr;
  }

  .md-subscription .sub-section-head,
  .md-subscription .sub-section-body {
    padding: 15px;
  }

  .md-subscription .sub-header h1 {
    font-size: 22px;
  }
}
`;

const EMPTY_VALUE = "Not available";

export default function Subscription() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "plans", label: "Plans" },
      { id: "billing", label: "Billing history" },
    ],
    []
  );

  return (
    <div className="md-subscription">
      <style>{styles}</style>

      <div className="sub-header">
        <div>
          <h1>Subscription</h1>
          <p>Manage your MyDuka subscription, plans and billing.</p>
        </div>

        <div className="sub-badge">
          <span className="sub-dot" />
          Subscription not connected
        </div>
      </div>

      <div className="sub-banner">
        <div className="sub-banner-icon">ⓘ</div>
        <div>
          <strong>Subscription management is awaiting backend integration</strong>
          <p>
            This page is currently a frontend preview. Subscription status,
            plan pricing, invoices and payment information will appear here
            once the subscription service is connected.
          </p>
        </div>
      </div>

      <div className="sub-grid">
        <div className="sub-card">
          <div className="sub-stat-label">Current plan</div>
          <div className="sub-stat-value">—</div>
          <div className="sub-stat-note">No plan information available</div>
        </div>

        <div className="sub-card">
          <div className="sub-stat-label">Subscription status</div>
          <div className="sub-stat-value">—</div>
          <div className="sub-stat-note">Awaiting subscription connection</div>
        </div>

        <div className="sub-card">
          <div className="sub-stat-label">Next billing date</div>
          <div className="sub-stat-value">—</div>
          <div className="sub-stat-note">No billing schedule available</div>
        </div>
      </div>

      <div className="sub-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sub-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <section className="sub-section">
            <div className="sub-section-head">
              <div>
                <h2>Current subscription</h2>
                <p>Your business subscription details.</p>
              </div>
            </div>

            <div className="sub-section-body">
              <div className="sub-empty">
                <div className="sub-empty-icon">◈</div>
                <h3>No active subscription information</h3>
                <p>
                  Your subscription details will appear here after the
                  subscription service is connected. You will be able to
                  view your plan, billing cycle, renewal date and account
                  limits.
                </p>
              </div>

              <div className="sub-details">
                <div className="sub-detail">
                  <div className="sub-detail-label">Plan name</div>
                  <div className="sub-detail-value">{EMPTY_VALUE}</div>
                </div>

                <div className="sub-detail">
                  <div className="sub-detail-label">Billing cycle</div>
                  <div className="sub-detail-value">{EMPTY_VALUE}</div>
                </div>

                <div className="sub-detail">
                  <div className="sub-detail-label">Subscription start</div>
                  <div className="sub-detail-value">{EMPTY_VALUE}</div>
                </div>

                <div className="sub-detail">
                  <div className="sub-detail-label">Next renewal</div>
                  <div className="sub-detail-value">{EMPTY_VALUE}</div>
                </div>

                <div className="sub-detail">
                  <div className="sub-detail-label">Branches allowed</div>
                  <div className="sub-detail-value">{EMPTY_VALUE}</div>
                </div>

                <div className="sub-detail">
                  <div className="sub-detail-label">Staff accounts allowed</div>
                  <div className="sub-detail-value">{EMPTY_VALUE}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="sub-section">
            <div className="sub-section-head">
              <div>
                <h2>Payment method</h2>
                <p>Payment method used for subscription billing.</p>
              </div>
            </div>

            <div className="sub-empty">
              <div className="sub-empty-icon">▤</div>
              <h3>No payment method connected</h3>
              <p>
                Once billing is enabled, you will be able to manage your
                supported payment methods securely.
              </p>
            </div>
          </section>
        </>
      )}

      {activeTab === "plans" && (
        <section className="sub-section">
          <div className="sub-section-head">
            <div>
              <h2>Available plans</h2>
              <p>Explore subscription options for your business.</p>
            </div>
          </div>

          <div className="sub-section-body">
            <div className="sub-empty">
              <div className="sub-empty-icon">◇</div>
              <h3>Subscription plans are not published yet</h3>
              <p>
                MyDuka plan names, features, limits and prices will be
                configured through the Super Admin subscription management
                system. Published plans will appear here automatically.
              </p>
            </div>

            <div className="sub-help">
              <div className="sub-help-icon">💡</div>
              <div>
                <strong>How plan selection will work</strong>
                <p>
                  You will be able to compare available plans, review their
                  features and limits, select a billing cycle and request or
                  complete an upgrade. No payment will be initiated from
                  this preview.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "billing" && (
        <section className="sub-section">
          <div className="sub-section-head">
            <div>
              <h2>Billing history</h2>
              <p>Review subscription payments and invoices.</p>
            </div>

            <button className="sub-btn" type="button" disabled>
              Download invoices
            </button>
          </div>

          <div className="sub-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td colSpan="6">
                    <div className="sub-empty">
                      <div className="sub-empty-icon">▤</div>
                      <h3>No billing records</h3>
                      <p>
                        Your subscription invoices and payment history
                        will appear here once billing is connected.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="sub-help">
        <div className="sub-help-icon">🔒</div>
        <div>
          <strong>Secure subscription management</strong>
          <p>
            Actual subscription payments, invoices, plan changes and
            billing records will be handled by the backend. Payment
            credentials will not be stored directly in this frontend.
          </p>
        </div>
      </div>
    </div>
  );
}
