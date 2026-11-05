import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

function Reports() {
const [overview, setOverview] = useState(null);
const [sales, setSales] = useState(null);
const [products, setProducts] = useState(null);
const [deliveries, setDeliveries] = useState(null);
const [profit, setProfit] = useState(null);

const [posOverview, setPosOverview] = useState(null);
const [posSales, setPosSales] = useState(null);
const [posProducts, setPosProducts] = useState(null);
const [branchReports, setBranchReports] = useState([]);

const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [branches, setBranches] = useState([]);
const [selectedBranchId, setSelectedBranchId] = useState("");
const [branchesLoading, setBranchesLoading] = useState(true);
const [branchLoadError, setBranchLoadError] = useState("");

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [posError, setPosError] = useState("");
const [exportingExcel, setExportingExcel] = useState(false);

const [activeReport, setActiveReport] = useState("overview");

// =========================================================
// HELPERS
// =========================================================

const formatMoney = (amount) =>
new Intl.NumberFormat("en-KE", {
style: "currency",
currency: "KES",
minimumFractionDigits: 2,
maximumFractionDigits: 2,
}).format(Number(amount) || 0);

const formatNumber = (number) =>
new Intl.NumberFormat("en-KE").format(Number(number) || 0);

const formatPercent = (number) =>
`${formatNumber(Number(number) || 0)}%`;

const formatDate = (date) => {
if (!date) return "—";


const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) return String(date);

return parsedDate.toLocaleDateString("en-KE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});


};

const formatDateTime = (date) => {
if (!date) return "—";


const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) return String(date);

return parsedDate.toLocaleString("en-KE", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});


};

const extractData = (response) => {
const data = response?.data;


if (data?.status === "error") {
  throw new Error(data.message || "Could not load report.");
}

return data;


};

const getValue = (object, ...keys) => {
for (const key of keys) {
if (
object?.[key] !== undefined &&
object?.[key] !== null
) {
return object[key];
}
}


return 0;


};

const getOptionalValue = (object, ...keys) => {
for (const key of keys) {
if (
object?.[key] !== undefined &&
object?.[key] !== null
) {
return object[key];
}
}


return null;


};

const getArray = (object, ...keys) => {
for (const key of keys) {
if (Array.isArray(object?.[key])) {
return object[key];
}
}


return [];


};

const unwrap = (data, ...keys) => {
for (const key of keys) {
if (
data?.[key] !== undefined &&
data?.[key] !== null
) {
return data[key];
}
}


return data || {};


};

const getProfit = (item) =>
getOptionalValue(
item,
"gross_profit",
"total_profit",
"profit"
);

const getMargin = (item) => {
const suppliedMargin = getOptionalValue(
item,
"profit_margin",
"margin_percentage",
"margin"
);


if (suppliedMargin !== null) {
  return Number(suppliedMargin) || 0;
}

const revenue = Number(
  getValue(
    item,
    "total_sales",
    "total_revenue",
    "revenue",
    "subtotal",
    "sales_total"
  )
);

const profitValue = getProfit(item);

if (revenue <= 0 || profitValue === null) return null;

return (Number(profitValue) / revenue) * 100;


};

const getTransactionReference = (item) =>
item?.sale_number ??
item?.transaction_reference ??
item?.reference ??
item?.receipt_number ??
item?.sale_id ??
item?.id ??
"—";

// =========================================================
// LOAD BRANCHES FOR THE POS REPORT FILTER
// =========================================================

useEffect(() => {
  let cancelled = false;

  const loadBranches = async () => {
    setBranchesLoading(true);
    setBranchLoadError("");

    try {
      const response = await api.get("/admin/branches");
      const data = response?.data;

      if (data?.status === "error") {
        throw new Error(data.message || "Unable to load branches.");
      }

      const branchRows = Array.isArray(data)
        ? data
        : Array.isArray(data?.branches)
          ? data.branches
          : [];

      if (!cancelled) {
        setBranches(branchRows);
      }
    } catch (err) {
      console.error("Failed to load report branches:", err);

      if (!cancelled) {
        setBranchLoadError(
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load branches."
        );
      }
    } finally {
      if (!cancelled) {
        setBranchesLoading(false);
      }
    }
  };

  loadBranches();

  return () => {
    cancelled = true;
  };
}, []);

// =========================================================
// LOAD REPORTS
// Website reports remain global.
// Every POS report request receives the selected branch_id.
// =========================================================

const loadReports = useCallback(async () => {
setLoading(true);
setError("");
setPosError("");


const params = {};

if (startDate) params.start_date = startDate;
if (endDate) params.end_date = endDate;

const posParams = {
  ...params,
  ...(selectedBranchId
    ? { branch_id: Number(selectedBranchId) }
    : {}),
};

try {
  const websiteRequests = await Promise.allSettled([
    api.get("/admin/reports/overview", { params }),
    api.get("/admin/reports/sales", { params }),
    api.get("/admin/reports/products", { params }),
    api.get("/admin/reports/deliveries", { params }),
    api.get("/admin/reports/profit", { params }),
  ]);

  const websiteSetters = [
    setOverview,
    setSales,
    setProducts,
    setDeliveries,
    setProfit,
  ];

  const websiteErrors = [];

  websiteRequests.forEach((result, index) => {
    if (result.status === "fulfilled") {
      try {
        websiteSetters[index](extractData(result.value));
      } catch (err) {
        websiteErrors.push(err.message);
      }
    } else {
      websiteErrors.push(
        result.reason?.response?.data?.message ||
          result.reason?.message ||
          "A website report could not be loaded."
      );
    }
  });

  if (websiteErrors.length) {
    console.error("Website reports:", websiteErrors);
    setError(websiteErrors[0]);
  }

  const posRequests = await Promise.allSettled([
    api.get("/admin/reports/pos/overview", { params: posParams }),
    api.get("/admin/reports/pos/sales", { params: posParams }),
    api.get("/admin/reports/pos/products", { params: posParams }),
    api.get("/admin/reports/pos/branches", { params: posParams }),
  ]);

  const posSetters = [
    setPosOverview,
    setPosSales,
    setPosProducts,
    setBranchReports,
  ];

  const posErrors = [];

  posRequests.forEach((result, index) => {
    if (result.status === "fulfilled") {
      try {
        const data = extractData(result.value);

        if (index === 3) {
          posSetters[index](
            Array.isArray(data)
              ? data
              : getArray(
                  data,
                  "branches",
                  "reports",
                  "items"
                )
          );
        } else {
          posSetters[index](data);
        }
      } catch (err) {
        posErrors.push(err.message);
      }
    } else {
      posErrors.push(
        result.reason?.response?.data?.message ||
          result.reason?.message ||
          "A POS report could not be loaded."
      );
    }
  });

  if (posErrors.length) {
    console.error("POS reports:", posErrors);
    setPosError(
      "Some POS reports could not be loaded. Check the backend response and the browser console."
    );
  }
} catch (err) {
  console.error("Reports loading error:", err);

  setError(
    err?.response?.data?.message ||
      err?.message ||
      "Could not load reports."
  );
} finally {
  setLoading(false);
}


}, [startDate, endDate, selectedBranchId]);

useEffect(() => {
loadReports();
}, [loadReports]);

// =========================================================
// EXPORT ALL POS REPORTS TO EXCEL
// Uses the same date filters as the report dashboard.
// This export contains cashier POS records, not website orders.
// =========================================================

const exportPosReportsToExcel = async () => {
  setExportingExcel(true);
  setPosError("");

  try {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedBranchId) {
      params.branch_id = Number(selectedBranchId);
    }

    const response = await api.get(
      "/admin/reports/pos/export.xlsx",
      {
        params,
        responseType: "blob",
      }
    );

    const blob = new Blob(
      [response.data],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);

    const selectedBranch = branches.find(
      (branch) => String(branch.id) === String(selectedBranchId)
    );
    const branchFileName = selectedBranchId
      ? (selectedBranch?.name || `Branch_${selectedBranchId}`)
          .replace(/[^a-z0-9_-]+/gi, "_")
      : "All_Branches";

    link.href = downloadUrl;
    link.download = `MyDuka_POS_Reports_${branchFileName}_${datePart}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    let message =
      err?.response?.data?.message ||
      err?.message ||
      "Could not export the POS reports to Excel.";

    // With responseType='blob', a JSON error response may also arrive as a Blob.
    if (err?.response?.data instanceof Blob) {
      try {
        const errorText = await err.response.data.text();
        const errorData = JSON.parse(errorText);
        message = errorData?.message || message;
      } catch {
        // Keep the useful fallback message if the response was not JSON.
      }
    }

    setPosError(message);
  } finally {
    setExportingExcel(false);
  }
};

// =========================================================
// NORMALIZE RESPONSE DATA
// =========================================================

const overviewData = unwrap(overview, "overview", "data");
const salesData = unwrap(sales, "sales", "data");
const productsData = unwrap(products, "products", "data");
const deliveriesData = unwrap(
deliveries,
"deliveries",
"data"
);
const profitData = unwrap(profit, "profit", "data");

const posOverviewData = unwrap(
posOverview,
"overview",
"data"
);
const posSalesData = unwrap(posSales, "sales", "data");
const posProductsData = unwrap(
posProducts,
"products",
"data"
);

const productList = Array.isArray(productsData)
? productsData
: getArray(
productsData,
"top_products",
"best_selling_products",
"products",
"items"
);

const salesList = Array.isArray(salesData)
? salesData
: getArray(
salesData,
"daily_sales",
"sales_by_date",
"sales",
"items"
);

const deliveryList = Array.isArray(deliveriesData)
? deliveriesData
: getArray(
deliveriesData,
"delivery_statuses",
"status_breakdown",
"deliveries",
"items"
);

const posSalesList = Array.isArray(posSalesData)
? posSalesData
: getArray(
posSalesData,
"daily_sales",
"sales_by_date",
"sales",
"transactions",
"items"
);

const posProductList = Array.isArray(posProductsData)
? posProductsData
: getArray(
posProductsData,
"top_products",
"best_selling_products",
"products",
"items"
);

const posTransactionList = getArray(
posSalesData,
"transactions",
"sales_records",
"sale_records"
);

const posRevenue = Number(
getValue(
posOverviewData,
"total_sales",
"total_revenue",
"sales_total"
)
);

const posCost = getOptionalValue(
posOverviewData,
"total_cost",
"total_buying_cost",
"cost_of_goods",
"total_cost_of_goods"
);

const posGrossProfit = getOptionalValue(
posOverviewData,
"gross_profit",
"total_profit",
"profit"
);

const posMargin = getOptionalValue(
posOverviewData,
"profit_margin",
"margin_percentage"
);

const posUnknownCostSales = getValue(
posOverviewData,
"unknown_cost_sales",
"sales_with_unknown_cost",
"unaccounted_cost_sales"
);

// =========================================================
// REUSABLE COMPONENTS
// =========================================================

const StatCard = ({
title,
value,
icon,
color = "success",
subtitle,
}) => ( <div className="col-12 col-sm-6 col-xl-3"> <div className="card border-0 shadow-sm h-100"> <div className="card-body p-4"> <div className="d-flex justify-content-between align-items-start gap-3"> <div className="min-w-0"> <p className="text-muted small mb-2">{title}</p> <h3 className="fw-bold mb-2 text-break">{value}</h3>


          {subtitle && (
            <small className="text-muted">{subtitle}</small>
          )}
        </div>

        <div
          className={`rounded-3 bg-${color}-subtle text-${color} p-3`}
        >
          <i className={`bi ${icon} fs-4`}></i>
        </div>
      </div>
    </div>
  </div>
</div>


);

const EmptyState = ({ icon, message }) => ( <div className="text-center text-muted py-5">
<i className={`bi ${icon} fs-1 d-block mb-3`}></i>
{message} </div>
);

const ReportTabs = [
{
id: "overview",
label: "Website Overview",
icon: "bi-speedometer2",
},
{
id: "sales",
label: "Website Sales",
icon: "bi-currency-exchange",
},
{
id: "products",
label: "Website Products",
icon: "bi-box-seam",
},
{
id: "deliveries",
label: "Deliveries",
icon: "bi-truck",
},
{
id: "profit",
label: "Website Profit",
icon: "bi-graph-up-arrow",
},
{
id: "pos",
label: "POS Reports",
icon: "bi-shop",
},
{
id: "branches",
label: "Branch Reports",
icon: "bi-diagram-3",
},
];

// =========================================================
// LOADING STATE
// =========================================================

if (
loading &&
!overview &&
!sales &&
!products &&
!deliveries &&
!profit
) {
return ( <div className="container-fluid p-4"> <div className="d-flex flex-column align-items-center justify-content-center py-5"> <div
         className="spinner-border text-success mb-3"
         role="status"
       > <span className="visually-hidden">Loading...</span> </div>


      <h5>Loading Reports &amp; Analytics...</h5>
      <p className="text-muted">
        Please wait while we prepare your reports.
      </p>
    </div>
  </div>
);


}

// =========================================================
// MAIN DASHBOARD
// =========================================================

return ( <div className="container-fluid p-3 p-md-4 bg-light min-vh-100"> <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4"> <div> <h2 className="fw-bold mb-1"> <i className="bi bi-graph-up-arrow text-success me-2"></i>
Reports & Analytics </h2>


      <p className="text-muted mb-0">
        Review website performance, POS transactions, profitability,
        and branch performance separately.
      </p>
    </div>

    <div className="d-flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-outline-success"
        onClick={exportPosReportsToExcel}
        disabled={exportingExcel}
        title="Export POS sales, items, payments, branch performance, and product performance to Excel"
      >
        <i
          className={`bi ${
            exportingExcel ? "bi-arrow-repeat" : "bi-file-earmark-excel"
          } me-2`}
        ></i>
        {exportingExcel ? "Preparing Excel..." : "Export POS Reports to Excel"}
      </button>

      <button
        type="button"
        className="btn btn-success"
        onClick={loadReports}
        disabled={loading}
      >
        <i
          className={`bi ${
            loading ? "bi-arrow-repeat" : "bi-arrow-clockwise"
          } me-2`}
        ></i>
        {loading ? "Refreshing..." : "Refresh Reports"}
      </button>
    </div>
  </div>

  {/* REPORT FILTERS */}

  <div className="card border-0 shadow-sm mb-4">
    <div className="card-body">
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-3">
          <label
            htmlFor="startDate"
            className="form-label fw-semibold"
          >
            Start date
          </label>

          <input
            id="startDate"
            type="date"
            className="form-control"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="col-12 col-md-3">
          <label
            htmlFor="endDate"
            className="form-label fw-semibold"
          >
            End date
          </label>

          <input
            id="endDate"
            type="date"
            className="form-control"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="col-12 col-md-3">
          <label
            htmlFor="reportBranch"
            className="form-label fw-semibold"
          >
            POS Branch
          </label>

          <select
            id="reportBranch"
            className="form-select"
            value={selectedBranchId}
            disabled={branchesLoading}
            onChange={(event) => setSelectedBranchId(event.target.value)}
          >
            <option value="">
              {branchesLoading ? "Loading branches..." : "All Branches"}
            </option>

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name || `Branch ${branch.id}`}
              </option>
            ))}
          </select>

          {branchLoadError && (
            <small className="text-danger d-block mt-1">
              {branchLoadError}
            </small>
          )}
          <small className="text-muted">
            Applies to POS reports only.
          </small>
        </div>

        <div className="col-12 col-md-3 d-flex gap-2">
          <button
            type="button"
            className="btn btn-success flex-grow-1"
            onClick={loadReports}
            disabled={loading}
          >
            <i className="bi bi-funnel me-1"></i>
            Apply
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSelectedBranchId("");
            }}
            title="Clear all report filters"
            aria-label="Clear all report filters"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  {error && (
    <div className="alert alert-danger" role="alert">
      <strong>Website reports:</strong> {error}

      <button
        type="button"
        className="btn btn-sm btn-outline-danger ms-3"
        onClick={loadReports}
      >
        Retry
      </button>
    </div>
  )}

  {/* NAVIGATION */}

  <div className="d-flex gap-2 flex-wrap mb-4">
    {ReportTabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        className={`btn ${
          activeReport === tab.id
            ? "btn-success"
            : "btn-outline-success"
        }`}
        onClick={() => setActiveReport(tab.id)}
      >
        <i className={`bi ${tab.icon} me-2`}></i>
        {tab.label}
      </button>
    ))}
  </div>

  {loading && (
    <div className="alert alert-info py-2">
      <span
        className="spinner-border spinner-border-sm me-2"
        role="status"
      ></span>
      Updating report data...
    </div>
  )}

  {/* WEBSITE OVERVIEW */}

  {activeReport === "overview" && (
    <>
      <div className="row g-3 mb-4">
        <StatCard
          title="Website Orders"
          value={formatNumber(
            getValue(
              overviewData,
              "total_orders",
              "orders_count"
            )
          )}
          icon="bi-receipt"
          color="primary"
          subtitle="Website orders only"
        />

        <StatCard
          title="Website Sales"
          value={formatMoney(
            getValue(
              overviewData,
              "total_sales",
              "total_revenue",
              "sales_total"
            )
          )}
          icon="bi-currency-exchange"
          color="success"
          subtitle="Website order value"
        />

        <StatCard
          title="Customers"
          value={formatNumber(
            getValue(
              overviewData,
              "total_customers",
              "customers_count"
            )
          )}
          icon="bi-people"
          color="info"
          subtitle="Registered customers"
        />

        <StatCard
          title="Products"
          value={formatNumber(
            getValue(
              overviewData,
              "total_products",
              "products_count"
            )
          )}
          icon="bi-box-seam"
          color="warning"
          subtitle="Product catalogue"
        />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">
                Website Sales Summary
              </h5>
            </div>

            <div className="card-body">
              <div className="d-flex justify-content-between border-bottom py-3 gap-3">
                <span className="text-muted">Total sales</span>
                <strong>
                  {formatMoney(
                    getValue(
                      salesData,
                      "total_sales",
                      "total_revenue",
                      "sales_total"
                    )
                  )}
                </strong>
              </div>

              <div className="d-flex justify-content-between border-bottom py-3 gap-3">
                <span className="text-muted">
                  Completed order value
                </span>
                <strong>
                  {formatMoney(
                    getValue(
                      overviewData,
                      "completed_sales",
                      "completed_order_value",
                      "completed_revenue"
                    )
                  )}
                </strong>
              </div>

              <div className="d-flex justify-content-between py-3 gap-3">
                <span className="text-muted">
                  Average order value
                </span>
                <strong>
                  {formatMoney(
                    getValue(
                      overviewData,
                      "average_order_value",
                      "average_order"
                    )
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">
                Delivery Summary
              </h5>
            </div>

            <div className="card-body">
              <div className="d-flex justify-content-between border-bottom py-3 gap-3">
                <span className="text-muted">
                  Total deliveries
                </span>
                <strong>
                  {formatNumber(
                    getValue(
                      deliveriesData,
                      "total_deliveries",
                      "total",
                      "count"
                    )
                  )}
                </strong>
              </div>

              <div className="d-flex justify-content-between border-bottom py-3 gap-3">
                <span className="text-muted">
                  Completed deliveries
                </span>
                <strong className="text-success">
                  {formatNumber(
                    getValue(
                      deliveriesData,
                      "completed_deliveries",
                      "completed"
                    )
                  )}
                </strong>
              </div>

              <div className="d-flex justify-content-between py-3 gap-3">
                <span className="text-muted">
                  Pending deliveries
                </span>
                <strong className="text-warning">
                  {formatNumber(
                    getValue(
                      deliveriesData,
                      "pending_deliveries",
                      "pending"
                    )
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

  {/* WEBSITE SALES */}

  {activeReport === "sales" && (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white py-3">
        <h5 className="fw-bold mb-1">
          Website Sales Report
        </h5>
        <small className="text-muted">
          POS transactions are excluded from these figures.
        </small>
      </div>

      <div className="card-body">
        <div className="row g-3 mb-4">
          <StatCard
            title="Total Website Sales"
            value={formatMoney(
              getValue(
                salesData,
                "total_sales",
                "total_revenue",
                "sales_total"
              )
            )}
            icon="bi-currency-exchange"
            color="success"
          />

          <StatCard
            title="Website Orders"
            value={formatNumber(
              getValue(
                salesData,
                "total_orders",
                "orders_count"
              )
            )}
            icon="bi-receipt"
            color="primary"
          />
        </div>

        <h6 className="fw-bold mb-3">Sales Breakdown</h6>

        {salesList.length ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th className="text-end">Sales (KES)</th>
                </tr>
              </thead>

              <tbody>
                {salesList.map((item, index) => (
                  <tr key={item.id ?? item.date ?? index}>
                    <td>
                      {formatDate(
                        item.date ??
                          item.day ??
                          item.created_at
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        getValue(
                          item,
                          "total_orders",
                          "orders_count",
                          "orders",
                          "count"
                        )
                      )}
                    </td>

                    <td className="text-end fw-semibold">
                      {formatMoney(
                        getValue(
                          item,
                          "total_sales",
                          "total_revenue",
                          "sales",
                          "revenue",
                          "total"
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="bi-bar-chart"
            message="No website sales breakdown is available for this period."
          />
        )}
      </div>
    </div>
  )}

  {/* WEBSITE PRODUCTS */}

  {activeReport === "products" && (
    <>
      <div className="row g-3 mb-4">
        <StatCard
          title="Products Listed"
          value={formatNumber(
            getValue(
              productsData,
              "total_products",
              "products_count"
            )
          )}
          icon="bi-box-seam"
          color="primary"
        />

        <StatCard
          title="Units Sold"
          value={formatNumber(
            getValue(
              productsData,
              "total_quantity_sold",
              "units_sold",
              "total_units"
            )
          )}
          icon="bi-cart-check"
          color="success"
        />

        <StatCard
          title="Stock Remaining"
          value={formatNumber(
            getValue(
              productsData,
              "total_stock",
              "stock_remaining"
            )
          )}
          icon="bi-boxes"
          color="info"
        />

        <StatCard
          title="Product Value Sold"
          value={formatMoney(
            getValue(
              productsData,
              "total_sales",
              "total_value",
              "total_revenue"
            )
          )}
          icon="bi-cash-stack"
          color="warning"
        />
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            Website Best-Selling Products
          </h5>
        </div>

        <div className="card-body">
          {productList.length ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th className="text-end">Sales Value</th>
                  </tr>
                </thead>

                <tbody>
                  {productList.map((product, index) => (
                    <tr
                      key={
                        product.product_id ??
                        product.id ??
                        index
                      }
                    >
                      <td>{index + 1}</td>

                      <td className="fw-semibold">
                        {product.product_name ??
                          product.name ??
                          "Unknown product"}
                      </td>

                      <td>
                        {formatNumber(
                          getValue(
                            product,
                            "quantity_sold",
                            "total_quantity",
                            "units_sold",
                            "quantity"
                          )
                        )}
                      </td>

                      <td className="text-end">
                        {formatMoney(
                          getValue(
                            product,
                            "total_sales",
                            "total_value",
                            "revenue",
                            "subtotal"
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-box"
              message="No website product sales are available for this period."
            />
          )}
        </div>
      </div>
    </>
  )}

  {/* DELIVERIES */}

  {activeReport === "deliveries" && (
    <>
      <div className="row g-3 mb-4">
        <StatCard
          title="Total Deliveries"
          value={formatNumber(
            getValue(
              deliveriesData,
              "total_deliveries",
              "total",
              "count"
            )
          )}
          icon="bi-truck"
          color="primary"
        />

        <StatCard
          title="Completed"
          value={formatNumber(
            getValue(
              deliveriesData,
              "completed_deliveries",
              "completed"
            )
          )}
          icon="bi-check-circle"
          color="success"
        />

        <StatCard
          title="Pending"
          value={formatNumber(
            getValue(
              deliveriesData,
              "pending_deliveries",
              "pending"
            )
          )}
          icon="bi-clock-history"
          color="warning"
        />

        <StatCard
          title="Cancelled"
          value={formatNumber(
            getValue(
              deliveriesData,
              "cancelled_deliveries",
              "cancelled"
            )
          )}
          icon="bi-x-circle"
          color="danger"
        />
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            Delivery Status Breakdown
          </h5>
        </div>

        <div className="card-body">
          {deliveryList.length ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Delivery Status</th>
                    <th className="text-end">
                      Number of Deliveries
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {deliveryList.map((delivery, index) => (
                    <tr
                      key={
                        delivery.status ??
                        delivery.delivery_status ??
                        index
                      }
                    >
                      <td className="text-capitalize">
                        {String(
                          delivery.status ??
                            delivery.delivery_status ??
                            "Unknown"
                        ).replaceAll("_", " ")}
                      </td>

                      <td className="text-end fw-semibold">
                        {formatNumber(
                          getValue(
                            delivery,
                            "count",
                            "total",
                            "total_deliveries",
                            "quantity"
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-truck"
              message="No delivery breakdown is available for this period."
            />
          )}
        </div>
      </div>
    </>
  )}

  {/* WEBSITE PROFIT */}

  {activeReport === "profit" && (
    <>
      <div className="row g-3 mb-4">
        <StatCard
          title="Website Revenue"
          value={formatMoney(
            getValue(
              profitData,
              "total_revenue",
              "total_sales",
              "revenue"
            )
          )}
          icon="bi-cash-stack"
          color="success"
          subtitle="Website orders only"
        />

        <StatCard
          title="Cost of Goods"
          value={formatMoney(
            getValue(
              profitData,
              "total_cost",
              "total_buying_cost",
              "cost_of_goods"
            )
          )}
          icon="bi-box-seam"
          color="primary"
        />

        <StatCard
          title="Gross Profit"
          value={formatMoney(
            getValue(
              profitData,
              "gross_profit",
              "total_profit",
              "profit"
            )
          )}
          icon="bi-graph-up-arrow"
          color="info"
        />

        <StatCard
          title="Profit Margin"
          value={formatPercent(
            getValue(
              profitData,
              "profit_margin",
              "margin_percentage"
            )
          )}
          icon="bi-percent"
          color="warning"
        />
      </div>

      <div className="alert alert-light border">
        <i className="bi bi-info-circle text-success me-2"></i>
        Website profit uses website order items and their recorded
        buying prices. Historical items without a buying price
        cannot have an exact gross profit calculated.
      </div>
    </>
  )}

  {/* POS REPORTS */}

  {activeReport === "pos" && (
    <>
      {posError && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {posError}
        </div>
      )}

      <div className="alert alert-info">
        <i className="bi bi-shop me-2"></i>
        POS reports use cashier sales records. They do not use
        website orders or website order items.
        <strong className="ms-1">
          {selectedBranchId
            ? `Showing ${branches.find((branch) => String(branch.id) === String(selectedBranchId))?.name || `Branch ${selectedBranchId}`} only.`
            : "Showing all branches combined."}
        </strong>
      </div>

      <div className="row g-3 mb-4">
        <StatCard
          title="POS Sales"
          value={formatMoney(posRevenue)}
          icon="bi-currency-exchange"
          color="success"
          subtitle="Recorded POS sales"
        />

        <StatCard
          title="POS Transactions"
          value={formatNumber(
            getValue(
              posOverviewData,
              "total_sales_count",
              "total_transactions",
              "total_orders",
              "sales_count"
            )
          )}
          icon="bi-receipt"
          color="primary"
        />

        <StatCard
          title="Paid POS Sales"
          value={formatMoney(
            getValue(
              posOverviewData,
              "paid_sales",
              "total_paid",
              "paid_revenue"
            )
          )}
          icon="bi-check-circle"
          color="info"
          subtitle="Confirmed payments"
        />

        <StatCard
          title="Pending POS Payments"
          value={formatMoney(
            getValue(
              posOverviewData,
              "pending_payments",
              "unpaid_sales",
              "pending_amount"
            )
          )}
          icon="bi-clock-history"
          color="warning"
        />
      </div>

      <div className="row g-3 mb-4">
        <StatCard
          title="Cost of POS Goods"
          value={
            posCost === null
              ? "Unavailable"
              : formatMoney(posCost)
          }
          icon="bi-box-seam"
          color="primary"
          subtitle="Historical item buying prices"
        />

        <StatCard
          title="POS Gross Profit"
          value={
            posGrossProfit === null
              ? "Unavailable"
              : formatMoney(posGrossProfit)
          }
          icon="bi-graph-up-arrow"
          color="success"
        />

        <StatCard
          title="POS Profit Margin"
          value={
            posMargin === null
              ? "Unavailable"
              : formatPercent(posMargin)
          }
          icon="bi-percent"
          color="info"
        />

        <StatCard
          title="Sales With Unknown Cost"
          value={formatMoney(posUnknownCostSales)}
          icon="bi-exclamation-circle"
          color="warning"
          subtitle="Sales needing cost records"
        />
      </div>

      {posCost === null ||
      posGrossProfit === null ||
      posMargin === null ? (
        <div className="alert alert-warning">
          <i className="bi bi-info-circle me-2"></i>
          Some profitability figures were not returned by the
          backend. The frontend does not guess missing costs or
          profits. Confirm the POS overview response includes
          total cost, gross profit, and profit margin.
        </div>
      ) : null}

      {/* POS SALES BREAKDOWN */}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            POS Sales Breakdown
          </h5>
          <small className="text-muted">
            Daily summaries or transaction records returned by
            the backend.
          </small>
        </div>

        <div className="card-body">
          {posTransactionList.length ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Payment Method</th>
                    <th>Payment Status</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {posTransactionList.map((item, index) => (
                    <tr
                      key={
                        item.id ??
                        item.sale_number ??
                        index
                      }
                    >
                      <td className="fw-semibold">
                        {getTransactionReference(item)}
                      </td>

                      <td>
                        {formatDateTime(
                          item.created_at ??
                            item.date ??
                            item.sale_date
                        )}
                      </td>

                      <td>
                        {item.branch_name ??
                          item.branch?.name ??
                          item.branch ??
                          "—"}
                      </td>

                      <td className="text-capitalize">
                        {String(
                          item.payment_method ?? "—"
                        ).replaceAll("_", " ")}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            ["paid", "success", "successful", "completed"].includes(
                              String(
                                item.payment_status ??
                                  item.status ??
                                  ""
                              ).toLowerCase()
                            )
                              ? "text-bg-success"
                              : "text-bg-warning"
                          }`}
                        >
                          {item.payment_status ??
                            item.status ??
                            "Unknown"}
                        </span>
                      </td>

                      <td className="text-end fw-semibold">
                        {formatMoney(
                          getValue(
                            item,
                            "total",
                            "amount",
                            "total_amount",
                            "sale_total"
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : posSalesList.length ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Transactions</th>
                    <th className="text-end">Sales (KES)</th>
                    <th className="text-end">Gross Profit</th>
                    <th className="text-end">Margin</th>
                  </tr>
                </thead>

                <tbody>
                  {posSalesList.map((item, index) => {
                    const itemProfit = getProfit(item);
                    const itemMargin = getMargin(item);

                    return (
                      <tr
                        key={
                          item.id ??
                          item.date ??
                          item.day ??
                          index
                        }
                      >
                        <td>
                          {formatDate(
                            item.date ??
                              item.day ??
                              item.created_at
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            getValue(
                              item,
                              "total_sales_count",
                              "total_transactions",
                              "sales_count",
                              "count"
                            )
                          )}
                        </td>

                        <td className="text-end fw-semibold">
                          {formatMoney(
                            getValue(
                              item,
                              "total_sales",
                              "total_revenue",
                              "sales",
                              "revenue",
                              "total"
                            )
                          )}
                        </td>

                        <td className="text-end">
                          {itemProfit === null
                            ? "Unavailable"
                            : formatMoney(itemProfit)}
                        </td>

                        <td className="text-end">
                          {itemMargin === null
                            ? "Unavailable"
                            : formatPercent(itemMargin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-receipt"
              message="No POS sales breakdown is available for this period."
            />
          )}
        </div>
      </div>

      {/* POS BEST-SELLING PRODUCTS */}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            Best-Selling POS Products
          </h5>
        </div>

        <div className="card-body">
          {posProductList.length ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th className="text-end">Sales Value</th>
                    <th className="text-end">Cost</th>
                    <th className="text-end">Gross Profit</th>
                    <th className="text-end">Margin</th>
                  </tr>
                </thead>

                <tbody>
                  {posProductList.map((product, index) => {
                    const productCost = getOptionalValue(
                      product,
                      "total_cost",
                      "total_buying_cost",
                      "cost_of_goods"
                    );

                    const productProfit = getProfit(product);
                    const productMargin = getMargin(product);

                    return (
                      <tr
                        key={
                          product.product_id ??
                          product.id ??
                          index
                        }
                      >
                        <td>{index + 1}</td>

                        <td className="fw-semibold">
                          {product.product_name ??
                            product.name ??
                            "Unknown product"}
                        </td>

                        <td>
                          {formatNumber(
                            getValue(
                              product,
                              "quantity_sold",
                              "total_quantity",
                              "units_sold",
                              "quantity"
                            )
                          )}
                        </td>

                        <td className="text-end">
                          {formatMoney(
                            getValue(
                              product,
                              "total_sales",
                              "total_value",
                              "revenue",
                              "subtotal"
                            )
                          )}
                        </td>

                        <td className="text-end">
                          {productCost === null
                            ? "Unavailable"
                            : formatMoney(productCost)}
                        </td>

                        <td className="text-end">
                          {productProfit === null
                            ? "Unavailable"
                            : formatMoney(productProfit)}
                        </td>

                        <td className="text-end">
                          {productMargin === null
                            ? "Unavailable"
                            : formatPercent(productMargin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-box-seam"
              message="No POS product sales are available."
            />
          )}
        </div>
      </div>
    </>
  )}

  {/* BRANCH REPORTS */}

  {activeReport === "branches" && (
    <>
      {posError && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {posError}
        </div>
      )}

      <div className="alert alert-info">
        <i className="bi bi-diagram-3 me-2"></i>
        {selectedBranchId
          ? "Showing performance for the selected branch only."
          : "Each branch is reported separately using its own POS sales records and branch stock workflow."}
        Website orders are excluded.
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">Branch Performance</h5>
        </div>

        <div className="card-body">
          {branchReports.length ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Branch</th>
                    <th>Transactions</th>
                    <th className="text-end">Sales (KES)</th>
                    <th className="text-end">Paid Sales (KES)</th>
                    <th className="text-end">Cost of Goods</th>
                    <th className="text-end">Gross Profit</th>
                    <th className="text-end">Margin</th>
                  </tr>
                </thead>

                <tbody>
                  {branchReports.map((branch, index) => {
                    const branchCost = getOptionalValue(
                      branch,
                      "total_cost",
                      "total_buying_cost",
                      "cost_of_goods"
                    );

                    const branchProfit = getProfit(branch);
                    const branchMargin = getMargin(branch);

                    return (
                      <tr
                        key={
                          branch.branch_id ??
                          branch.id ??
                          index
                        }
                      >
                        <td className="fw-semibold">
                          {branch.branch_name ??
                            branch.name ??
                            `Branch ${index + 1}`}
                        </td>

                        <td>
                          {formatNumber(
                            getValue(
                              branch,
                              "total_transactions",
                              "total_sales_count",
                              "sales_count",
                              "total_orders"
                            )
                          )}
                        </td>

                        <td className="text-end">
                          {formatMoney(
                            getValue(
                              branch,
                              "total_sales",
                              "total_revenue",
                              "sales_total"
                            )
                          )}
                        </td>

                        <td className="text-end text-success">
                          {formatMoney(
                            getValue(
                              branch,
                              "paid_sales",
                              "total_paid",
                              "paid_revenue"
                            )
                          )}
                        </td>

                        <td className="text-end">
                          {branchCost === null
                            ? "Unavailable"
                            : formatMoney(branchCost)}
                        </td>

                        <td className="text-end">
                          {branchProfit === null
                            ? "Unavailable"
                            : formatMoney(branchProfit)}
                        </td>

                        <td className="text-end">
                          {branchMargin === null
                            ? "Unavailable"
                            : formatPercent(branchMargin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="bi-diagram-3"
              message="No branch report data is available yet."
            />
          )}
        </div>
      </div>
    </>
  )}

  {/* FOOTER */}

  <div className="alert alert-light border mt-4 mb-0">
    <i className="bi bi-info-circle text-success me-2"></i>
    <strong>Reporting note:</strong> Website reports use website
    orders. POS and branch reports use separate cashier sales
    records. Recorded sales are not automatically treated as
    confirmed payments. Profit figures depend on historical
    buying prices recorded against the sold items.
  </div>
</div>


);
}

export default Reports;