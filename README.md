# Banquetes Almar System (v2.0.0)

> **Official Web Platform & Event Management Suite for Banquetes Almar (Marinilla, Antioquia)**  
> High-end social event quoting, reservations, CRM pipeline, inventory control, customer portal, and executive administration.

---

## 🌟 Overview

**Banquetes Almar** is an end-to-end platform tailored for premium event catering, venue setup, and furniture rental in Marinilla and the Oriente Antioqueño region. The system offers a customer-facing portal for interactive quote calculation and event progress tracking, alongside a comprehensive administrative back-office.

---

## 🛠️ Tech Stack & Architecture

The platform operates on a **Serverless Architecture** powered by Google Firebase and modern frontend engineering:

- **Frontend Core:** Vanilla JavaScript (ES6+ Modules), HTML5 Semantic Structure.
- **Styling & UI System:** [Tailwind CSS v3.4](https://tailwindcss.com/) with a curated luxury color scheme (*Gold, Obsidian, Champagne*), glassmorphism, and responsive design.
- **Feedback & Dialogs:** [SweetAlert2](https://sweetalert2.github.io/) with customized gala theme.
- **Backend & Database:** [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) (NoSQL Cloud Database) with real-time sync.
- **Authentication & Security:** [Firebase Authentication](https://firebase.google.com/docs/auth) with session management and route guards.
- **Media & Asset Hosting:** [Cloudinary](https://cloudinary.com/) direct media API for optimized image delivery.
- **Deployment:** [Firebase Hosting](https://firebase.google.com/docs/hosting) with edge cache control.

---

## 📁 Project Structure

```text
.
├── .firebaserc                          # Firebase project configuration
├── firebase.json                        # Firebase Hosting, Firestore, and Storage deployment config
├── firestore.rules                      # Cloud Firestore security rules
├── firestore.indexes.json               # Firestore compound index definitions
├── storage.rules                        # Firebase Storage security rules
├── tailwind.config.js                   # Tailwind CSS custom theme & luxury design tokens
├── package.json                         # Project dependencies, scripts, and build tasks
├── scripts/                             # Administrative and automation scripts
│   ├── create-firebase-admin.mjs        # Admin provisioning and credential verification
│   └── migrate-sql-to-firestore.mjs     # Legacy SQL to Firestore migration pipeline
└── frontend/                            # Client-facing web application & Admin Suite
    ├── index.html                       # Public landing page & interactive event configurator
    ├── portafolio-servicios.html        # Service catalog showcase
    ├── portafolio-servicios-detalle.html# Detailed view for individual services
    ├── portal-cliente.html              # Customer portal (event tracking & payment verification)
    ├── admin/                           # Executive Admin Control Panel
    │   ├── login.html                   # Admin authentication portal
    │   ├── dashboard.html               # KPIs, analytics, and upcoming event summaries
    │   ├── cotizaciones.html            # CRM Kanban board / quotation pipeline
    │   ├── reservas.html                # Booking management & agenda calendar view
    │   ├── calendario.html              # General calendar view redirect
    │   ├── clientes.html                # Client directory and history
    │   ├── cliente.html                 # Individual customer profile
    │   ├── paquetes.html                # Event packages manager (Weddings, XV, Proms)
    │   ├── servicios.html               # Individual services manager
    │   ├── galeria.html                 # Media gallery manager (Cloudinary uploads)
    │   ├── inventario.html              # Furniture, decor, and glassware inventory manager
    │   ├── pagos.html                   # Payment and installment ledger
    │   ├── anuncio.html                 # Top notification banner configuration
    │   └── contrato.html                # Printable event legal contract generator
    ├── css/                             # Stylesheets
    │   ├── tailwind-input.css           # Tailwind source with bespoke luxury styles
    │   └── tailwind.css                 # Compiled & minified production stylesheet
    └── js/                              # Modular JavaScript architecture
        ├── app.js                       # Public landing page interactions
        ├── apple-configurator.js        # High-end step-by-step event quoting engine
        ├── cotizador-ecommerce.js       # E-commerce cart & quote calculations
        ├── alquiler-cart.js             # Furniture rental cart logic
        ├── alerts-luxury.js             # Reusable SweetAlert2 luxury alerts
        ├── components/                  # Shared UI components
        │   └── admin-navbar.js          # Unified executive glassmorphic admin navigation
        ├── firebase/                    # Firebase SDK integration
        │   ├── config.js                # Firebase client credentials
        │   ├── auth.js                  # Authentication & route protection service
        │   ├── db.js                    # Firestore service methods (CRUD operations)
        │   └── seed-data.js             # Official default packages and catalog
        └── services/                    # Cloud integration services
            └── cloudinary-service.js    # Direct image upload and optimization
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)

### 1. Clone the Repository

```bash
git clone https://github.com/torvi30/banquetes-almar-system.git
cd "banquetes almar"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Styles

Build the minified production stylesheet using Tailwind CSS:

```bash
npm run build:css
```

### 4. Run Development Server

Start the live local HTTP server along with Tailwind CSS watch mode:

```bash
npm run dev
```

The application will be served locally at:
👉 **`http://localhost:5000`**

- **Public Site:** `http://localhost:5000`
- **Customer Portal:** `http://localhost:5000/portal-cliente.html`
- **Admin Suite:** `http://localhost:5000/admin/login.html`

---

## ⚙️ Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `npm run dev` | Runs Tailwind CSS in watch mode and serves the `frontend` on port 5000 |
| `build:css` | `npm run build:css` | Compiles and minifies `frontend/css/tailwind-input.css` to `tailwind.css` |
| `watch:css` | `npm run watch:css` | Compiles CSS continuously on file changes |
| `start` | `npm start` | Serves the `frontend` directory on port 5000 without watching CSS |
| `admin:setup` | `npm run admin:setup` | Creates or verifies the initial Firebase Administrator user |
| `db:migrate` | `npm run db:migrate` | Seeds/migrates default catalog and structure to Firestore |

---

## 🔐 Administrative Access

To provision the default administrator account in Firebase Authentication:

```bash
npm run admin:setup
```

By default, this provisions:
- **Email:** `admin@almar.com`
- **Password:** `Admin123*`

To customize credentials during setup:
```bash
node scripts/create-firebase-admin.mjs <email> <password> "<displayName>"
```

---

## 🌐 Deployment to Firebase Hosting

Ensure you have the Firebase CLI installed:

```bash
npm install -g firebase-tools
```

Authenticate and deploy:

```bash
firebase login
firebase deploy
```

---

## 📜 Development Guidelines

- **Interaction & Communication:** All developer communication with stakeholders is in **Spanish**.
- **Technical Language Policy:** All code, commits, comments, database schemas, and documentation are strictly written in **English** (see [AGENTS.md](AGENTS.md)).
- **Git Commit Convention:** Uses [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).

---

## 📄 License

Proprietary — Developed for **Banquetes Almar**. All rights reserved.
