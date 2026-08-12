# Protein Tracker

A modern web application for 3 users (Shibin, Niveditha, Nithin) sharing a single 73-scoop protein powder container.

## 🚀 Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend & Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Deployment**: Vercel

## 👥 Users & Credentials

- **Shibin** (password: `auth`)
- **Niveditha** (password: `auth`)
- **Nithin** (password: `auth`)

## 📦 Container Capacity

- **73 Total Scoops** (~24 scoops per person)

## 🏃 Local Development

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## 🌐 Deploying to Vercel

1. Push this project to GitHub.
2. Import the `frontend` folder into Vercel.
3. Add Environment Variables:
   - `VITE_SUPABASE_URL` = `https://unxmqtyfetbolhgujpma.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_nSYm0FRq4v3QlKkiJH54TA_6Bdr_Y5e`
4. Deploy!
