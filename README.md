# 🏫 Bannari Amman Institute of Technology — Hostel Management System

A full-stack, production-grade hostel management web application built with React, Node.js, Express, and MySQL.

---

## 🗂️ Folder Structure

```
hostel-mgmt/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # MySQL connection pool
│   │   │   └── schema.sql         # Full DB schema + seed data
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── studentController.js
│   │   │   ├── roomController.js
│   │   │   ├── allocationController.js
│   │   │   └── complaintController.js
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT authenticate + adminOnly
│   │   ├── routes/
│   │   │   └── index.js           # All API routes
│   │   └── index.js               # Express app entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ui/
    │   │   │   └── index.jsx      # Button, Badge, Card, Modal, Table, StatCard…
    │   │   └── layout/
    │   │       └── Sidebar.jsx    # Sidebar with collapse, mobile support
    │   ├── context/
    │   │   ├── AuthContext.jsx    # JWT auth state
    │   │   └── ThemeContext.jsx   # Dark/light mode
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── StudentsPage.jsx
    │   │   ├── RoomsPage.jsx
    │   │   ├── AllocationsPage.jsx
    │   │   ├── ComplaintsPage.jsx
    │   │   └── NoticesPage.jsx
    │   ├── services/
    │   │   └── api.js             # Axios API service layer
    │   ├── App.jsx
    │   ├── index.js
    │   └── index.css
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## ⚙️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Tailwind CSS, Framer Motion, Recharts |
| Backend    | Node.js, Express.js               |
| Database   | MySQL 8+                          |
| Auth       | JWT (jsonwebtoken + bcryptjs)     |
| HTTP       | Axios                             |

---

## 🚀 Setup Instructions

### Option A (Recommended): Run with Docker Compose

Prereqs: Docker Desktop (includes Docker Compose)

```bash
cd hostel-mgmt
docker compose up --build
```

Then open:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

The MySQL container is initialized automatically from `backend/src/config/schema.sql`.

### Prerequisites
- Node.js v18+
- MySQL 8+
- npm or yarn

---

### 1. Clone / Extract the project

```bash
cd hostel-mgmt
```

---

### 2. Set up the Database

Open MySQL and run the schema file:

```sql
mysql -u root -p < backend/src/config/schema.sql
```

Or open MySQL Workbench and run the contents of `schema.sql`.

This creates:
- `hostel_mgmt` database
- All tables (users, students, rooms, allocations, complaints, notices, visitors)
- Default admin user
- Sample room data

---

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hostel_mgmt
JWT_SECRET=bannari_amman_hostel_super_secret_2026
JWT_EXPIRES_IN=7d
```

---

### 4. Install & Start Backend

```bash
cd backend
npm install
npm run dev      # development (nodemon)
# or
npm start        # production
```

Server runs at: `http://localhost:5000`

---

### 5. Install & Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔐 Default Login Credentials

| Field    | Value                     |
|----------|---------------------------|
| Email    | admin@baithotel.edu       |
| Password | password                  |
| Role     | Admin                     |

> To change the password, log in and use the profile settings, or hash a new password with bcrypt and update the `users` table.

---

## 📡 API Routes

### Auth
| Method | Route                    | Access |
|--------|--------------------------|--------|
| POST   | /api/auth/login          | Public |
| GET    | /api/auth/me             | Auth   |
| PUT    | /api/auth/change-password| Auth   |

### Dashboard
| Method | Route           | Access |
|--------|-----------------|--------|
| GET    | /api/dashboard  | Auth   |

### Students
| Method | Route                   | Access |
|--------|-------------------------|--------|
| GET    | /api/students           | Auth   |
| GET    | /api/students/export    | Admin  |
| GET    | /api/students/:id       | Auth   |
| POST   | /api/students           | Admin  |
| PUT    | /api/students/:id       | Admin  |
| DELETE | /api/students/:id       | Admin  |

### Rooms
| Method | Route           | Access |
|--------|-----------------|--------|
| GET    | /api/rooms      | Auth   |
| GET    | /api/rooms/:id  | Auth   |
| POST   | /api/rooms      | Admin  |
| PUT    | /api/rooms/:id  | Admin  |
| DELETE | /api/rooms/:id  | Admin  |

### Allocations
| Method | Route                        | Access |
|--------|------------------------------|--------|
| POST   | /api/allocations/allocate    | Admin  |
| POST   | /api/allocations/vacate      | Admin  |
| GET    | /api/allocations/history     | Auth   |

### Complaints
| Method | Route                | Access |
|--------|----------------------|--------|
| GET    | /api/complaints      | Auth   |
| POST   | /api/complaints      | Auth   |
| PUT    | /api/complaints/:id  | Admin  |
| DELETE | /api/complaints/:id  | Admin  |

---

## ✨ Features

- **JWT Authentication** — Secure login, token stored in localStorage, auto-logout on expiry
- **Role-based access** — Admin vs Student (admin-only routes protected)
- **Dashboard** — Live stats, block occupancy bar chart, room status pie chart, recent activity feeds
- **Student Management** — Full CRUD, search, filter by dept/year/fee, pagination, CSV export
- **Room Management** — Grid + table view, visual occupancy progress bars, room detail modal
- **Allocations** — Atomic transactions, prevent over-allocation, full history log
- **Complaints** — File, filter, update status, admin notes, priority levels
- **Notice Board** — Post, categorize, target by block
- **Dark Mode** — Full dark/light theme with localStorage persistence
- **Responsive UI** — Mobile sidebar with overlay, responsive grid layouts
- **Animations** — Framer Motion page transitions, staggered list reveals, hover micro-interactions

---

## 🎨 Design System

- **Colors**: Maroon (#7b1c2e) primary, Gold (#c9992a) accent
- **Typography**: Playfair Display (headings), DM Sans (body), DM Mono (code/numbers)
- **Components**: Reusable Button, Badge, Card, Input, Select, Textarea, Modal, Table, StatCard, Spinner, EmptyState

---

## 🛠️ Extending the Project

- Add **Visitor Management** page using the `visitors` table
- Add **Attendance Tracking** with morning/night roll call
- Add **Mess Menu** management
- Integrate **Email/SMS** notifications for complaints and notices
- Add **Student portal** (separate login with limited views)
