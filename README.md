# FinSight — AI-Powered Personal Finance Intelligence

FinSight is a full-stack MERN personal finance management application with integrated Generative AI. It helps users track income and expenses, manage budgets, visualize spending habits, and get personalized financial insights and chat-based advice powered by Google Gemini.

---

## Features

| Feature | Status |
|---|---|
| User Authentication (JWT) | ✅ |
| Transaction Management (CRUD) | ✅ |
| Budget Management (CRUD) | ✅ |
| Budget vs. Transaction Spending | ✅ |
| Over-budget detection | ✅ |
| Analytics with Recharts | ✅ |
| AI Financial Insights | ✅ |
| AI Chat Assistant | ✅ |
| CSV Transaction Import | ✅ |
| User Profile | ✅ |

---

## Tech Stack

### Frontend
- **React** (Vite)
- **React Router v6**
- **Recharts** (analytics charts)
- Vanilla CSS

### Backend
- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** authentication
- **bcryptjs** password hashing

### AI Layer
- **Google Gemini** (primary)
- **OpenRouter** (fallback)
- Rule-based deterministic fallback

---

## Architecture

```
React (Vite)
    │
    │  HTTP + JWT Bearer token
    ▼
Express REST API
    ├── /api/users       (auth)
    ├── /api/transactions (CRUD, user-scoped)
    ├── /api/budgets     (CRUD, user-scoped)
    └── /api/ai          (insights + chat, user-scoped)
         │
         ▼
    MongoDB Atlas
         │
         ▼
    AI Service
      ├── Gemini (primary)
      ├── OpenRouter (fallback)
      └── Rule-based (deterministic fallback)
```

---

## AI Security Model

1. All AI endpoints require a valid JWT (`Authorization: Bearer <token>`).
2. The user identity comes **only** from the verified JWT — never from the request body.
3. Only that user's transactions and budgets are fetched from MongoDB.
4. Only **pre-calculated financial aggregates** are sent to Gemini (totals, category sums, monthly summaries). No raw documents, passwords, tokens, or connection strings are ever sent.
5. API keys live **only in `server/.env`** and are never exposed to the React frontend.
6. Errors shown to the client are sanitized — no stack traces or internal credentials.

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- (Optional) OpenRouter API key for fallback

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/finsight.git
cd finsight
```

---

### 2. Configure Backend Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_strong_random_jwt_secret
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> **Never commit `.env` to version control.** It is already excluded in `.gitignore`.

---

### 3. Install & Run Backend

```bash
cd server
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

---

### 4. Install & Run Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

### 5. Production Build

```bash
cd client
npm run build
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users` | Public | Register |
| POST | `/api/users/login` | Public | Login |
| GET | `/api/transactions` | JWT | Get all transactions |
| POST | `/api/transactions` | JWT | Create transaction |
| PUT | `/api/transactions/:id` | JWT | Update transaction |
| DELETE | `/api/transactions/:id` | JWT | Delete transaction |
| GET | `/api/budgets` | JWT | Get all budgets |
| POST | `/api/budgets` | JWT | Create budget |
| PUT | `/api/budgets/:id` | JWT | Update budget |
| DELETE | `/api/budgets/:id` | JWT | Delete budget |
| POST | `/api/ai/insights` | JWT | AI financial insights |
| POST | `/api/ai/chat` | JWT | AI chat assistant |
| GET | `/api/health` | Public | Health check |

---

## CSV Import Format

To import transactions via `/import-transactions`, your CSV must have these headers (comma-separated):

```
Date,Type,Amount,Category,Description
2026-10-01,expense,5000,Food,Groceries
2026-10-02,income,50000,Salary,October salary
```

- **Type** must be `income` or `expense`
- **Amount** must be a positive number
- **Date** must be a valid date string
- **Category** is required

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default 5000) | Backend server port |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `OPENROUTER_API_KEY` | No | Fallback AI provider |

---

## Known Limitations

- Profile editing is not yet supported (read-only).
- AI chat history is session-only and is not persisted in the database.
- CSV import does not support quoted fields containing commas.
- The app uses `http://localhost:5000` hardcoded in the frontend — a `.env.local` with `VITE_API_URL` would be needed for a production deployment.

---

## License

MIT
