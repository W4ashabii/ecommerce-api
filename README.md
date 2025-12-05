## Ecommerce API

Express + TypeScript REST API for the storefront. Covers auth, products, orders, categories, settings (theme, featured collection), uploads to Cloudinary, order tracking, and admin order deletion.

### Stack
- Node.js 20+, Express, TypeScript
- MongoDB via Mongoose
- Zod validation
- Cloudinary uploads

### Setup
1) Install deps  
   ```bash
   pnpm install
   ```
2) Copy `env.template` to `.env` and fill values.
3) Start the API  
   ```bash
   pnpm dev
   ```

### Scripts
- `pnpm dev` – start API with tsx watch
- `pnpm build` – type-check and emit `dist`
- `pnpm start` – run compiled build from `dist`
- `pnpm lint` – eslint on `src`

### Features
- JWT auth with HTTP-only cookies for cross-subdomain usage
- Products with variants, product-level images, Cloudinary cleanup on delete
- Orders with Kathmandu-only delivery defaults, status tracking (no shipped), admin delete
- Settings with featured collection content for the homepage
- Direct upload routes for media and Cloudinary integration

