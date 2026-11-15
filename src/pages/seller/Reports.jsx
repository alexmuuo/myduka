import React, { useMemo, useState } from "react";

const REPORT_TYPES = [
  { value: "overview", label: "Business Overview" },
  { value: "sales", label: "Sales Reports" },
  { value: "pos", label: "POS Sales" },
  { value: "orders", label: "Online Orders" },
  { value: "inventory", label: "Inventory Reports" },
  { value: "payments", label: "Payment Reports" },
];

const INITIAL_DATA = {
  sales: [],
  orders: [],
  posSales: [],
  inventory: [],
  payments: [],
};

const styles = `
.md-reports {
  max-width: 1500px;
  margin: 0 auto;
  padding: 24px;
  color: var(--text-primary, #172033);
}
.md-reports * { box-sizing: border-box; }
.md-reports button,
.md-reports input,
.md-reports select { font: inherit; }
.md-reports button { cursor: pointer; }

.md-reports .mr-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 22px;
}
.md-reports h1 {
  margin: 0 0 7px;
  font-size: 26px;
  font-weight: 750;
}
.md-reports .mr-subtitle {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
}
.md-reports .mr-preview {
  padding: 13px 15px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 20px;
}
.md-reports .mr-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  padding: 17px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
  margin-bottom: 20px;
}
.md-reports .mr-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 150px;
}
.md-reports .mr-field label {
  font-size: 12px;
  font-weight: 700;
}
.md-reports .mr-input,
.md-reports .mr-select {
  width: 100%;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 8px;
  outline: none;
  background: var(--input-bg, var(--card-bg, #fff));
  color: var(--text-primary, #172033);
}
.md-reports .mr-input:focus,
.md-reports .mr-select:focus {
  border-color: var(--primary-color, #2563eb);
}
.md-reports .mr-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 9px;
  background: var(--card-bg, #fff);
  color: var(--text-primary, #172033);
  font-weight: 650;
}
.md-reports .mr-primary {
  background: var(--primary-color, #2563eb);
  border-color: var(--primary-color, #2563eb);
  color: #fff;
}
.md-reports .mr-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.md-reports .mr-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.md-reports .mr-stat {
  padding: 18px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
  min-width: 0;
}
.md-reports .mr-stat-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
.md-reports .mr-stat-value {
  margin-top: 9px;
  font-size: 24px;
  font-weight: 750;
  overflow-wrap: anywhere;
}
.md-reports .mr-stat-note {
  margin-top: 5px;
  color: var(--text-secondary, #64748b);
  font-size: 11px;
}
.md-reports .mr-section {
  margin-bottom: 22px;
}
.md-reports .mr-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 13px;
}
.md-reports .mr-section-heading h2 {
  margin: 0;
  font-size: 17px;
}
.md-reports .mr-panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.md-reports .mr-panel {
  padding: 19px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
  min-width: 0;
}
.md-reports .mr-panel h3 {
  margin: 0 0 15px;
  font-size: 15px;
}
.md-reports .mr-empty-chart {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary, #64748b);
  background: var(--surface-bg, #f8fafc);
  border-radius: 9px;
  padding: 20px;
}
.md-reports .mr-empty-chart-icon {
  font-size: 29px;
  margin-bottom: 8px;
}
.md-reports .mr-empty-chart strong {
  color: var(--text-primary, #172033);
  font-size: 13px;
  margin-bottom: 5px;
}
.md-reports .mr-empty-chart span {
  font-size: 12px;
  line-height: 1.5;
}
.md-reports .mr-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  margin-bottom: 19px;
}
.md-reports .mr-tab {
  padding: 12px 15px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
  font-weight: 650;
}
.md-reports .mr-tab.active {
  color: var(--primary-color, #2563eb);
  border-bottom-color: var(--primary-color, #2563eb);
}
.md-reports .mr-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  background: var(--card-bg, #fff);
}
.md-reports table {
  width: 100%;
  min-width: 650px;
  border-collapse: collapse;
}
.md-reports th,
.md-reports td {
  padding: 14px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  font-size: 13px;
}
.md-reports th {
  background: var(--surface-bg, #f8fafc);
  color: var(--text-secondary, #64748b);
  font-weight: 650;
}
.md-reports tr:last-child td { border-bottom: 0; }
.md-reports .mr-empty-table {
  text-align: center;
  padding: 45px 20px;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
}
.md-reports .mr-empty-table strong {
  display: block;
  color: var(--text-primary, #172033);
  margin-bottom: 7px;
  font-size: 15px;
}
.md-reports .mr-summary-list {
  display: grid;
  gap: 14px;
}
.md-reports .mr-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  font-size: 13px;
}
.md-reports .mr-summary-row span:first-child {
  color: var(--text-secondary, #64748b);
}
.md-reports .mr-summary-row strong {
  font-weight: 700;
  text-align: right;
}
.md-reports .mr-note {
  margin-top: 18px;
  padding: 13px;
  border-radius: 9px;
  background: var(--surface-bg, #f8fafc);
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.5;
}
@media (max-width: 950px) {
  .md-reports .mr-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 650px) {
  .md-reports { padding: 16px; }
  .md-reports h1 { font-size: 22px; }
  .md-reports .mr-panel-grid { grid-template-columns: 1fr; }
  .md-reports .mr-controls { padding: 13px; }
  .md-reports .mr-field { flex-basis: 100%; }
}
`;

function money(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function EmptyChart({ title, description }) {
  return (
    <div className="mr-empty-chart">
      <div className="mr-empty-chart-icon">📊</div>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function exportReport(reportType, data, filters) {
  const report = {
    report: REPORT_TYPES.find((item) => item.value === reportType)?.label,
    generatedAt: new Date().toISOString(),
    filters,
    records: data,
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `myduka-${reportType}-report.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [data] = useState(INITIAL_DATA);

  const [reportType, setReportType] = useState("overview");
  const [activeTab, setActiveTab] = useState("summary");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branch, setBranch] = useState("all");

  const totalSales = useMemo(
    () => data.sales.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [data.sales]
  );

  const totalPOS = useMemo(
    () => data.posSales.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [data.posSales]
  );

  const totalOrders = data.orders.length;
  const totalPayments = data.payments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalInventory = data.inventory.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const combinedSales = totalSales + totalPOS;

  const reportRecords = useMemo(() => {
    const source = {
      overview: [
        ...data.sales,
        ...data.posSales,
        ...data.orders,
        ...data.inventory,
        ...data.payments,
      ],
      sales: data.sales,
      pos: data.posSales,
      orders: data.orders,
      inventory: data.inventory,
      payments: data.payments,
    };

    return source[reportType] || [];
  }, [data, reportType]);

  function handleExport() {
    exportReport(reportType, reportRecords, {
      startDate,
      endDate,
      branch,
    });
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setBranch("all");
  }

  const reportHeading =
    REPORT_TYPES.find((item) => item.value === reportType)?.label ||
    "Business Overview";

  return (
    <div className="md-reports">
      <style>{styles}</style>

      <div className="mr-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="mr-subtitle">
            Understand your business performance through detailed reports.
          </p>
        </div>

        <button
          className="mr-btn mr-primary"
          onClick={handleExport}
          disabled={!reportRecords.length}
        >
          ↓ Export Report
        </button>
      </div>

      <div className="mr-preview">
        <strong>Frontend preview:</strong> This page currently has no connected
        business records. All figures therefore remain zero and charts show
        empty states rather than invented business data. Once the backend is
        connected, reports will use actual records from your business database.
      </div>

      <div className="mr-controls">
        <div className="mr-field">
          <label>Report type</label>
          <select
            className="mr-select"
            value={reportType}
            onChange={(event) => {
              setReportType(event.target.value);
              setActiveTab("summary");
            }}
          >
            {REPORT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mr-field">
          <label>Start date</label>
          <input
            className="mr-input"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="mr-field">
          <label>End date</label>
          <input
            className="mr-input"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="mr-field">
          <label>Branch</label>
          <select
            className="mr-select"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
          >
            <option value="all">All branches</option>
          </select>
        </div>

        <button className="mr-btn" onClick={clearFilters}>
          Reset Filters
        </button>
      </div>

      {reportType === "overview" && (
        <>
          <div className="mr-stats">
            <div className="mr-stat">
              <div className="mr-stat-label">Combined Sales</div>
              <div className="mr-stat-value">{money(combinedSales)}</div>
              <div className="mr-stat-note">Online and POS sales</div>
            </div>

            <div className="mr-stat">
              <div className="mr-stat-label">Online Orders</div>
              <div className="mr-stat-value">{totalOrders}</div>
              <div className="mr-stat-note">Total recorded orders</div>
            </div>

            <div className="mr-stat">
              <div className="mr-stat-label">Payments Received</div>
              <div className="mr-stat-value">{money(totalPayments)}</div>
              <div className="mr-stat-note">Recorded payment amounts</div>
            </div>

            <div className="mr-stat">
              <div className="mr-stat-label">Inventory Quantity</div>
              <div className="mr-stat-value">
                {totalInventory.toLocaleString("en-KE")}
              </div>
              <div className="mr-stat-note">Total recorded units</div>
            </div>
          </div>

          <div className="mr-section">
            <div className="mr-section-heading">
              <h2>Business Performance</h2>
            </div>

            <div className="mr-panel-grid">
              <div className="mr-panel">
                <h3>Sales Performance</h3>
                <EmptyChart
                  title="No sales data available"
                  description="Sales trends and revenue charts will appear here when actual sales records are connected."
                />
              </div>

              <div className="mr-panel">
                <h3>Sales by Channel</h3>
                <EmptyChart
                  title="No channel data available"
                  description="Online and POS sales comparisons will appear here."
                />
              </div>

              <div className="mr-panel">
                <h3>Payment Methods</h3>
                <EmptyChart
                  title="No payment data available"
                  description="Payment method distribution will appear here."
                />
              </div>

              <div className="mr-panel">
                <h3>Inventory Performance</h3>
                <EmptyChart
                  title="No inventory data available"
                  description="Stock levels and inventory valuation will appear here."
                />
              </div>
            </div>
          </div>
        </>
      )}

      {reportType !== "overview" && (
        <>
          <div className="mr-stats">
            <div className="mr-stat">
              <div className="mr-stat-label">Report Category</div>
              <div className="mr-stat-value" style={{ fontSize: 18 }}>
                {reportHeading}
              </div>
              <div className="mr-stat-note">Selected report</div>
            </div>

            <div className="mr-stat">
              <div className="mr-stat-label">Records</div>
              <div className="mr-stat-value">{reportRecords.length}</div>
              <div className="mr-stat-note">Available records</div>
            </div>

            <div className="mr-stat">
              <div className="mr-stat-label">Report Period</div>
              <div className="mr-stat-value" style={{ fontSize: 16 }}>
                {startDate || endDate ? "Custom" : "All time"}
              </div>
              <div className="mr-stat-note">
                {startDate || "Beginning"} – {endDate || "Today"}
              </div>
            </div>

            <div className="mr-stat">
              <div className="mr-stat-label">Branch</div>
              <div className="mr-stat-value" style={{ fontSize: 18 }}>
                {branch === "all" ? "All branches" : branch}
              </div>
              <div className="mr-stat-note">Selected branch</div>
            </div>
          </div>

          <div className="mr-tabs">
            <button
              className={`mr-tab ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>

            <button
              className={`mr-tab ${activeTab === "records" ? "active" : ""}`}
              onClick={() => setActiveTab("records")}
            >
              Detailed Records
            </button>

            <button
              className={`mr-tab ${activeTab === "analysis" ? "active" : ""}`}
              onClick={() => setActiveTab("analysis")}
            >
              Analysis
            </button>
          </div>

          {activeTab === "summary" && (
            <div className="mr-panel-grid">
              <div className="mr-panel">
                <h3>{reportHeading} Summary</h3>

                <div className="mr-summary-list">
                  <div className="mr-summary-row">
                    <span>Total records</span>
                    <strong>{reportRecords.length}</strong>
                  </div>

                  <div className="mr-summary-row">
                    <span>Report period</span>
                    <strong>
                      {startDate || "All time"} – {endDate || "Today"}
                    </strong>
                  </div>

                  <div className="mr-summary-row">
                    <span>Branch</span>
                    <strong>
                      {branch === "all" ? "All branches" : branch}
                    </strong>
                  </div>
                </div>

                <div className="mr-note">
                  Detailed figures will be calculated from actual database
                  records after backend integration.
                </div>
              </div>

              <div className="mr-panel">
                <h3>Report Visualization</h3>
                <EmptyChart
                  title="Waiting for records"
                  description="Charts and comparisons will be generated from real business activity."
                />
              </div>
            </div>
          )}

          {activeTab === "records" && (
            <div className="mr-table-wrap">
              {reportRecords.length === 0 ? (
                <div className="mr-empty-table">
                  <strong>No records available</strong>
                  Records for this report will appear here after backend integration.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>REFERENCE</th>
                      <th>DATE</th>
                      <th>DESCRIPTION</th>
                      <th>AMOUNT / QUANTITY</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRecords.map((record, index) => (
                      <tr key={record.id || index}>
                        <td>{record.reference || record.id || "—"}</td>
                        <td>{record.date || "—"}</td>
                        <td>{record.description || record.name || "—"}</td>
                        <td>
                          {record.amount !== undefined
                            ? money(record.amount)
                            : record.quantity ?? "—"}
                        </td>
                        <td>{record.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="mr-panel-grid">
              <div className="mr-panel">
                <h3>Performance Analysis</h3>
                <EmptyChart
                  title="Analysis unavailable"
                  description="Trend analysis requires historical business records."
                />
              </div>

              <div className="mr-panel">
                <h3>Comparison</h3>
                <EmptyChart
                  title="No comparison data"
                  description="Period-to-period and branch comparisons will appear here."
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="mr-note">
        <strong>Reporting principles:</strong> Online orders and POS sales will
        remain identifiable as separate channels. Cancelled sales, refunds,
        voids and completed transactions must be accounted for separately.
        Inventory valuation will use recorded stock receipt costs, including
        historical buying prices, rather than simply using the latest product
        catalogue price.
      </div>
    </div>
  );
}
