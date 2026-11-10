# VEDH Business Studio

> **Artisanal Heritage Operations Hub**  
> Luxury Handicrafts, Bespoke Diwali Candles, Resin Art, Festive Return Gifts & Designer Pieces.

---

## Overview

**VEDH Business Studio** is the dedicated internal management platform for the VEDH venture. It unifies:

- **Order & Milestone Pipeline**: Track custom craft orders from inquiry to advance payment, production, quality check, and dispatch.
- **Two-Tier Inventory Tracking**: Real-time monitoring of finished goods and workshop supplies (soy wax, fragrance oils, crystal resin, rigid gold-foil boxes).
- **Branded Invoicing Engine**: Print-ready tax invoices featuring the official embossed gold VEDH logo, with instant one-click WhatsApp sharing to customers.
- **Financial & Expense Studio**: Record raw material procurement, shipping costs, and verify cash-in across UPI / Netbanking / Cash.
- **Suppliers & CRM Directory**: Manage relationships with specialized raw material suppliers and high-value corporate/wedding clients.

---

## Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom VEDH Royal Burgundy (`#5B1524`) & Champagne Gold (`#D4AF37`) palette
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Storage**: [Supabase (PostgreSQL with RLS)](https://supabase.com/)
- **Deployment**: [Vercel](https://vercel.com/) with GitHub CI/CD

---

## Getting Started

### 1. Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Connect Supabase Database

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard and execute the script in `supabase_schema.sql`.
3. Create a `.env.local` file in the root folder with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart `npm run dev`. Your app is now connected to cloud PostgreSQL!

### 3. Deploy to Vercel

1. Push this repository to a **Private GitHub Repository**.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your GitHub repository.
4. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
5. Click **Deploy**. Your studio will be live with a secure HTTPS URL.
