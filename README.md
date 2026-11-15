# MyDuka

**A multi-business commerce and business management platform.**

MyDuka is a multi-tenant commerce platform designed to allow independent businesses to manage their products, inventory, branches, sales, customers, staff and online storefronts from one platform.

Each business operates independently, with its own business data, staff, inventory and storefront branding.

---

## 1. Technology Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- Bootstrap 5
- Bootstrap Icons
- Supabase JavaScript Client

### Backend
- Python
- Flask
- SQLAlchemy
- Supabase PostgreSQL
- Supabase Authentication

### Deployment
- Vercel
- Supabase

---

## 2. Project Structure

```text
myduka/
│
├── api/
│   └── index.py
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── migrations/
│   ├── app.py
│   ├── auth.py
│   ├── config.py
│   ├── extensions.py
│   └── requirements.txt
│
├── public/
│
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── data/
│   ├── pages/
│   │   ├── cashier/
│   │   ├── seller/
│   │   └── storefront/
│   ├── styles/
│   ├── App.jsx
│   ├── main.jsx
│   └── supabaseClient.js
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── requirements.txt
├── vercel.json
└── vite.config.js
```

The structure above describes the current project organisation. It will evolve as the frontend and backend are completed.

---

## 3. Platform Interfaces

MyDuka has four primary interfaces.

### Super Admin
Responsible for platform-wide administration, businesses, users, subscriptions, analytics and platform settings.

### Business Owner
Responsible for managing an individual business, including products, categories, branches, inventory, cashiers, sales, customers, orders, payments and reports.

### Cashier
Provides branch-level point-of-sale functionality, sales history, held sales, stock visibility and shift management.

### Customer Storefront
Provides each business with an independent online shop where customers can browse products, manage carts, place orders and manage their accounts.

---

## 4. Data Architecture Principles

The following rules guide the platform's architecture.

- Each business must have isolated data.
- Users must only access resources permitted by their roles and business memberships.
- Product catalogue records must remain separate from branch inventory.
- Every stock receipt must preserve its own quantity, buying price and selling price.
- Historical stock receipt prices must not be overwritten by later price changes.
- Stock transfers must preserve their source and destination branches.
- Customer online orders must remain separate from cashier POS sales.
- Customer shopping carts must be isolated by storefront.
- Storefront branding must be configurable independently for each business.
- Dashboard theme preferences must be maintained independently for each user.

---

## 5. Frontend Development

The frontend is built with React and Vite.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Preview a production build:

```bash
npm run preview
```

---

## 6. Backend Development

The backend is built with Flask and SQLAlchemy.

The main Flask application is:

```text
backend/app.py
```

The Vercel serverless entry point is:

```text
api/index.py
```

For local backend development, install the Python dependencies:

```bash
pip install -r backend/requirements.txt
```

Create a local environment file:

```text
backend/.env
```

Use `backend/.env.example` as the configuration reference.

Start the Flask application:

```bash
cd backend
python app.py
```

The local API health endpoint is:

```text
http://localhost:5000/api/health
```

---

## 7. Environment Configuration

The backend requires environment variables for:

- Supabase project URL
- Supabase public authentication key
- PostgreSQL database connection
- Frontend URL and CORS origins

Additional integrations may require email and M-Pesa configuration.

Never commit real credentials, private keys, database passwords or access tokens.

The frontend Supabase configuration must also be supplied through the appropriate Vite environment variables.

---

## 8. API Architecture

The frontend communicates with the backend through the central Axios configuration:

```text
src/api/api.js
```

The frontend API base defaults to:

```text
/api
```

The API client handles Supabase authentication tokens and the selected business identifier.

The Flask application is responsible for validating authentication, permissions and business access before processing protected requests.

---

## 9. Deployment Architecture

The frontend and Flask API are configured for Vercel deployment.

The root `vercel.json` handles routing:

- `/api/*` requests are forwarded to the Python API entry point.
- Other routes are directed to the React application.

The Vite configuration supports local development.

Supabase provides the PostgreSQL database and authentication services.

---

## 10. Development Roadmap

MyDuka development follows this order:

1. Repository audit and cleanup.
2. Complete all frontend interfaces.
3. Complete frontend navigation, validation and responsive layouts.
4. Verify frontend state and data flows.
5. Implement backend APIs.
6. Complete database models, migrations and tenant isolation.
7. Connect frontend modules to backend services.
8. Implement external integrations.
9. Perform end-to-end testing.
10. Prepare production deployment.

**Development priority:** Finish the frontend before proceeding with the remaining backend implementation.

---

## 11. Project Independence

MyDuka is an independent SaaS project.

Its source code, GitHub repository, Vercel project, Supabase database and storage must remain separate from other business applications.

---

**MyDuka — One platform. Independent businesses.**
