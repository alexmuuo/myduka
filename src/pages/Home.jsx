import { Link } from "react-router-dom";

function Home() {
  const features = [
    {
      icon: "bi-shop",
      title: "Your Online Store",
      description:
        "Create your own branded storefront where customers can discover your products and place orders.",
    },
    {
      icon: "bi-receipt",
      title: "Smart POS",
      description:
        "Make everyday sales easier with an integrated point-of-sale system for your cashiers.",
    },
    {
      icon: "bi-box-seam",
      title: "Inventory Management",
      description:
        "Manage products, stock levels, branches and inventory movements from one place.",
    },
    {
      icon: "bi-people",
      title: "Team Management",
      description:
        "Manage employees, assign roles and control access to your business operations.",
    },
    {
      icon: "bi-graph-up-arrow",
      title: "Business Reports",
      description:
        "Understand your sales, business performance and operations through organised reports.",
    },
    {
      icon: "bi-cart-check",
      title: "Order Management",
      description:
        "Keep track of customer orders, payments and deliveries as your business grows.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create your account",
      description: "Register and tell us about your business.",
    },
    {
      number: "02",
      title: "Set up your shop",
      description: "Add your products, branches and team members.",
    },
    {
      number: "03",
      title: "Start selling",
      description: "Manage sales, receive orders and grow your business.",
    },
  ];

  return (
    <main className="md-home">
      <style>{`
        .md-home {
          --md-primary: #635bdb;
          --md-primary-dark: #5048c7;
          --md-text: #182230;
          --md-muted: #667085;
          --md-border: #e8eaf0;
          background: #ffffff;
          color: var(--md-text);
          min-height: 100vh;
          overflow: hidden;
          font-family: inherit;
        }

        .md-home * {
          box-sizing: border-box;
        }

        .md-home-container {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .md-home-nav {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0f0f4;
          background: #fff;
        }

        .md-home-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--md-text);
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .md-home-logo-icon {
          width: 39px;
          height: 39px;
          border-radius: 12px;
          background: var(--md-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .md-home-nav-links {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .md-home-nav-links a {
          color: #475467;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .md-home-nav-links a:hover {
          color: var(--md-primary);
        }

        .md-home-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .md-home-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 21px;
          border-radius: 9px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: 0.2s ease;
          border: 1px solid transparent;
          cursor: pointer;
        }

        .md-home-btn-primary {
          background: var(--md-primary);
          color: white;
        }

        .md-home-btn-primary:hover {
          background: var(--md-primary-dark);
          color: white;
          transform: translateY(-1px);
        }

        .md-home-btn-outline {
          border-color: var(--md-border);
          color: var(--md-text);
          background: white;
        }

        .md-home-btn-outline:hover {
          border-color: var(--md-primary);
          color: var(--md-primary);
        }

        .md-home-hero {
          padding: 105px 0 100px;
          background:
            radial-gradient(circle at 85% 20%, #eeeaff 0, transparent 34%),
            radial-gradient(circle at 5% 85%, #f0efff 0, transparent 35%),
            #ffffff;
        }

        .md-home-hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 65px;
        }

        .md-home-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 30px;
          background: #eeecff;
          color: var(--md-primary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 23px;
        }

        .md-home-hero h1 {
          font-size: clamp(42px, 5.3vw, 66px);
          line-height: 1.09;
          letter-spacing: -2.8px;
          font-weight: 850;
          margin: 0 0 23px;
          color: #182230;
        }

        .md-home-highlight {
          color: var(--md-primary);
        }

        .md-home-hero-description {
          font-size: 17px;
          line-height: 1.8;
          color: var(--md-muted);
          max-width: 520px;
          margin-bottom: 30px;
        }

        .md-home-hero-actions {
          display: flex;
          gap: 13px;
          flex-wrap: wrap;
        }

        .md-home-hero-note {
          margin-top: 24px;
          font-size: 13px;
          color: #667085;
        }

        .md-home-visual {
          position: relative;
          padding: 18px;
          border: 1px solid #e8e5fa;
          border-radius: 24px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 25px 75px rgba(63, 55, 130, 0.12);
        }

        .md-home-visual-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 5px 20px;
        }

        .md-home-visual-dots {
          display: flex;
          gap: 5px;
        }

        .md-home-visual-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d0d5dd;
        }

        .md-home-preview-label {
          font-size: 11px;
          color: #667085;
          font-weight: 700;
        }

        .md-home-preview {
          border: 1px solid #eaecf0;
          border-radius: 15px;
          padding: 18px;
          background: #fafaff;
        }

        .md-home-preview-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .md-home-preview-title {
          font-size: 17px;
          font-weight: 800;
        }

        .md-home-preview-tag {
          font-size: 10px;
          padding: 6px 9px;
          background: #e9e7ff;
          color: var(--md-primary);
          border-radius: 20px;
          font-weight: 700;
        }

        .md-home-preview-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 11px;
        }

        .md-home-preview-stat {
          background: white;
          border: 1px solid #eaecf0;
          border-radius: 11px;
          padding: 15px;
        }

        .md-home-preview-stat small {
          display: block;
          font-size: 11px;
          color: #667085;
          margin-bottom: 8px;
        }

        .md-home-preview-stat strong {
          font-size: 21px;
          color: #344054;
        }

        .md-home-preview-stat i {
          float: right;
          color: var(--md-primary);
          font-size: 17px;
        }

        .md-home-preview-bottom {
          margin-top: 12px;
          background: white;
          border: 1px solid #eaecf0;
          border-radius: 11px;
          padding: 15px;
        }

        .md-home-preview-bottom h6 {
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 13px;
        }

        .md-home-preview-row {
          display: flex;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px solid #f0f0f4;
          font-size: 11px;
          color: #667085;
        }

        .md-home-preview-row:last-child {
          border-bottom: none;
        }

        .md-home-preview-row strong {
          color: #344054;
        }

        .md-home-floating {
          position: absolute;
          bottom: -22px;
          left: -25px;
          background: white;
          border: 1px solid #eeeafc;
          border-radius: 13px;
          padding: 13px 17px;
          box-shadow: 0 10px 35px rgba(63,55,130,0.13);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .md-home-floating-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16865c;
          background: #e8f8f0;
          font-size: 17px;
        }

        .md-home-section {
          padding: 90px 0;
        }

        .md-home-section-heading {
          max-width: 650px;
          margin: 0 auto 48px;
          text-align: center;
        }

        .md-home-section-heading span {
          color: var(--md-primary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .md-home-section-heading h2 {
          font-size: clamp(29px, 4vw, 40px);
          font-weight: 850;
          letter-spacing: -1.4px;
          margin: 13px 0;
          color: #182230;
        }

        .md-home-section-heading p {
          color: var(--md-muted);
          font-size: 15px;
          line-height: 1.8;
        }

        .md-home-features {
          background: #fafaff;
        }

        .md-home-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .md-home-feature {
          padding: 27px;
          border: 1px solid #ececf3;
          border-radius: 15px;
          background: white;
          transition: 0.2s ease;
        }

        .md-home-feature:hover {
          transform: translateY(-5px);
          border-color: #d9d4ff;
          box-shadow: 0 12px 30px rgba(63,55,130,0.07);
        }

        .md-home-feature-icon {
          width: 47px;
          height: 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eeecff;
          color: var(--md-primary);
          border-radius: 13px;
          font-size: 21px;
          margin-bottom: 20px;
        }

        .md-home-feature h3 {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .md-home-feature p {
          color: var(--md-muted);
          font-size: 13px;
          line-height: 1.8;
          margin: 0;
        }

        .md-home-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .md-home-step {
          text-align: center;
          padding: 20px;
        }

        .md-home-step-number {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border-radius: 17px;
          background: #eeecff;
          color: var(--md-primary);
          font-size: 17px;
          font-weight: 850;
        }

        .md-home-step h3 {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .md-home-step p {
          font-size: 13px;
          line-height: 1.8;
          color: var(--md-muted);
        }

        .md-home-cta {
          padding: 65px 30px;
          border-radius: 22px;
          text-align: center;
          background: linear-gradient(120deg, #5148c7, #7768e9);
          color: white;
          margin-bottom: 85px;
        }

        .md-home-cta h2 {
          font-size: clamp(27px, 4vw, 39px);
          font-weight: 850;
          letter-spacing: -1px;
          margin-bottom: 13px;
        }

        .md-home-cta p {
          color: rgba(255,255,255,0.82);
          font-size: 15px;
          margin-bottom: 25px;
        }

        .md-home-cta .md-home-btn {
          background: white;
          color: var(--md-primary);
        }

        .md-home-footer {
          border-top: 1px solid #eeeef3;
          padding: 27px 0;
        }

        .md-home-footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .md-home-footer p {
          color: #667085;
          font-size: 12px;
          margin: 0;
        }

        .md-home-footer-links {
          display: flex;
          gap: 22px;
        }

        .md-home-footer-links a {
          text-decoration: none;
          font-size: 12px;
          color: #667085;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .md-home-hero-grid {
            grid-template-columns: 1fr;
            gap: 55px;
          }

          .md-home-hero {
            padding: 75px 0;
          }

          .md-home-visual {
            max-width: 580px;
            width: 100%;
            margin: 0 auto;
          }

          .md-home-feature-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .md-home-container {
            width: min(100% - 30px, 1160px);
          }

          .md-home-nav {
            height: 68px;
          }

          .md-home-nav-links {
            display: none;
          }

          .md-home-nav-actions {
            gap: 7px;
          }

          .md-home-nav-actions .md-home-btn {
            padding: 9px 12px;
            font-size: 12px;
          }

          .md-home-logo {
            font-size: 21px;
          }

          .md-home-logo-icon {
            width: 34px;
            height: 34px;
          }

          .md-home-hero {
            padding: 65px 0 75px;
          }

          .md-home-hero h1 {
            font-size: 43px;
            letter-spacing: -1.9px;
          }

          .md-home-hero-description {
            font-size: 15px;
          }

          .md-home-hero-actions .md-home-btn {
            width: 100%;
          }

          .md-home-section {
            padding: 65px 0;
          }

          .md-home-feature-grid,
          .md-home-steps-grid {
            grid-template-columns: 1fr;
          }

          .md-home-feature {
            padding: 23px;
          }

          .md-home-floating {
            left: 5px;
            bottom: -35px;
          }

          .md-home-cta {
            padding: 45px 20px;
            margin-bottom: 60px;
          }

          .md-home-footer-inner {
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>

      {/* NAVIGATION */}
      <nav className="md-home-nav">
        <div className="md-home-container d-flex justify-content-between align-items-center w-100">
          <Link to="/" className="md-home-logo">
            <span className="md-home-logo-icon">
              <i className="bi bi-shop"></i>
            </span>
            MyDuka
          </Link>

          <div className="md-home-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </div>

          <div className="md-home-nav-actions">
            <Link to="/admin-login" className="md-home-btn md-home-btn-outline">
              Log in
            </Link>
            <Link to="/business-register" className="md-home-btn md-home-btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="md-home-hero">
        <div className="md-home-container md-home-hero-grid">
          <div>
            <div className="md-home-eyebrow">
              <i className="bi bi-stars"></i>
              ONE PLATFORM. YOUR ENTIRE BUSINESS.
            </div>

            <h1>
              Run your business.
              <br />
              <span className="md-home-highlight">Your way.</span>
            </h1>

            <p className="md-home-hero-description">
              Meet MyDuka — your all-in-one business management platform.
              Manage products, inventory, sales, customers and online orders
              from one simple platform.
            </p>

            <div className="md-home-hero-actions">
              <Link to="/business-register" className="md-home-btn md-home-btn-primary">
                Create your shop
                <i className="bi bi-arrow-right"></i>
              </Link>

              <a href="#features" className="md-home-btn md-home-btn-outline">
                Explore features
              </a>
            </div>

            <p className="md-home-hero-note">
              <i className="bi bi-check-circle-fill text-success me-2"></i>
              Everything your business needs, organised in one place.
            </p>
          </div>

          {/* Illustrative dashboard preview — not live business data */}
          <div className="md-home-visual">
            <div className="md-home-visual-header">
              <div className="md-home-visual-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="md-home-preview-label">
                MYDUKA PLATFORM PREVIEW
              </span>
            </div>

            <div className="md-home-preview">
              <div className="md-home-preview-top">
                <span className="md-home-preview-title">
                  Business Overview
                </span>
                <span className="md-home-preview-tag">Dashboard preview</span>
              </div>

              <div className="md-home-preview-stats">
                <div className="md-home-preview-stat">
                  <small>Products</small>
                  <strong><i className="bi bi-box-seam"></i></strong>
                </div>

                <div className="md-home-preview-stat">
                  <small>Orders</small>
                  <strong><i className="bi bi-cart3"></i></strong>
                </div>

                <div className="md-home-preview-stat">
                  <small>Inventory</small>
                  <strong><i className="bi bi-clipboard-data"></i></strong>
                </div>

                <div className="md-home-preview-stat">
                  <small>Customers</small>
                  <strong><i className="bi bi-people"></i></strong>
                </div>
              </div>

              <div className="md-home-preview-bottom">
                <h6>Manage your business</h6>

                <div className="md-home-preview-row">
                  <span><i className="bi bi-box me-2"></i>Products</span>
                  <strong>Manage</strong>
                </div>

                <div className="md-home-preview-row">
                  <span><i className="bi bi-shop me-2"></i>Online Store</span>
                  <strong>Manage</strong>
                </div>

                <div className="md-home-preview-row">
                  <span><i className="bi bi-receipt me-2"></i>Sales & Orders</span>
                  <strong>Manage</strong>
                </div>

                <div className="md-home-preview-row">
                  <span><i className="bi bi-people me-2"></i>Team</span>
                  <strong>Manage</strong>
                </div>
              </div>
            </div>

            <div className="md-home-floating">
              <span className="md-home-floating-icon">
                <i className="bi bi-check-lg"></i>
              </span>
              Your business, under control.
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="md-home-section md-home-features" id="features">
        <div className="md-home-container">
          <div className="md-home-section-heading">
            <span>Everything connected</span>
            <h2>One platform. Multiple possibilities.</h2>
            <p>
              Stop juggling different tools to run your business.
              MyDuka brings your essential business operations together.
            </p>
          </div>

          <div className="md-home-feature-grid">
            {features.map((feature) => (
              <article className="md-home-feature" key={feature.title}>
                <div className="md-home-feature-icon">
                  <i className={`bi ${feature.icon}`}></i>
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="md-home-section" id="how-it-works">
        <div className="md-home-container">
          <div className="md-home-section-heading">
            <span>Getting started</span>
            <h2>Your business journey starts here.</h2>
            <p>
              Getting your business onto MyDuka is designed to be
              straightforward.
            </p>
          </div>

          <div className="md-home-steps-grid">
            {steps.map((step) => (
              <article className="md-home-step" key={step.number}>
                <div className="md-home-step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="md-home-container">
        <div className="md-home-cta">
          <h2>Ready to take control of your business?</h2>
          <p>
            Create your shop and bring your business operations together
            with MyDuka.
          </p>

          <Link to="/business-register" className="md-home-btn">
            Get started with MyDuka
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="md-home-footer">
        <div className="md-home-container md-home-footer-inner">
          <Link to="/" className="md-home-logo">
            <span className="md-home-logo-icon">
              <i className="bi bi-shop"></i>
            </span>
            MyDuka
          </Link>

          <p>
            © {new Date().getFullYear()} MyDuka. All rights reserved.
          </p>

          <div className="md-home-footer-links">
            <Link to="/admin-login">Log in</Link>
            <Link to="/business-register">Create a shop</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
