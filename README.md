# FinSight — AI-Powered Personal Finance Intelligence

FinSight is a full-stack MERN personal finance management application with integrated Generative AI. It helps users track income, expenses, received and paid transactions, manage budgets, visualize spending habits, and get personalized financial insights and chat-based advice powered by Google Gemini.

It also supports **AI-powered bank statement image extraction**, allowing users to upload a transaction statement image, extract structured transactions using vision AI, review and edit the extracted data, validate it, and import it into their account.

---

## Features

| Feature                                   | Status |
| ----------------------------------------- | ------ |
| User Authentication (JWT)                 | ✅      |
| User Registration & Login                 | ✅      |
| Forgot Password / Reset Password          | ✅      |
| Transaction Management (CRUD)             | ✅      |
| Income Transactions                       | ✅      |
| Expense Transactions                      | ✅      |
| Received Transactions                     | ✅      |
| Paid Transactions                         | ✅      |
| Party/Person Tracking for Received & Paid | ✅      |
| Budget Management (CRUD)                  | ✅      |
| Budget vs. Transaction Spending           | ✅      |
| Over-budget Detection                     | ✅      |
| Analytics with Recharts                   | ✅      |
| AI Financial Insights                     | ✅      |
| AI Chat Assistant                         | ✅      |
| CSV Transaction Import                    | ✅      |
| AI Bank Statement Image Extraction        | ✅      |
| Editable Transaction Preview              | ✅      |
| Transaction Validation Before Import      | ✅      |
| Gemini → OpenRouter AI Fallback           | ✅      |
| User Profile                              | ✅      |

---

## Tech Stack

### Frontend

* **React** (Vite)
* **React Router**
* **Recharts** (analytics charts)
* Vanilla CSS

### Backend

* **Node.js** + **Express**
* **MongoDB** + **Mongoose**
* **JWT** authentication
* **bcryptjs** password hashing
* **Multer** for image uploads
* **Resend** for password-reset emails

### AI Layer

* **Google Gemini** (primary AI provider)
* **Google Gemini Vision** (primary image extraction)
* **OpenRouter** (fallback AI provider)
* **OpenRouter Vision** (fallback image extraction)
* Rule-based deterministic fallback for selected text-based AI functionality

---

## Architecture

```text
React (Vite)
    │
    │ HTTP + JWT Bearer token
    ▼
Express REST API
    ├── /api/users
    │       (authentication + password reset)
    │
    ├── /api/transactions
    │       (CRUD, user-scoped)
    │
    ├── /api/budgets
    │       (CRUD, user-scoped)
    │
    └── /api/ai
            (insights + chat + image extraction)
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
    MongoDB Atlas     AI Service
                         │
                 ┌───────┴────────┐
                 │                │
                 ▼                ▼
              Gemini         OpenRouter
             (primary)        (fallback)
                 │                │
                 └───────┬────────┘
                         ▼
                    AI Responses
```

---

## Transaction Model

FinSight supports four transaction types:

* **Income** — money earned by the user.
* **Expense** — money spent by the user.
* **Received** — money received from another person or source.
* **Paid** — money paid or transferred to another person.

For `received` and `paid` transactions, users can optionally record the related person or party.

### Balance Calculation

```text
Balance = (Income + Received) - (Expense + Paid)
```

Analytics and dashboard calculations use the same logic to provide a consistent view of money entering and leaving the account.

---

## AI Image Extraction Flow

```text
Bank Statement Image
        │
        ▼
   Gemini Vision
     (Primary)
        │
        │ If unavailable / quota / API error
        ▼
 OpenRouter Vision
     (Fallback)
        │
        ▼
Structured Transactions
        │
        ▼
 Editable Preview
        │
        ▼
   Validation
        │
        ▼
 User Confirmation
        │
        ▼
     MongoDB
```

AI extraction does **not automatically save transactions**. Transactions are stored only after the user reviews, edits, validates, and confirms the import.

---

## Password Reset Flow

```text
User
 │
 ▼
Forgot Password
 │
 ▼
Backend
 │
 ├── Generate secure reset token
 ├── Hash token before storing
 ├── Set 15-minute expiry
 │
 ▼
Resend
 │
 ▼
Password Reset Email
 │
 ▼
Reset Password Page
 │
 ▼
New Password
 │
 ▼
bcrypt Hash
 │
 ▼
MongoDB
```

Security measures include:

* Cryptographically secure reset tokens
* Only hashed reset tokens are stored in MongoDB
* Reset tokens expire after 15 minutes
* Tokens are invalidated after successful password reset
* Generic forgot-password responses help prevent email enumeration
* Passwords are hashed using bcrypt

> **Email delivery note:** Resend's testing environment may restrict delivery to authorized testing recipients. A verified sending domain is required for unrestricted production email delivery.

---

## AI Security Model

1. All protected AI endpoints require a valid JWT (`Authorization: Bearer <token>`).

2. The user identity comes **only** from the verified JWT — never from the request body.

3. Only that authenticated user's transactions and budgets are fetched from MongoDB.

4. For **financial insights and AI chat**, the application sends calculated financial context and aggregates rather than exposing passwords, authentication tokens, database connection strings, or other credentials.

5. For **image transaction extraction**, the user-uploaded bank statement image is sent to the configured vision AI provider for processing because image understanding is required for extraction.

6. API keys live **only in the backend environment** and are never exposed to the React frontend.

7. Extracted transactions are returned as structured data for user review and are **not automatically saved to MongoDB**.

8. Password reset tokens are securely generated, hashed before storage, and expire after 15 minutes.

9. Errors shown to the client are sanitized — no stack traces, API keys, or internal credentials are exposed.

---

## Getting Started

### Prerequisites

* Node.js 18+
* MongoDB Atlas account (or local MongoDB)
* Google Gemini API key
* OpenRouter API key for AI fallback and vision fallback
* Resend API key for password-reset email functionality

---

### 1. Clone the Repository

```bash
git clone https://github.com/sahasweety/Finsight.git

cd Finsight
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

RESEND_API_KEY=your_resend_api_key_here

FRONTEND_URL=http://localhost:5173
```

> **Never commit `.env` to version control.** It is already excluded in `.gitignore`.

---

### 3. Install & Run Backend

```bash
cd server

npm install

npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

### 4. Install & Run Frontend

```bash
cd client

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

### 5. Production Build

```bash
cd client

npm run build
```

---

## Deployment

FinSight can be deployed using:

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas
* **AI Services:** Google Gemini + OpenRouter
* **Password Reset Email:** Resend

For the production frontend, configure:

```env
VITE_API_URL=https://your-backend-url
```

The Resend API key must remain **only on the backend**.

---

## API Endpoints

| Method | Endpoint                           | Auth   | Description                                                |
| ------ | ---------------------------------- | ------ | ---------------------------------------------------------- |
| POST   | `/api/users`                       | Public | Register                                                   |
| POST   | `/api/users/login`                 | Public | Login                                                      |
| POST   | `/api/users/forgot-password`       | Public | Request password reset                                     |
| POST   | `/api/users/reset-password/:token` | Public | Reset password                                             |
| GET    | `/api/transactions`                | JWT    | Get all transactions                                       |
| POST   | `/api/transactions`                | JWT    | Create transaction                                         |
| PUT    | `/api/transactions/:id`            | JWT    | Update transaction                                         |
| DELETE | `/api/transactions/:id`            | JWT    | Delete transaction                                         |
| GET    | `/api/budgets`                     | JWT    | Get all budgets                                            |
| POST   | `/api/budgets`                     | JWT    | Create budget                                              |
| PUT    | `/api/budgets/:id`                 | JWT    | Update budget                                              |
| DELETE | `/api/budgets/:id`                 | JWT    | Delete budget                                              |
| POST   | `/api/ai/insights`                 | JWT    | AI financial insights                                      |
| POST   | `/api/ai/chat`                     | JWT    | AI chat assistant                                          |
| POST   | `/api/ai/extract-transactions`     | JWT    | Extract transactions from an uploaded bank statement image |
| GET    | `/api/health`                      | Public | Health check                                               |

---

## Image Extraction Request

The `/api/ai/extract-transactions` endpoint accepts a `multipart/form-data` request with an image field named:

```text
image
```

The extracted transactions are returned to the frontend for editing and validation before import.

---

## CSV Import Format

To import transactions via `/import-transactions`, the CSV should contain:

```csv
date,type,amount,category,description

2026-10-01,expense,5000,Food,Groceries

2026-10-02,income,50000,Salary,October salary

2026-10-03,received,2500,Transfer,Money received from friend

2026-10-04,paid,1500,Transfer,Money paid to friend
```

### Supported Types

* `income`
* `expense`
* `received`
* `paid`

### CSV Requirements

* **Type** must be one of the supported transaction types.
* **Amount** must be a positive number.
* **Date** must be a valid date string.
* **Category** is required.
* **Description** contains the transaction description.

---

## Environment Variables Reference

| Variable             | Required | Description                                |
| -------------------- | -------- | ------------------------------------------ |
| `PORT`               | No       | Backend server port; defaults to 5000      |
| `MONGO_URI`          | Yes      | MongoDB connection string                  |
| `JWT_SECRET`         | Yes      | Secret for signing JWT tokens              |
| `GEMINI_API_KEY`     | Yes      | Google Gemini API key                      |
| `OPENROUTER_API_KEY` | Yes      | Fallback AI and vision provider            |
| `RESEND_API_KEY`     | Yes      | Resend API key for password-reset emails   |
| `FRONTEND_URL`       | Yes      | Frontend URL used for password-reset links |

### Frontend Environment Variable

```env
VITE_API_URL=https://your-backend-url
```

> Never expose backend API keys such as `RESEND_API_KEY`, `GEMINI_API_KEY`, or `OPENROUTER_API_KEY` through frontend environment variables.

---

## Known Limitations

* Profile editing is currently read-only.
* AI chat history is session-only and is not persisted in the database.
* CSV import does not support quoted fields containing commas.
* Password-reset email delivery to arbitrary recipients requires a verified sending domain when using Resend outside its testing environment.
* AI image extraction depends on the availability and usage limits of the configured AI providers.

---

## License

MIT.
