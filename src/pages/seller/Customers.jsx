import { useEffect, useState } from "react";
import api from "../../api/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/customers");

      setCustomers(response.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const searchTerm = search.toLowerCase();

    return (
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.phone?.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="container-fluid py-4">

      {/* HEADER */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">

        <div>
          <span className="text-success fw-semibold">
            SELLER CUSTOMERS
          </span>

          <h1 className="fw-bold mt-1 mb-1">
            Customers
          </h1>

          <p className="text-secondary mb-0">
            View and manage your customers.
          </p>
        </div>

        <button
          className="btn btn-outline-success"
          onClick={loadCustomers}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>

      </div>

      {/* SUMMARY */}
      <div className="row g-3 mb-4">

        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">
                Total Customers
              </div>

              <div className="fs-3 fw-bold text-success">
                {customers.length}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">
                Showing
              </div>

              <div className="fs-3 fw-bold">
                {filteredCustomers.length}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">
                Customer Search
              </div>

              <div className="fs-3 fw-bold">
                <i className="bi bi-search text-success"></i>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SEARCH */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">

          <label className="form-label fw-semibold">
            Search Customers
          </label>

          <div className="input-group">

            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>

            <input
              type="text"
              className="form-control"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}

          </div>

        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-5">

          <div
            className="spinner-border text-success"
            role="status"
          ></div>

          <p className="text-secondary mt-3">
            Loading customers...
          </p>

        </div>
      ) : filteredCustomers.length === 0 ? (

        /* EMPTY STATE */
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">

            <i className="bi bi-people fs-1 text-secondary"></i>

            <h5 className="mt-3">
              {customers.length === 0
                ? "No customers yet"
                : "No customers found"}
            </h5>

            <p className="text-secondary mb-0">
              {customers.length === 0
                ? "Customers will appear here when they place orders."
                : "Try a different search term."}
            </p>

          </div>
        </div>

      ) : (

        /* CUSTOMER TABLE */
        <div className="card border-0 shadow-sm">

          <div className="card-header bg-white py-3">

            <div className="d-flex justify-content-between align-items-center">

              <h5 className="mb-0 fw-bold">
                Customer List
              </h5>

              <span className="text-secondary small">
                {filteredCustomers.length} customer
                {filteredCustomers.length !== 1 ? "s" : ""}
              </span>

            </div>

          </div>

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead className="table-light">

                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Customer ID</th>
                </tr>

              </thead>

              <tbody>

                {filteredCustomers.map((customer, index) => (

                  <tr key={customer.id}>

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      <div className="d-flex align-items-center">

                        <div
                          className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: "42px",
                            height: "42px",
                          }}
                        >
                          <i className="bi bi-person"></i>
                        </div>

                        <div>
                          <div className="fw-semibold">
                            {customer.name}
                          </div>

                          <small className="text-secondary">
                            Customer
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-decoration-none"
                      >
                        <i className="bi bi-telephone me-2"></i>
                        {customer.phone}
                      </a>
                    </td>

                    <td>
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-decoration-none"
                        >
                          <i className="bi bi-envelope me-2"></i>
                          {customer.email}
                        </a>
                      ) : (
                        <span className="text-secondary">
                          No email
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="badge text-bg-light">
                        #{customer.id}
                      </span>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}

export default Customers;