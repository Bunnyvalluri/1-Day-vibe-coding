# ⛪ Grace Community Church — Event Registration System

A full-stack, production-ready **Church Event Registration & Attendance Management Portal** built in a single day as part of the *1 Day One Vibe Coding* challenge.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL (Neon) via Prisma ORM |
| **Auth** | JWT (JSON Web Tokens) + bcryptjs |
| **QR Codes** | `qrcode` npm package |
| **Reports** | PDFKit + CSV export |

---

## ✨ Features

### 🌐 Public Landing Page
- Animated hero with gradient mesh blobs
- Upcoming events calendar with filters & category badges
- Seat booking system with real-time capacity tracking
- Responsive ministry cards, testimonials, FAQs & newsletter

### 🔐 Role-Based Dashboard System (4 Access Levels)
| Role | Capabilities |
|---|---|
| **Member** | View/cancel registrations, QR pass, `.ics` calendar download, attendance gauge |
| **Ministry Leader** | Create events, roll-call management, QR scanner with audio beep, session logs |
| **Admin** | User registry with filters, role management, broadcast notifications, analytics |
| **Super Admin** | System diagnostics, audit logs, settings, JSON backup exporter |

### 🎫 QR Ticket System
- Per-registration secure QR code generation
- Camera-based scanning via `html5-qrcode`
- Audio beep feedback on successful check-in (Web Audio API)

### 📊 Reports
- PDF & CSV attendance export per event
- Real-time attendance rate tracking

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)

### 1. Clone the repo
```bash
git clone https://github.com/Bunnyvalluri/1-Day-one-vibe-coding.git
cd "1-Day-one-vibe-coding"
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your_strong_secret_here"
PORT=5000
```

Run migrations and seed:
```bash
npx prisma db push
npx prisma db seed
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Quick Start (both servers)
```powershell
./start.ps1
```

---

## 🗄️ Database Setup (Neon)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy your connection string into `backend/.env` as `DATABASE_URL`
3. Go to the **SQL Editor** in Neon Console
4. Run the contents of `neon_setup.sql` to seed all tables

---

## 👤 Seeded Test Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| Elijah Vance | `superadmin@church.com` | `Admin123!` | Super Admin |
| Sarah Jenkins | `admin@church.com` | `Admin123!` | Admin |
| David Praise | `worship@church.com` | `Leader123!` | Ministry Leader |
| Grace Miller | `member@church.com` | `Member123!` | Member |

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/     # Auth, Events, Attendance, Reports, Notifications
│   │   ├── middleware/      # JWT auth middleware + role guards
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── server.ts        # Express app + all routes
│   └── prisma/
│       └── schema.prisma    # Database schema
├── frontend/
│   └── app/
│       ├── dashboard/
│       │   ├── layout.tsx   # Shared sidebar + notifications header
│       │   ├── member/      # Member portal
│       │   ├── leader/      # Ministry leader dashboard
│       │   ├── admin/       # Admin dashboard
│       │   ├── superadmin/  # Super admin settings
│       │   └── profile/     # Profile edit page
│       ├── login/           # Login page
│       ├── register/        # Registration page
│       ├── events/[id]/     # Public event detail page
│       ├── globals.css      # Design system & animations
│       └── page.tsx         # Landing page
├── neon_setup.sql           # Full DB seed script
├── start.ps1                # Dev startup helper
└── docker-compose.yml       # Docker support
```

---

## 📸 Screenshots

| Section | Description |
|---|---|
| Landing Page | Full colorful hero, stats bar, events calendar |
| Member Dashboard | Active tickets, QR pass, .ics export, attendance gauge |
| Leader Dashboard | Event management, QR scanner, roll-call, session logs |
| Admin Dashboard | User registry filters, broadcast center, distributions |
| Super Admin | System diagnostics, audit logs, JSON backup |
| Profile Edit | Personal info + secure password change |

---

## 🏆 Built For
**1 Day One Vibe Coding Challenge** — A full-stack church management system built in a single session, showcasing speed, design, and engineering depth.

---

*Made with ❤️ and lots of ☕*
