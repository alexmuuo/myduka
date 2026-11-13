const loadDashboard = async () => {
  // FRONTEND PREVIEW MODE
  // Active during local development or when explicitly enabled.
  const previewMode =
    import.meta.env.DEV ||
    import.meta.env.VITE_FRONTEND_DEMO_MODE === "true";

  if (previewMode) {
    setLoading(true);
    setError("");

    setBusiness({
      id: 1,
      name: "MyDuka Demo Store",
      slug: "myduka-demo",
      phone: "+254 700 000 000",
      address: "Kisii, Kenya",
      role: "owner",
      is_active: true,
    });

    setBranches([
      {
        id: 1,
        name: "Main Branch",
        address: "Kisii Town",
        phone: "+254 700 000 000",
        is_main: true,
        is_active: true,
      },
      {
        id: 2,
        name: "Nairobi Branch",
        address: "Nairobi CBD",
        phone: "+254 711 000 000",
        is_main: false,
        is_active: true,
      },
    ]);

    setStaff([
      {
        user_id: "demo-employee-001",
        role: "cashier",
        is_active: true,
        branches: [{ id: 1, name: "Main Branch" }],
      },
      {
        user_id: "demo-employee-002",
        role: "manager",
        is_active: true,
        branches: [
          { id: 1, name: "Main Branch" },
          { id: 2, name: "Nairobi Branch" },
        ],
      },
    ]);

    setLoading(false);
    return;
  }

  // NORMAL BACKEND MODE
  const selectedBusinessId = localStorage.getItem("mydukaBusinessId");

  if (!selectedBusinessId) {
    navigate("/admin-login", { replace: true });
    return;
  }

  try {
    setLoading(true);
    setError("");

    const [businessResponse, branchesResponse] = await Promise.all([
      api.get("/businesses"),
      api.get(`/businesses/${selectedBusinessId}/branches`),
    ]);

    const businesses = businessResponse.data?.businesses || [];

    const currentBusiness = businesses.find(
      (item) => String(item.id) === String(selectedBusinessId)
    );

    if (!currentBusiness) {
      localStorage.removeItem("mydukaBusinessId");
      throw new Error(
        "You no longer have access to this business. Please log in again."
      );
    }

    setBusiness(currentBusiness);

    setBranches(branchesResponse.data?.branches || []);

    if (["owner", "admin", "manager"].includes(currentBusiness.role)) {
      const staffResponse = await api.get(
        `/businesses/${selectedBusinessId}/staff`
      );

      setStaff(staffResponse.data?.staff || []);
    } else {
      setStaff([]);
    }
  } catch (err) {
    console.error("Dashboard loading failed:", err);

    if (err.response?.status === 401) {
      await handleLogout();
      return;
    }

    setError(
      err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Could not load your business dashboard."
    );
  } finally {
    setLoading(false);
  }
};
