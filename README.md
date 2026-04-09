# 🍽️ CaterConnect India

> **The smart catering discovery platform for India.**
> Pick your menu. Find your caterer. Get a price — instantly.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-vaibhavselkar--mymenu.vercel.app-F97316?style=for-the-badge&logo=vercel)](https://vaibhavselkar-mymenu.vercel.app)
[![Built with React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-FF4500?style=for-the-badge)](https://groq.com)

---

## 📌 The Problem

India has **10 million weddings per year** — every one needs catering. Yet there's no platform where a customer can:

- Select the exact dishes they want
- Instantly see which caterers can serve that menu
- Compare prices across caterers in real time
- Book or enquire in one click

Everything today happens over WhatsApp and phone calls. CaterConnect fixes that.

---

## ✨ Features

### For Customers
| Feature | Description |
|---|---|
| 🍛 **Menu Builder** | Browse dishes across all caterers, click to select what you want |
| ⚡ **Real-time Matching** | Instantly see which caterers can serve your chosen menu, ranked by match |
| 💰 **Price Calculator** | Live total = dishes × plates, updated as you select |
| 🤖 **AI Chatbot** | Conversational assistant — tell it your event, guests & city; it designs a full menu and finds caterers using Groq LLaMA 3.3 |
| 🔄 **Alternative Suggestions** | If a caterer doesn't have an item, see who does |
| 📅 **Availability Aware** | Blocked dates are disabled in the booking form |
| 🛒 **Place Order / Enquiry** | Two-button flow — ready to book vs want to discuss first |

### For Caterers
| Feature | Description |
|---|---|
| 🏪 **Business Dashboard** | Full management hub with dishes, enquiries, profile, availability |
| 🍽️ **Menu Management** | Add / edit / delete dishes with images, category, veg/non-veg, price |
| 📋 **Enquiry Management** | View customer requests with 🛒 Order / 💬 Enquiry type badges, confirm or reject |
| 📆 **Availability Calendar** | Click dates to mark as blocked — customers can't book those days |
| 👤 **Profile Editor** | Update business name, location, description, contact |

---

## 🎬 Demo

> **Live:** [vaibhavselkar-mymenu.vercel.app](https://vaibhavselkar-mymenu.vercel.app)

### Customer Flow
```
Homepage → Select dishes → Set plates → Filter by city
    → Matching caterers appear ranked by best match
    → Click caterer → Full menu with pre-selected dishes
    → Pick date (blocked dates disabled) → Place Order or Enquiry
```

### AI Chatbot Flow
```
Open chat → Choose event type (Wedding / Corporate / Birthday...)
    → Veg preference → Number of guests → City
    → Groq AI builds ideal menu from real DB dishes
    → Shows matched caterers with price estimate
    → Click "View Menu →" → Full caterer page with menu pre-filled
```

---

## 🛠️ Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.3.1 | Build tool |
| React Router | 6.23.1 | Client-side routing |
| Tailwind CSS | 3.4.4 | Styling with custom Indian color palette |
| Axios | 1.7.2 | HTTP client with JWT interceptor |
| Lucide React | 0.395.0 | Icons |
| React Hot Toast | 2.4.1 | Notifications |

### Backend
| Tool | Version | Purpose |
|---|---|---|
| Node.js + Express | 4.19.2 | REST API server |
| MongoDB + Mongoose | 8.4.0 | Database + ODM with indexes |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |
| Multer | 1.4.5 | Image uploads |
| Axios | 1.14.0 | Groq API calls |

### AI & Infrastructure
| Tool | Purpose |
|---|---|
| Groq LLaMA 3.3-70B | Menu suggestion AI — uses live DB dish catalog as context |
| MongoDB Atlas | Cloud database with compound indexes for fast queries |
| Vercel | Serverless deployment (frontend + backend) |

---

## 🗂️ Project Structure

```
catering/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBot.jsx        # AI chatbot with Groq integration
│   │   │   ├── EnquiryPanel.jsx   # Order/enquiry form with blocked dates
│   │   │   ├── DishCard.jsx
│   │   │   ├── DishModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # Menu builder + caterer matching
│   │   │   ├── CatererDetailPage.jsx
│   │   │   ├── DashboardPage.jsx  # Caterer dashboard with calendar
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── context/AuthContext.jsx
│   │   └── utils/api.js
│   ├── public/favicon.svg
│   └── index.html
│
└── backend/
    ├── models/
    │   ├── Caterer.js     # blockedDates field, city/name indexes
    │   ├── Dish.js        # compound indexes for fast queries
    │   └── Enquiry.js     # type: order | enquiry
    ├── routes/
    │   ├── auth.js        # register, login, profile, blocked-dates
    │   ├── caterers.js
    │   ├── dishes.js      # with Cache-Control headers
    │   ├── enquiries.js
    │   └── chat.js        # Groq AI menu suggestion endpoint
    ├── middleware/auth.js
    └── server.js          # global MongoDB connection cache for Vercel
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Groq API key — [console.groq.com](https://console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/vaibhavselkar/my_menu.git
cd caterconnect
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_key
GROQ_API=your_groq_api_key
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deployment (Vercel)

### Backend (`my-menu-vyei.vercel.app`)
Set these environment variables in Vercel → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Your JWT secret |
| `GROQ_API` | Groq API key |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |

### Frontend (`vaibhavselkar-mymenu.vercel.app`)
No extra env vars needed — the frontend proxies `/api` to the backend URL configured in `api.js`.

---

## 📊 Market Opportunity

| Segment | Size |
|---|---|
| India wedding industry | ~₹4,00,000 Crore/year |
| Weddings per year | ~10 Million |
| Catering share of wedding spend | ~₹1,00,000–1,25,000 Crore |
| Corporate catering | ~₹35,000–40,000 Crore |
| **Total Addressable Market** | **~₹1,60,000 Crore/year** |
| Caterers with zero digital presence | **80%** |

### Traffic Potential
| Phase | Timeline | Monthly Visits |
|---|---|---|
| Launch | 0–6 months | 1K–5K |
| SEO traction | 6–12 months | 20K–50K |
| City expansion | 1–2 years | 200K–500K |
| Platform deal | 2–3 years | 2M+ |

---

## 🏢 Enterprise Use Cases

- **Swiggy / Zomato** — Neither has a catering vertical. CaterConnect's matching engine is the missing product layer for their existing 120M+ user base.
- **WedMeGood / ShaadiSaga** — List vendors but have no interactive menu builder. CaterConnect's dish-selection + price calculator is a direct upgrade.
- **Zomato for Business** — Corporate bulk meals. CaterConnect's filters map directly to corporate procurement.
- **ONDC** — India's open commerce network is actively building catering verticals. CaterConnect's architecture plugs in as a catering node.

---

## 🔮 Roadmap

### Phase 1 — Now
- [x] Menu builder with real-time caterer matching
- [x] AI chatbot (Groq LLaMA 3.3)
- [x] Caterer dashboard with availability calendar
- [x] Order vs Enquiry flow
- [ ] Email / WhatsApp notifications

### Phase 2 — Monetization
- [ ] Caterer subscription tiers (free + paid priority listing)
- [ ] 2–5% commission on confirmed orders
- [ ] Featured caterer placements

### Phase 3 — Expand
- [ ] React Native mobile app
- [ ] Decorator, DJ, Tent House — full event vendor marketplace
- [ ] Digital contracts and invoicing
- [ ] Multi-language (Hindi, Marathi, Tamil)

### Phase 4 — Enterprise
- [ ] Corporate meal planning dashboard
- [ ] ONDC integration
- [ ] API access for wedding platforms

---

## 👨‍💻 Author

**Vaibhav Selkar**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/vaibhav-selkar/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/vaibhavselkar)

> Open to collaborations, client projects, and opportunities.
> If you're a caterer who wants to get onboarded — reach out!

---

## 📄 License

MIT License — feel free to fork, learn from, and build on top of this.

---

<div align="center">
  <strong>Built with ❤️ for India's catering industry</strong><br/>
  <sub>CaterConnect India — Connecting menus to moments</sub>
</div>
