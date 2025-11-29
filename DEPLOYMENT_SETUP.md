# Deployment Setup for amyzz.vercel.app (UI) and amyz-api.vercel.app (API)

## Domain Configuration

- **Frontend (UI)**: `amyzz.vercel.app` → `ecommerce-ui`
- **Backend (API)**: `amyz-api.vercel.app` → `ecommerce-api`

## API Deployment (amyz-api.vercel.app)

### Environment Variables

Set these in **Vercel Dashboard > Settings > Environment Variables** for the API project:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ALLOWED_ADMIN_EMAILS=emikopokharel13@gmail.com,sidftww@gmail.com
FRONTEND_URL=https://amyzz.vercel.app
```

**Important**: `FRONTEND_URL` must be `https://amyzz.vercel.app` (your frontend domain)

### Vercel Project Settings

1. **Root Directory**: `ecommerce-api`
2. **Framework Preset**: Other
3. **Build Command**: `pnpm build`
4. **Install Command**: `pnpm install`
5. **Output Directory**: (leave empty)

### Custom Domain

1. Go to **Settings > Domains** in Vercel
2. Add custom domain: `amyz-api.vercel.app` (or your custom domain)
3. Follow DNS configuration instructions

## UI Deployment (amyzz.vercel.app)

### Environment Variables

Set this in **Vercel Dashboard > Settings > Environment Variables** for the UI project:

```env
NEXT_PUBLIC_API_URL=https://amyz-api.vercel.app/api
```

**Important**: Must point to your API domain (`amyz-api.vercel.app`)

### Vercel Project Settings

1. **Root Directory**: `ecommerce-ui`
2. **Framework Preset**: Next.js (auto-detected)
3. **Build Command**: `pnpm build` (auto-detected)
4. **Install Command**: `pnpm install` (auto-detected)

### Custom Domain

1. Go to **Settings > Domains** in Vercel
2. Add custom domain: `amyzz.vercel.app` (or your custom domain)
3. Follow DNS configuration instructions

## Google OAuth Configuration

Update your Google Cloud Console OAuth settings:

### Authorized JavaScript origins:
```
https://amyzz.vercel.app
```

### Authorized redirect URIs:
```
https://amyzz.vercel.app/auth/callback
```

## Verification Steps

### 1. Test API Health
```
https://amyz-api.vercel.app/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### 2. Test API Config
```
https://amyz-api.vercel.app/api/config
```
Should return your app configuration

### 3. Test Frontend
- Visit `https://amyzz.vercel.app`
- Check browser console for errors
- Verify API calls go to `https://amyz-api.vercel.app/api`

### 4. Test Authentication
- Try signing in with Google
- Should redirect properly

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in API matches frontend domain exactly: `https://amyzz.vercel.app`
- Check that `NEXT_PUBLIC_API_URL` in UI points to: `https://amyz-api.vercel.app/api`

### API Not Responding
- Check Vercel logs for the API project
- Verify all environment variables are set
- Test database connection

### Frontend Can't Connect to API
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check API is accessible: `https://amyz-api.vercel.app/health`
- Check browser console for CORS errors

## Quick Reference

**API Environment Variables:**
- `FRONTEND_URL=https://amyzz.vercel.app`

**UI Environment Variables:**
- `NEXT_PUBLIC_API_URL=https://amyz-api.vercel.app/api`

**Google OAuth:**
- Origin: `https://amyzz.vercel.app`
- Redirect: `https://amyzz.vercel.app/auth/callback`

