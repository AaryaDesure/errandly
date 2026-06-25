# Errandly 🛵

**A hyperlocal gig economy platform connecting customers with helpers for everyday errands.**

Customers post tasks — grocery runs, deliveries, home services, or anything local. Verified helpers nearby accept and complete them for payment. Built end-to-end as a full-stack portfolio project with production-level features.

---

## Live Demo

> Backend: *(deploy link here)*
> Frontend: *(deploy link here)*

---

## Features

### For Customers
- Post tasks with title, description, budget (₹), and live location via OpenStreetMap autocomplete
- Browse and assign helpers to accepted tasks
- Pay securely via Razorpay (test mode) with HMAC signature verification
- Rate and review helpers after task completion
- Raise disputes on incomplete or unsatisfactory tasks
- View full payment history with downloadable PDF receipts
- Referral system — earn ₹50 instantly credited on first share, tracked in notifications and payment history

### For Helpers
- Browse and accept open tasks nearby
- Manage task lifecycle: accept → in-progress → complete
- Personal stats dashboard with earnings, completed tasks, and ratings breakdown (powered by Recharts)
- Leaderboard ranking among other helpers
- Real-time notification polling for new assignments and updates

### Admin Panel
- Separate login at `/admin/login` (not publicly linked)
- Full analytics dashboard with charts and platform-wide stats
- User management: view, suspend, or remove customers and helpers
- Dispute resolution center
- CSV export of all platform data
- AI-powered rule-based insights for platform health monitoring

### Platform-wide
- JWT authentication with role-based access (customer / helper / admin)
- Rate limiting on all API endpoints via Flask-Limiter
- Real-time notification bell with polling
- Mobile-responsive UI across all pages
- Loading skeletons with minimum delay for perceived performance
- 404, 500, and server error pages

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Tailwind CSS | Utility-first styling |
| Recharts | Analytics charts and helper stats |
| jsPDF | Client-side PDF receipt generation |
| Axios | HTTP client with interceptors |
| OpenStreetMap Nominatim | Location autocomplete (no API key needed) |

### Backend
| Technology | Purpose |
|---|---|
| Flask | REST API server |
| SQLAlchemy | ORM and database abstraction |
| Flask-JWT-Extended | JWT auth with role claims |
| Flask-Limiter | Rate limiting |
| Flask-CORS | Cross-origin request handling |
| SQLite | Lightweight relational database |
| Razorpay | Payment gateway (test mode) |

---

## Project Structure

```
errandly/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/         # Reusable UI components
│       │   ├── NotificationBell.jsx
│       │   ├── LocationInput.jsx
│       │   ├── PdfReceipt.jsx
│       │   ├── Skeleton.jsx
│       │   └── ProtectedRoute.jsx
│       ├── pages/              # Route-level pages
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── CustomerDashboard.jsx
│       │   ├── HelperDashboard.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminLogin.jsx
│       │   └── PaymentHistory.jsx
│       ├── hooks/
│       │   └── useRazorpay.js
│       └── api.js              # Axios base config
│
├── backend/
│   ├── routes/
│   │   ├── auth.py             # Register, login, JWT
│   │   ├── tasks.py            # Full task lifecycle
│   │   ├── payments.py         # Razorpay integration
│   │   ├── ratings.py          # Reviews and ratings
│   │   ├── notifications.py    # Notification polling
│   │   ├── referrals.py        # Referral system
│   │   ├── users.py            # User profiles
│   │   └── admin.py            # Admin panel APIs
│   ├── models.py               # SQLAlchemy models
│   ├── extensions.py           # db, limiter instances
│   └── app.py                  # App factory and config
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- pip

### 1. Clone the repo

```bash
git clone https://github.com/AaryaDesure/errandly.git
cd errandly
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

Start the Flask server:

```bash
python3 app.py
```

Backend runs on `http://localhost:5000`

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Reset the database (optional)

```bash
cd backend
rm -f instance/errandly.db
python3 app.py
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register as customer or helper |
| POST | `/auth/login` | Login and receive JWT |
| GET/POST | `/tasks` | List or create tasks |
| PATCH | `/tasks/:id` | Update task status |
| POST | `/payments/create-order` | Create Razorpay order |
| POST | `/payments/verify` | Verify payment signature |
| POST | `/ratings` | Submit a rating |
| GET | `/notifications` | Poll notifications |
| POST | `/referrals/share` | Generate referral credit |
| GET | `/admin/stats` | Platform analytics (admin only) |

---

## Screenshots

> *(Add screenshots here once deployed)*

| Landing Page | Customer Dashboard |
|---|---|
| ![Landing](screenshots/landing.png) | ![Customer](screenshots/customer.png) |

| Helper Dashboard | Admin Panel |
|---|---|
| ![Helper](screenshots/helper.png) | ![Admin](screenshots/admin.png) |

---

## Key Implementation Details

- **JWT with role claims** — identity stored as string, role extracted via `get_jwt()` additional claims to avoid type errors
- **Razorpay HMAC verification** — payment signature validated server-side before marking tasks as paid
- **Circular import prevention** — `db` and `limiter` instances isolated in `extensions.py`, imported by both `app.py` and route files
- **Skeleton loading** — minimum 800ms display delay prevents flash of invisible loaders
- **Referral credits** — ₹50 applied immediately on first share, reflected in notifications, payment history, and admin stats in a single transaction

---

## Author

**Aarya Desure**
Fourth-year Computer Engineering student

[GitHub](https://github.com/AaryaDesure) · [LinkedIn](https://linkedin.com/in/your-handle)

---

## License

This project is for educational and portfolio purposes.