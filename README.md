# AI Healthcare Platform

A production-ready, full-stack AI-powered healthcare platform with symptom analysis, doctor recommendations, appointment booking, and video consultations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Redux Toolkit |
| Backend | Python FastAPI (async) |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (access + refresh tokens) |
| AI | OpenAI GPT-4o-mini (+ rule-based fallback) |
| Video | WebRTC / Daily.co integration |

## Features

- **Role-based auth** — Patient / Doctor / Admin
- **AI Symptom Checker** — Natural language input → condition analysis → doctor recommendations
- **AI Health Chat** — Conversational AI health assistant
- **Doctor Directory** — 20 pre-seeded verified specialists with filters
- **Appointment Booking** — 3-step booking with date/time selection
- **Video Consultations** — WebRTC + Daily.co room support
- **Doctor Dashboard** — Accept/reject appointments, add prescriptions
- **Admin Panel** — Manage users, verify doctors, view stats
- **Dark mode ready** architecture

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- MongoDB (local or Atlas)

### 1. Clone & Configure

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET_KEY=your-secret-key-minimum-32-characters
OPENAI_API_KEY=sk-your-openai-key   # optional, fallback works without it
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database (creates 20 doctors + admin account)
python seed_data.py

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: http://localhost:5173

### 4. Docker (All-in-One)

```bash
# From project root
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MongoDB: localhost:27017

## Test Accounts

After running `seed_data.py`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aihealthcare.com | Admin@123 |
| Patient | Register new account | Any 8+ char password |
| Doctor | Register as Doctor | Any 8+ char password |

## Project Structure

```
AIHealthCare/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config/settings.py   # Environment config
│   │   ├── database/            # MongoDB connection
│   │   ├── models/              # Document models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth middleware
│   │   ├── ai/                  # AI symptom analyzer
│   │   └── utils/               # Helpers, JWT, bcrypt
│   ├── seed_data.py             # 20 doctors + admin
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # All pages
│   │   ├── components/          # Reusable components
│   │   ├── layouts/             # Dashboard layout
│   │   ├── redux/               # State management
│   │   ├── services/api.js      # Axios + auth interceptors
│   │   ├── routes/              # Protected routes
│   │   └── utils/               # Helpers
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
│
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh token |
| GET | /api/doctors | List doctors (with filters) |
| GET | /api/doctors/:id | Get doctor |
| POST | /api/ai/analyze | AI symptom analysis |
| POST | /api/ai/chat | AI health chat |
| POST | /api/appointments | Book appointment |
| PATCH | /api/appointments/:id/status | Update status |
| POST | /api/video/session/:appointmentId | Create video session |
| GET | /api/admin/stats | Admin statistics |

Full interactive docs: http://localhost:8000/docs

## AI Flow

```
User enters symptoms
    ↓
POST /api/ai/analyze
    ↓
OpenAI GPT-4o-mini (or rule-based fallback)
    ↓
Returns: conditions, severity, specialist type, precautions
    ↓
MongoDB query → matching doctors by specialization
    ↓
Response with analysis + recommended doctors
```

## Security Notes

- JWT access tokens expire in 60 minutes
- Refresh tokens expire in 7 days
- Passwords hashed with bcrypt (cost 12)
- CORS configured for specific origins
- Role-based route protection
- Input validation via Pydantic

## Environment Variables

### Backend (.env)
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=aihealthcare
JWT_SECRET_KEY=<min 32 chars>
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=sk-...          # Optional
DAILY_API_KEY=...              # Optional (video)
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```
