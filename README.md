# Sticker Ecommerce Platform

A full-featured Next.js 14+ ecommerce platform for selling custom stickers with a beautiful MAFTS design system.

## 🎨 Design System

Built with the **MAFTS (Making Awesome Fun Things Happen)** design tokens:
- **Fonts**: Bangers (display) + Outfit (body)
- **Colors**: Coral (#FF6B6B), Teal (#4ECDC4), Yellow (#FFE66D), Dark (#2C3E50)
- **Effects**: Glass morphism, offset shadows, staggered animations
- **Responsive**: Mobile-first with Tailwind CSS

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14+ App Router + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth.js (Credentials/Email) |
| **State** | TanStack Query v5 (server) + Zustand (client) |
| **Real-time** | Socket.io (custom server) |
| **Payments** | Cash on Delivery / Bank Transfer |
| **Images** | Uploadthing + Cloudinary |
| **Styling** | Tailwind CSS + CSS Variables |
| **Animations** | Framer Motion + CSS |
| **Forms** | React Hook Form + Zod |
| **UI Primitives** | Radix UI |

## 🚀 Features

### Customer-Facing
- **Shop**: Browse products with filtering, sorting, pagination
- **Product Detail**: Configurable dimensions, quantity tiers, customization options
- **Custom Sticker Builder**: 
  - Drag-drop image upload
  - Real-time canvas preview (Fabric.js)
  - Editing tools: crop, rotate, filters, text, shapes
  - Dimension controls with aspect ratio lock
  - Material/Finish/Cut type selection
  - Layer management
  - Export preview (PNG/JPG/PDF/SVG)
- **Cart & Checkout**: Slide-out drawer, address management, COD/Bank transfer
- **Orders**: History, tracking, reorder, reviews
- **Profile**: Addresses, password change

### Admin Panel
- **Dashboard**: Real-time stats, charts, recent activity
- **Product Management**: Full CRUD with dimension configs, quantity tiers, per-product tax
- **Order Management**: Status workflow (PENDING→DELIVERED), bulk actions, tracking
- **Custom Requests**: Review, approve/reject, price, convert to orders
- **Settings**: Tax, delivery zones, email templates, appearance
- **Real-time Notifications**: Sidebar badge counts, toast notifications via Socket.io

## 📁 Project Structure

```
sticker-ecommerce/
├── .github/workflows/          # CI/CD pipelines
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed data
├── public/                     # Static assets
├── socket-server/              # Socket.io server
│   ├── index.ts                # Main server
│   └── tsconfig.json
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (customer)/         # Customer route group
│   │   │   ├── layout.tsx
│   │   │   ├── shop/page.tsx
│   │   │   ├── custom-sticker/page.tsx
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── (admin)/            # Admin route group
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── custom-requests/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/                # API routes
│   │   ├── globals.css         # Global styles + design tokens
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # 15 base primitives
│   │   ├── layout/             # Navbar, Footer, AdminSidebar, NotificationBell, MobileNav
│   │   ├── animations/         # StaggeredText, FloatingShapes, Counter, HoverLift, GlassMorphism
│   │   ├── product/            # ProductCard, ProductDetail, Configurator, Reviews
│   │   ├── custom-sticker/     # StickerCanvas, UploadZone, EditingTools, PreviewPanel, LayerPanel
│   │   ├── cart/               # CartDrawer, CartItem, CartSummary, PromoCode
│   │   ├── checkout/           # AddressForm, OrderSummary, PaymentMethod, OrderConfirmation
│   │   └── admin/              # ProductForm, OrderStatusBadge, SettingsForm, TaxConfig, DeliveryConfig
│   ├── lib/
│   │   ├── auth.ts, socket.ts, prisma.ts, cloudinary.ts, uploadthing.ts
│   │   ├── validations/        # Zod schemas for all entities
│   │   ├── hooks/              # useAuth, useCart, useStickerBuilder, useDebounce
│   │   ├── stores/             # Zustand stores (cart, ui, notifications, auth)
│   │   ├── queries/            # TanStack Query hooks
│   │   ├── mutations/          # TanStack Mutation hooks
│   │   └── actions/            # Server actions (createOrder, updateProduct, etc.)
│   ├── types/                  # Complete TypeScript definitions
│   └── constants/design-tokens.ts
├── tailwind.config.ts          # Tailwind + design tokens
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md
```

## 🏁 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Cloudinary account
- Uploadthing account

### Installation

```bash
# Clone repository
git clone <repo-url>
cd sticker-ecommerce

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Set up database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start development servers
# Terminal 1 - Next.js app
pnpm dev

# Terminal 2 - Socket.io server
pnpm socket:dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sticker_ecommerce"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Uploadthing
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Socket.io
SOCKET_SERVER_URL="http://localhost:3001"
SOCKET_SERVER_PORT=3001

# Email (choose one)
SENDGRID_API_KEY="SG...."
# OR
RESEND_API_KEY="re_..."
# OR
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."
```

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Next.js dev server
pnpm socket:dev       # Socket.io dev server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:migrate:prod  # Production migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Testing
pnpm test             # Run tests
pnpm test:ui          # Vitest UI
pnpm test:coverage    # Coverage report
pnpm e2e              # Playwright E2E tests

# Code Quality
pnpm lint             # ESLint
pnpm lint:fix         # Auto-fix linting
pnpm format           # Prettier
pnpm format:check     # Check formatting
pnpm type-check       # TypeScript check

# Build
pnpm build            # Production build
pnpm start            # Start production server
```

## 🚀 Deployment

### Vercel (Next.js)
1. Connect repository to Vercel
2. Add environment variables
3. Deploy

### Socket.io Server
Deploy to Railway, Render, or Fly.io:
```bash
pnpm socket:build
pnpm socket:start
```

### Database
- Neon, Supabase, or Railway for PostgreSQL
- Run `pnpm db:migrate:prod` after deployment

## 📦 Key Packages

### Production
- `next@14.2`, `react@18.3`, `typescript@5.4`
- `@prisma/client@5.12`, `next-auth@5.0`
- `@tanstack/react-query@5.28`, `zustand@4.5`
- `socket.io@4.7`, `socket.io-client@4.7`
- `uploadthing@6.7`, `cloudinary@2.2`
- `fabric@5.3`, `framer-motion@11.1`
- `react-hook-form@7.51`, `zod@3.22`
- `@radix-ui/react-*`, `sonner@1.4`
- `recharts@2.12`, `date-fns@3.6`

### Development
- `vitest@1.5`, `@testing-library/react@14.2`
- `playwright@1.43`, `eslint@8.57`, `prettier@3.2`

## 🎯 Roadmap

- [ ] Multi-vendor support
- [ ] Bengali language (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Subscription/recurring orders
- [ ] Loyalty program
- [ ] WhatsApp integration

## 📄 License

MIT License - feel free to use for your own projects!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

For questions or issues, please open a GitHub issue or contact support@stickershop.com