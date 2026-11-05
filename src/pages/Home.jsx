import { Link } from "react-router-dom";
import {
STORE_NAME,
STORE_TAGLINE,
STORE_LOCATION,
} from "../config/store";

function Home() {
const categories = [
{
icon: "bi-cup-straw",
title: "Whisky",
description: "Explore classic and premium whisky selections",
accent: "whisky",
},
{
icon: "bi-stars",
title: "Vodka & Gin",
description: "Discover spirits for every occasion",
accent: "spirits",
},
{
icon: "bi-people",
title: "Rum & Brandy",
description: "Explore distinctive flavours and favourites",
accent: "rum",
},
{
icon: "bi-gift",
title: "Shop All Products",
description: "Browse the full range available in our store",
accent: "all",
},
];

const benefits = [
{
icon: "bi-bag-check",
title: "Easy Ordering",
description: "Browse our catalogue and order conveniently.",
},
{
icon: "bi-shield-check",
title: "Trusted Service",
description: "A straightforward, reliable shopping experience.",
},
{
icon: "bi-truck",
title: "Pickup & Delivery",
description: "Choose the available fulfilment option that suits you.",
},
];

return ( <main className="hm-home"> <section className="hm-hero"> <div className="hm-hero-glow hm-hero-glow-one" /> <div className="hm-hero-glow hm-hero-glow-two" />


    <div className="container hm-hero-container">
      <div className="row align-items-center g-5">
        <div className="col-lg-7">
          <div className="hm-eyebrow">
            <span className="hm-eyebrow-dot" />
            YOUR LOCAL BOTTLE STORE
          </div>

          <h1>
            Good taste.
            <br />
            <span>Great company.</span>
          </h1>

          <p className="hm-hero-copy">
            Welcome to {STORE_NAME}. Discover your favourites,
            explore something new, and make your next occasion
            worth remembering.
          </p>

          <div className="hm-hero-actions">
            <Link to="/products" className="hm-btn hm-btn-primary">
              Explore the collection
              <i className="bi bi-arrow-up-right" />
            </Link>

            <Link to="/products" className="hm-btn hm-btn-outline">
              Browse products
            </Link>
          </div>

          <div className="hm-hero-note">
            <i className="bi bi-geo-alt" />
            <span>{STORE_LOCATION}</span>
            <span className="hm-note-divider" />
            <span>{STORE_TAGLINE}</span>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="hm-showcase">
            <div className="hm-showcase-top">
              <span>FEATURED PICKS</span>
              <i className="bi bi-stars" />
            </div>

            <div className="hm-showcase-art">
              <div className="hm-orbit hm-orbit-one" />
              <div className="hm-orbit hm-orbit-two" />

              <div className="hm-bottle hm-bottle-back">
                <div className="hm-bottle-neck" />
                <div className="hm-bottle-body">
                  <div className="hm-bottle-label">
                    <span>H</span>
                  </div>
                </div>
              </div>

              <div className="hm-bottle hm-bottle-front">
                <div className="hm-bottle-neck" />
                <div className="hm-bottle-body">
                  <div className="hm-bottle-label">
                    <span className="hm-label-small">THE</span>
                    <span className="hm-label-main">HM</span>
                    <span className="hm-label-small">COLLECTION</span>
                  </div>
                </div>
              </div>

              <div className="hm-art-caption">
                <span>THE ART OF A GOOD POUR</span>
                <span className="hm-caption-line" />
              </div>
            </div>

            <div className="hm-showcase-bottom">
              <div>
                <span className="hm-showcase-label">DISCOVER YOUR NEXT FAVOURITE</span>
                <h3>Make it a moment.</h3>
              </div>

              <Link
                to="/products"
                className="hm-round-link"
                aria-label="Explore products"
              >
                <i className="bi bi-arrow-up-right" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section className="hm-category-section">
    <div className="container">
      <div className="hm-section-heading">
        <div>
          <span className="hm-section-kicker">FIND YOUR FAVOURITE</span>
          <h2>Explore the collection<span>.</span></h2>
          <p>
            From familiar favourites to something new, start
            with what you love.
          </p>
        </div>

        <Link to="/products" className="hm-text-link">
          View all products
          <i className="bi bi-arrow-up-right" />
        </Link>
      </div>

      <div className="row g-3">
        {categories.map((category, index) => (
          <div className="col-sm-6 col-lg-3" key={category.title}>
            <Link
              to="/products"
              className={`hm-category-card hm-category-${category.accent}`}
            >
              <div className="hm-category-top">
                <span className="hm-category-index">
                  0{index + 1}
                </span>

                <span className="hm-category-icon">
                  <i className={`bi ${category.icon}`} />
                </span>
              </div>

              <div className="hm-category-content">
                <h3>{category.title}</h3>
                <p>{category.description}</p>

                <span className="hm-category-link">
                  Explore category
                  <i className="bi bi-arrow-up-right" />
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>

  <section className="hm-experience-section">
    <div className="container">
      <div className="hm-experience-heading">
        <span className="hm-section-kicker">THE MYDUKA EXPERIENCE</span>
        <h2>Good service is always in style.</h2>
        <p>
          A convenient way to explore our range and arrange your order.
        </p>
      </div>

      <div className="row g-4">
        {benefits.map((benefit, index) => (
          <div className="col-md-4" key={benefit.title}>
            <article className="hm-benefit-card">
              <span className="hm-benefit-number">
                0{index + 1}
              </span>

              <div className="hm-benefit-icon">
                <i className={`bi ${benefit.icon}`} />
              </div>

              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          </div>
        ))}
      </div>
    </div>
  </section>

  <section className="hm-cta-section">
    <div className="container">
      <div className="hm-cta-panel">
        <div className="hm-cta-decoration">HM</div>

        <div className="hm-cta-content">
          <span className="hm-section-kicker">YOUR NEXT FAVOURITE AWAITS</span>
          <h2>Make room for something memorable.</h2>
          <p>
            Browse our selection and find the right fit for your
            next gathering or special occasion.
          </p>

          <Link to="/products" className="hm-btn hm-btn-light">
            Shop the collection
            <i className="bi bi-arrow-up-right" />
          </Link>
        </div>
      </div>
    </div>
  </section>

  <footer className="hm-home-footer">
    <div className="container">
      <div className="hm-footer-inner">
        <Link to="/" className="hm-footer-brand">
          <span className="hm-footer-monogram">H</span>
          <span>
            <strong>{STORE_NAME}</strong>
            <small>GOOD TASTE STARTS HERE</small>
          </span>
        </Link>

        <span className="hm-footer-location">
          <i className="bi bi-geo-alt" />
          {STORE_LOCATION}
        </span>

        <Link to="/products" className="hm-footer-link">
          Browse products
          <i className="bi bi-arrow-up-right" />
        </Link>
      </div>

      <div className="hm-footer-bottom">
        <span>
          © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </span>
        <span>Please enjoy responsibly. For adults of legal drinking age only.</span>
      </div>
    </div>
  </footer>
</main>


);
}

export default Home;
