# Vercel Deployment Checklist

## Pre-Deployment

- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] Cloudinary account set up with API credentials
- [ ] JWT secret generated (32+ characters)
- [ ] Frontend domain/URL determined

## Google OAuth Configuration

- [ ] Added `https://amyz.vercel.app` to **Authorized JavaScript origins**
- [ ] Added `https://amyz.vercel.app/api/auth/google/callback` to **Authorized redirect URIs**
- [ ] (If frontend is separate) Added frontend domain to authorized origins

## Vercel Environment Variables

Add all these in **Vercel Dashboard > Settings > Environment Variables**:

- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=...` (MongoDB Atlas connection string)
- [ ] `JWT_SECRET=...` (32+ character random string)
- [ ] `GOOGLE_CLIENT_ID=...`
- [ ] `GOOGLE_CLIENT_SECRET=...`
- [ ] `CLOUDINARY_CLOUD_NAME=...`
- [ ] `CLOUDINARY_API_KEY=...`
- [ ] `CLOUDINARY_API_SECRET=...`
- [ ] `ALLOWED_ADMIN_EMAILS=...` (comma-separated)
- [ ] `FRONTEND_URL=...` (must include https://)

## Deployment Steps

1. [ ] Push code to GitHub
2. [ ] Go to [vercel.com/new](https://vercel.com/new)
3. [ ] Import repository
4. [ ] Set **Root Directory** to `ecommerce-api`
5. [ ] Set **Framework Preset** to "Other"
6. [ ] Set **Build Command** to `pnpm build` (or `npm run build`)
7. [ ] Set **Install Command** to `pnpm install` (or `npm install`)
8. [ ] Add all environment variables
9. [ ] Click **Deploy**

## Post-Deployment Verification

- [ ] Visit `https://amyz.vercel.app/health` - should return `{"status":"ok"}`
- [ ] Visit `https://amyz.vercel.app/api/config` - should return config JSON
- [ ] Check Vercel logs for any errors
- [ ] Test authentication flow
- [ ] Update frontend `NEXT_PUBLIC_API_URL` to `https://amyz.vercel.app/api`

## Troubleshooting

If deployment fails:
- [ ] Check build logs in Vercel dashboard
- [ ] Verify all environment variables are set
- [ ] Check MongoDB Atlas network access (allow 0.0.0.0/0)
- [ ] Verify Google OAuth redirect URIs match exactly
- [ ] Check CORS settings (FRONTEND_URL must match frontend domain)

