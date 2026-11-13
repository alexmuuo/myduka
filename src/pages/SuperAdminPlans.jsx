import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";

const initialPlans = [
  {
    id: 1,
    name: "Free",
    description: "For businesses getting started.",
    monthlyPrice: 0,
    annualPrice: 0,
    products: 50,
    users: 1,
    branches: 1,
    cashiers: 1,
    storage: 500,
    features: [
      "Basic inventory management",
      "Online storefront",
      "Basic sales reports",
      "Email support",
    ],
    active: true,
    featured: false,
  },
  {
    id: 2,
    name: "Starter",
    description: "Essential tools for growing businesses.",
    monthlyPrice: 999,
    annualPrice: 9990,
    products: 500,
    users: 3,
    branches: 2,
    cashiers: 5,
    storage: 2000,
    features: [
      "Everything in Free",
      "Advanced inventory management",
      "POS and cashier management",
      "Sales and stock reports",
      "Customer management",
      "Priority email support",
    ],
    active: true,
    featured: false,
  },
  {
    id: 3,
    name: "Professional",
    description: "Powerful tools for established businesses.",
    monthlyPrice: 2499,
    annualPrice: 24990,
    products: 5000,
    users: 10,
    branches: 5,
    cashiers: 20,
    storage: 10000,
    features: [
      "Everything in Starter",
      "Advanced analytics",
      "Multiple branches",
      "Stock transfers",
      "Advanced POS features",
      "Staff permissions",
      "Priority support",
    ],
    active: true,
    featured: true,
  },
  {
    id: 4,
    name: "Enterprise",
    description: "Complete flexibility for large businesses.",
    monthlyPrice: 5999,
    annualPrice: 59990,
    products: -1,
    users: -1,
    branches: -1,
    cashiers: -1,
    storage: 50000,
    features: [
      "Everything in Professional",
      "Unlimited products",
      "Unlimited users",
      "Unlimited branches",
      "Custom integrations",
      "Dedicated support",
      "Advanced business analytics",
    ],
    active: true,
    featured: false,
  },
];

const emptyPlan = {
  name: "",
  description: "",
  monthlyPrice: 0,
  annualPrice: 0,
  products: 100,
  users: 1,
  branches: 1,
  cashiers: 1,
  storage: 500,
  features: [""],
  active: true,
  featured: false,
};

function formatPrice(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

function formatLimit(value) {
  return Number(value) === -1 ? "Unlimited" : Number(value).toLocaleString();
}

export default function SuperAdminPlans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState(initialPlans);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        plan.name.toLowerCase().includes(search.toLowerCase()) ||
        plan.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && plan.active) ||
        (statusFilter === "inactive" && !plan.active);

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const activePlans = plans.filter((plan) => plan.active).length;
  const inactivePlans = plans.length - activePlans;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({ ...emptyPlan, features: [""] });
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan.id);
    setForm({
      ...plan,
      features: [...plan.features],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
    setForm({ ...emptyPlan, features: [""] });
  };

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateFeature = (index, value) => {
    setForm((current) => {
      const features = [...current.features];
      features[index] = value;

      return {
        ...current,
        features,
      };
    });
  };

  const addFeature = () => {
    setForm((current) => ({
      ...current,
      features: [...current.features, ""],
    }));
  };

  const removeFeature = (index) => {
    setForm((current) => ({
      ...current,
      features: current.features.filter((_, i) => i !== index),
    }));
  };

  const savePlan = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      showNotice("Please enter a plan name.");
      return;
    }

    setSaving(true);

    const cleanedPlan = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      monthlyPrice: Number(form.monthlyPrice),
      annualPrice: Number(form.annualPrice),
      products: Number(form.products),
      users: Number(form.users),
      branches: Number(form.branches),
      cashiers: Number(form.cashiers),
      storage: Number(form.storage),
      features: form.features
        .map((feature) => feature.trim())
        .filter(Boolean),
    };

    if (editingPlan) {
      setPlans((current) =>
        current.map((plan) =>
          plan.id === editingPlan
            ? { ...cleanedPlan, id: editingPlan }
            : { ...plan, featured: cleanedPlan.featured ? false : plan.featured }
        )
      );

      showNotice("Plan updated successfully.");
    } else {
      const newPlan = {
        ...cleanedPlan,
        id: Date.now(),
      };

      setPlans((current) => [
        ...current.map((plan) => ({
          ...plan,
          featured: cleanedPlan.featured ? false : plan.featured,
        })),
        newPlan,
      ]);

      showNotice("New plan created successfully.");
    }

    setSaving(false);
    closeModal();
  };

  const toggleStatus = (id) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === id
          ? { ...plan, active: !plan.active }
          : plan
      )
    );

    showNotice("Plan status updated.");
  };

  const toggleFeatured = (id) => {
    setPlans((current) =>
      current.map((plan) => ({
        ...plan,
        featured: plan.id === id ? !plan.featured : false,
      }))
    );

    showNotice("Featured plan updated.");
  };

  const deletePlan = (id) => {
    const plan = plans.find((item) => item.id === id);

    if (!window.confirm(`Delete the ${plan?.name} plan?`)) return;

    setPlans((current) => current.filter((item) => item.id !== id));
    showNotice("Plan deleted.");
  };

  const navItems = [
    { label: "Overview", path: "/superadmin/dashboard", icon: "⌂" },
    { label: "Businesses", path: "/superadmin/businesses", icon: "▦" },
    { label: "Subscriptions", path: "/superadmin/subscriptions", icon: "◈" },
    { label: "Plans", path: "/superadmin/plans", icon: "◇" },
    { label: "Users", path: "/superadmin/users", icon: "♙" },
    { label: "Analytics", path: "/superadmin/analytics", icon: "▥" },
    { label: "Support", path: "/superadmin/support", icon: "◌" },
    { label: "Audit Logs", path: "/superadmin/audit-logs", icon: "≡" },
    { label: "Settings", path: "/superadmin/settings", icon: "⚙" },
    { label: "My Profile", path: "/superadmin/profile", icon: "◉" },
  ];

  return (
    <div className="sa-plans">
      <style>{`
        .sa-plans {
          min-height: 100vh;
          display: flex;
          background: var(--background, #f5f7fb);
          color: var(--text-primary, #172033);
          font-family: inherit;
        }

        .sa-plans * {
          box-sizing: border-box;
        }

        .sa-sidebar {
          width: 250px;
          flex-shrink: 0;
          background: var(--surface, #ffffff);
          border-right: 1px solid var(--border, #e5e7eb);
          padding: 25px 15px;
          display: flex;
          flex-direction: column;
        }

        .sa-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 12px 27px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          margin-bottom: 22px;
        }

        .sa-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: white;
          font-weight: 800;
          background: #635bdb;
          font-size: 20px;
        }

        .sa-brand strong {
          display: block;
          font-size: 17px;
          letter-spacing: -0.4px;
        }

        .sa-brand small {
          color: var(--text-secondary, #7b8495);
          font-size: 11px;
        }

        .sa-nav-label {
          color: var(--text-secondary, #8b93a2);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.1px;
          padding: 0 12px;
          margin-bottom: 10px;
        }

        .sa-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sa-nav a {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text-secondary, #687386);
          padding: 11px 13px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          transition: 0.2s;
        }

        .sa-nav a:hover {
          background: var(--surface-hover, #f2f3f8);
          color: var(--text-primary, #172033);
        }

        .sa-nav a.active {
          background: rgba(99, 91, 219, 0.11);
          color: #635bdb;
        }

        .sa-nav-icon {
          width: 19px;
          text-align: center;
          font-size: 17px;
        }

        .sa-sidebar-bottom {
          margin-top: auto;
          padding: 15px 10px 0;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        .sa-sidebar-bottom button {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--text-secondary, #687386);
          padding: 10px;
          text-align: left;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
        }

        .sa-main {
          flex: 1;
          min-width: 0;
          padding: 30px;
        }

        .sa-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 30px;
        }

        .sa-topbar h1 {
          margin: 0 0 6px;
          font-size: clamp(23px, 3vw, 29px);
          letter-spacing: -1px;
          font-weight: 800;
        }

        .sa-topbar p {
          margin: 0;
          color: var(--text-secondary, #7b8495);
          font-size: 13px;
        }

        .sa-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sa-primary-btn {
          border: none;
          background: #635bdb;
          color: white;
          padding: 11px 17px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .sa-primary-btn:hover {
          background: #5148c7;
          transform: translateY(-1px);
        }

        .sa-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 25px;
        }

        .sa-stat {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 13px;
          padding: 19px;
        }

        .sa-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 13px;
        }

        .sa-stat-label {
          color: var(--text-secondary, #7b8495);
          font-size: 12px;
          font-weight: 600;
        }

        .sa-stat-icon {
          width: 35px;
          height: 35px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(99, 91, 219, 0.11);
          color: #635bdb;
          font-size: 17px;
        }

        .sa-stat strong {
          font-size: 25px;
          font-weight: 800;
        }

        .sa-stat small {
          display: block;
          color: var(--text-secondary, #8b93a2);
          margin-top: 5px;
          font-size: 11px;
        }

        .sa-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .sa-search {
          flex: 1;
          min-width: 200px;
          max-width: 360px;
          position: relative;
        }

        .sa-search input {
          width: 100%;
          padding: 11px 14px 11px 38px;
          border-radius: 9px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--surface, #fff);
          color: var(--text-primary, #172033);
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .sa-search input:focus,
        .sa-field input:focus,
        .sa-field textarea:focus {
          border-color: #635bdb;
          box-shadow: 0 0 0 3px rgba(99, 91, 219, 0.1);
        }

        .sa-search span {
          position: absolute;
          left: 13px;
          top: 10px;
          color: var(--text-secondary, #8b93a2);
        }

        .sa-toolbar select {
          padding: 11px 14px;
          border-radius: 9px;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--surface, #fff);
          color: var(--text-primary, #172033);
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .sa-plan-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .sa-plan-card {
          position: relative;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 15px;
          padding: 22px;
          min-width: 0;
          transition: 0.2s;
        }

        .sa-plan-card:hover {
          border-color: rgba(99, 91, 219, 0.5);
          box-shadow: 0 8px 25px rgba(20, 25, 50, 0.05);
        }

        .sa-plan-card.featured {
          border: 2px solid #635bdb;
          padding: 21px;
        }

        .sa-plan-card.inactive {
          opacity: 0.68;
        }

        .sa-featured-tag {
          position: absolute;
          top: -11px;
          right: 19px;
          background: #635bdb;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
        }

        .sa-plan-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .sa-plan-heading h3 {
          margin: 0 0 7px;
          font-size: 19px;
          font-weight: 800;
        }

        .sa-plan-heading p {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary, #7b8495);
          line-height: 1.5;
        }

        .sa-status {
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .sa-status.active {
          color: #168653;
          background: rgba(22, 163, 74, 0.11);
        }

        .sa-status.inactive {
          color: #b45309;
          background: rgba(217, 119, 6, 0.12);
        }

        .sa-price {
          margin: 22px 0;
          padding-bottom: 19px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .sa-price strong {
          font-size: 29px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .sa-price span {
          color: var(--text-secondary, #7b8495);
          font-size: 12px;
        }

        .sa-price small {
          display: block;
          margin-top: 5px;
          font-size: 11px;
          color: var(--text-secondary, #8b93a2);
        }

        .sa-limit-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-secondary, #7b8495);
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-bottom: 13px;
        }

        .sa-limits {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 21px;
        }

        .sa-limit {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 12px;
          color: var(--text-secondary, #687386);
        }

        .sa-limit b {
          color: var(--text-primary, #172033);
          display: block;
          font-size: 13px;
          margin-top: 3px;
        }

        .sa-limit-icon {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: var(--surface-hover, #f2f3f8);
          font-size: 14px;
        }

        .sa-features {
          border-top: 1px solid var(--border, #e5e7eb);
          padding-top: 17px;
        }

        .sa-features h4 {
          font-size: 12px;
          margin: 0 0 12px;
        }

        .sa-feature {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: 9px 0;
          font-size: 12px;
          color: var(--text-secondary, #687386);
          line-height: 1.4;
        }

        .sa-feature span {
          color: #16a36a;
          font-weight: 800;
        }

        .sa-plan-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid var(--border, #e5e7eb);
          margin-top: 18px;
          padding-top: 15px;
        }

        .sa-action-group {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .sa-small-btn {
          padding: 8px 11px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 7px;
          background: transparent;
          color: var(--text-primary, #172033);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .sa-small-btn:hover {
          border-color: #635bdb;
          color: #635bdb;
        }

        .sa-small-btn.danger {
          color: #dc4545;
        }

        .sa-small-btn.danger:hover {
          border-color: #dc4545;
        }

        .sa-featured-button {
          background: transparent;
          border: none;
          color: var(--text-secondary, #7b8495);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .sa-featured-button.selected {
          color: #635bdb;
        }

        .sa-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 55px 20px;
          border: 1px dashed var(--border, #e5e7eb);
          border-radius: 13px;
          color: var(--text-secondary, #7b8495);
          background: var(--surface, #fff);
        }

        .sa-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(12, 17, 30, 0.55);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 18px;
          overflow-y: auto;
        }

        .sa-modal {
          width: 100%;
          max-width: 650px;
          max-height: 92vh;
          overflow-y: auto;
          background: var(--surface, #fff);
          color: var(--text-primary, #172033);
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .sa-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .sa-modal-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .sa-close {
          border: none;
          background: var(--surface-hover, #f2f3f8);
          color: var(--text-primary, #172033);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 19px;
        }

        .sa-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .sa-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 14px;
        }

        .sa-field.full {
          grid-column: 1 / -1;
        }

        .sa-field label {
          font-size: 12px;
          font-weight: 700;
        }

        .sa-field input,
        .sa-field textarea {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          background: var(--background, #f8f9fc);
          color: var(--text-primary, #172033);
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .sa-field textarea {
          min-height: 75px;
          resize: vertical;
        }

        .sa-field small {
          color: var(--text-secondary, #8b93a2);
          font-size: 10px;
        }

        .sa-form-section {
          grid-column: 1 / -1;
          font-size: 12px;
          font-weight: 800;
          margin: 8px 0 3px;
          padding-bottom: 9px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .sa-feature-input {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .sa-feature-input input {
          flex: 1;
          min-width: 0;
          padding: 10px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          background: var(--background, #f8f9fc);
          color: var(--text-primary, #172033);
          font: inherit;
          font-size: 12px;
        }

        .sa-feature-input button {
          width: 35px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          background: transparent;
          color: #dc4545;
          cursor: pointer;
        }

        .sa-add-feature {
          border: none;
          background: transparent;
          color: #635bdb;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 7px 0;
        }

        .sa-checkbox-row {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 10px 0 20px;
        }

        .sa-checkbox-row label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .sa-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid var(--border, #e5e7eb);
          padding-top: 18px;
          margin-top: 10px;
        }

        .sa-cancel {
          border: 1px solid var(--border, #e5e7eb);
          background: transparent;
          color: var(--text-primary, #172033);
          padding: 10px 17px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .sa-notice {
          position: fixed;
          z-index: 1200;
          bottom: 25px;
          right: 25px;
          background: #172033;
          color: white;
          padding: 13px 19px;
          border-radius: 9px;
          font-size: 13px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.18);
        }

        @media (max-width: 1050px) {
          .sa-sidebar {
            width: 215px;
          }

          .sa-main {
            padding: 24px 18px;
          }
        }

        @media (max-width: 800px) {
          .sa-sidebar {
            width: 65px;
            padding: 20px 8px;
          }

          .sa-brand {
            justify-content: center;
            padding: 0 0 20px;
          }

          .sa-brand > div:last-child,
          .sa-nav-label,
          .sa-nav a span:not(.sa-nav-icon),
          .sa-sidebar-bottom button {
            display: none;
          }

          .sa-nav a {
            justify-content: center;
            padding: 12px 5px;
          }

          .sa-nav-icon {
            font-size: 19px;
          }

          .sa-plan-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 550px) {
          .sa-main {
            padding: 20px 12px;
          }

          .sa-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .sa-top-actions {
            width: 100%;
            justify-content: space-between;
          }

          .sa-stats {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .sa-stat {
            padding: 14px;
          }

          .sa-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .sa-search {
            max-width: none;
          }

          .sa-toolbar select {
            width: 100%;
          }

          .sa-form-grid {
            grid-template-columns: 1fr;
          }

          .sa-field.full,
          .sa-form-section {
            grid-column: auto;
          }

          .sa-modal {
            padding: 18px;
          }

          .sa-plan-actions {
            align-items: flex-start;
            flex-direction: column;
          }

          .sa-notice {
            left: 15px;
            right: 15px;
            bottom: 15px;
            text-align: center;
          }
        }
      `}</style>

      <aside className="sa-sidebar">
        <div className="sa-brand">
          <div className="sa-brand-icon">M</div>
          <div>
            <strong>MyDuka</strong>
            <small>Platform Administration</small>
          </div>
        </div>

        <div className="sa-nav-label">PLATFORM MANAGEMENT</div>

        <nav className="sa-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={item.path === "/superadmin/plans" ? "active" : ""}
            >
              <span className="sa-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sa-sidebar-bottom">
          <button onClick={() => navigate("/superadmin-login")}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <main className="sa-main">
        <header className="sa-topbar">
          <div>
            <h1>Subscription Plans</h1>
            <p>Manage pricing, features and limits across the MyDuka platform.</p>
          </div>

          <div className="sa-top-actions">
            <ThemeSwitcher />
            <button className="sa-primary-btn" onClick={openCreateModal}>
              + Create Plan
            </button>
          </div>
        </header>

        <section className="sa-stats">
          <div className="sa-stat">
            <div className="sa-stat-top">
              <span className="sa-stat-label">Total Plans</span>
              <span className="sa-stat-icon">◇</span>
            </div>
            <strong>{plans.length}</strong>
            <small>All subscription plans</small>
          </div>

          <div className="sa-stat">
            <div className="sa-stat-top">
              <span className="sa-stat-label">Active Plans</span>
              <span className="sa-stat-icon">✓</span>
            </div>
            <strong>{activePlans}</strong>
            <small>Available for businesses</small>
          </div>

          <div className="sa-stat">
            <div className="sa-stat-top">
              <span className="sa-stat-label">Inactive Plans</span>
              <span className="sa-stat-icon">◷</span>
            </div>
            <strong>{inactivePlans}</strong>
            <small>Currently unavailable</small>
          </div>
        </section>

        <section className="sa-toolbar">
          <div className="sa-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search subscription plans..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All plans</option>
            <option value="active">Active plans</option>
            <option value="inactive">Inactive plans</option>
          </select>
        </section>

        <section className="sa-plan-grid">
          {filteredPlans.length === 0 ? (
            <div className="sa-empty">
              <h3>No plans found</h3>
              <p>Try another search or create a new subscription plan.</p>
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <article
                key={plan.id}
                className={`sa-plan-card ${plan.featured ? "featured" : ""} ${
                  !plan.active ? "inactive" : ""
                }`}
              >
                {plan.featured && (
                  <div className="sa-featured-tag">MOST POPULAR</div>
                )}

                <div className="sa-plan-heading">
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.description || "No description provided."}</p>
                  </div>

                  <span
                    className={`sa-status ${
                      plan.active ? "active" : "inactive"
                    }`}
                  >
                    {plan.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="sa-price">
                  <strong>
                    {plan.monthlyPrice === 0
                      ? "Free"
                      : formatPrice(plan.monthlyPrice)}
                  </strong>
                  {plan.monthlyPrice > 0 && <span> / month</span>}
                  <small>
                    Annual billing:{" "}
                    {plan.annualPrice === 0
                      ? "Free"
                      : `${formatPrice(plan.annualPrice)} / year`}
                  </small>
                </div>

                <div className="sa-limit-title">Plan limits</div>

                <div className="sa-limits">
                  <div className="sa-limit">
                    <span className="sa-limit-icon">▦</span>
                    <div>
                      Products
                      <b>{formatLimit(plan.products)}</b>
                    </div>
                  </div>

                  <div className="sa-limit">
                    <span className="sa-limit-icon">♙</span>
                    <div>
                      Users
                      <b>{formatLimit(plan.users)}</b>
                    </div>
                  </div>

                  <div className="sa-limit">
                    <span className="sa-limit-icon">⌂</span>
                    <div>
                      Branches
                      <b>{formatLimit(plan.branches)}</b>
                    </div>
                  </div>

                  <div className="sa-limit">
                    <span className="sa-limit-icon">♧</span>
                    <div>
                      Cashiers
                      <b>{formatLimit(plan.cashiers)}</b>
                    </div>
                  </div>

                  <div className="sa-limit">
                    <span className="sa-limit-icon">☁</span>
                    <div>
                      Storage
                      <b>
                        {plan.storage >= 1000
                          ? `${plan.storage / 1000} GB`
                          : `${plan.storage} MB`}
                      </b>
                    </div>
                  </div>
                </div>

                <div className="sa-features">
                  <h4>Included features</h4>

                  {plan.features.map((feature, index) => (
                    <div className="sa-feature" key={index}>
                      <span>✓</span>
                      {feature}
                    </div>
                  ))}

                  {plan.features.length === 0 && (
                    <div className="sa-feature">
                      No features configured.
                    </div>
                  )}
                </div>

                <div className="sa-plan-actions">
                  <div className="sa-action-group">
                    <button
                      className="sa-small-btn"
                      onClick={() => openEditModal(plan)}
                    >
                      Edit plan
                    </button>

                    <button
                      className="sa-small-btn"
                      onClick={() => toggleStatus(plan.id)}
                    >
                      {plan.active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      className="sa-small-btn danger"
                      onClick={() => deletePlan(plan.id)}
                    >
                      Delete
                    </button>
                  </div>

                  <button
                    className={`sa-featured-button ${
                      plan.featured ? "selected" : ""
                    }`}
                    onClick={() => toggleFeatured(plan.id)}
                  >
                    {plan.featured ? "★ Featured" : "☆ Feature plan"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {modalOpen && (
        <div
          className="sa-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h2>{editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}</h2>
              <button className="sa-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={savePlan}>
              <div className="sa-form-grid">
                <div className="sa-form-section">Basic information</div>

                <div className="sa-field">
                  <label>Plan name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Business Pro"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />
                </div>

                <div className="sa-field">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Describe this plan"
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </div>

                <div className="sa-form-section">Pricing (KES)</div>

                <div className="sa-field">
                  <label>Monthly price</label>
                  <input
                    type="number"
                    min="0"
                    value={form.monthlyPrice}
                    onChange={(event) =>
                      updateField("monthlyPrice", event.target.value)
                    }
                  />
                </div>

                <div className="sa-field">
                  <label>Annual price</label>
                  <input
                    type="number"
                    min="0"
                    value={form.annualPrice}
                    onChange={(event) =>
                      updateField("annualPrice", event.target.value)
                    }
                  />
                </div>

                <div className="sa-form-section">Usage limits</div>

                {[
                  ["products", "Maximum products"],
                  ["users", "Maximum users"],
                  ["branches", "Maximum branches"],
                  ["cashiers", "Maximum cashiers"],
                  ["storage", "Storage (MB)"],
                ].map(([field, label]) => (
                  <div className="sa-field" key={field}>
                    <label>{label}</label>
                    <input
                      type="number"
                      min="-1"
                      value={form[field]}
                      onChange={(event) =>
                        updateField(field, event.target.value)
                      }
                    />
                    <small>Enter -1 for unlimited.</small>
                  </div>
                ))}

                <div className="sa-form-section">Plan features</div>

                <div className="sa-field full">
                  <label>Included features</label>

                  {form.features.map((feature, index) => (
                    <div className="sa-feature-input" key={index}>
                      <input
                        type="text"
                        placeholder="Enter a feature"
                        value={feature}
                        onChange={(event) =>
                          updateFeature(index, event.target.value)
                        }
                      />

                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        title="Remove feature"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="sa-add-feature"
                    onClick={addFeature}
                  >
                    + Add another feature
                  </button>
                </div>
              </div>

              <div className="sa-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      updateField("active", event.target.checked)
                    }
                  />
                  Active plan
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      updateField("featured", event.target.checked)
                    }
                  />
                  Featured plan
                </label>
              </div>

              <div className="sa-modal-actions">
                <button
                  type="button"
                  className="sa-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sa-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPlan
                    ? "Save Changes"
                    : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notice && <div className="sa-notice">{notice}</div>}
    </div>
  );
}
