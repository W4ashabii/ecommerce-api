# Vercel Deployment Guide for ecommerce-api

This guide will help you deploy the ecommerce-api to Vercel at `amyz.vercel.app`.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional, for CLI deployment):
   ```bash
   npm i -g vercel
   ```

## Step 1: Prepare Your Environment Variables

You'll need to set these environment variables in Vercel. Here's what each one does:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Generate a random string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-secret-key` |
| `ALLOWED_ADMIN_EMAILS` | Comma-separated admin emails | `email1@gmail.com,email2@gmail.com` |
| `FRONTEND_URL` | Your frontend domain | `https://your-frontend.vercel.app` |

## Step 2: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://amyz.vercel.app
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://amyz.vercel.app/api/auth/google/callback
   ```
   (Note: The actual callback URL depends on your frontend, but the API endpoint should be accessible)

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Select the `ecommerce-api` folder as the root directory

3. **Configure Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `ecommerce-api`
   - **Build Command**: `pnpm build` (or `npm run build`)
   - **Output Directory**: Leave empty (not needed for serverless)
   - **Install Command**: `pnpm install` (or `npm install`)

4. **Add Environment Variables**:
   - Go to **Settings > Environment Variables**
   - Add all variables from Step 1
   - Make sure to select **Production**, **Preview**, and **Development** environments

5. **Deploy**:
   - Click **Deploy**
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to API directory**:
   ```bash
   cd ecommerce-api
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (first time) or **Yes** (subsequent)
   - Project name: `ecommerce-api` or `amyz`
   - Directory: `./`
   - Override settings? **No**

5. **Add Environment Variables**:
   ```bash
   vercel env add NODE_ENV
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   # ... repeat for all variables
   ```
   
   Or add them via the dashboard at [vercel.com/dashboard](https://vercel.com/dashboard)

6. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 4: Verify Deployment

1. **Check Health Endpoint**:
   ```
   https://amyz.vercel.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check API Endpoint**:
   ```
   https://amyz.vercel.app/api/config
   ```
   Should return your app configuration

3. **Check Vercel Logs**:
   - Go to your project dashboard
   - Click on **Deployments**
   - Click on the latest deployment
   - Check **Functions** tab for any errors

## Step 5: Update Frontend Configuration

Update your frontend's `.env.local` or environment variables:

```env
NEXT_PUBLIC_API_URL=https://amyz.vercel.app/api
```

## Troubleshooting

### Database Connection Issues

- **Error**: "MongoDB connection failed"
  - **Solution**: Check your `MONGODB_URI` is correct
  - Make sure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Vercel IPs

### CORS Issues

- **Error**: "CORS policy blocked"
  - **Solution**: Make sure `FRONTEND_URL` matches your frontend domain exactly (including `https://`)

### Google OAuth Issues

- **Error**: "redirect_uri_mismatch"
  - **Solution**: Double-check the redirect URI in Google Cloud Console matches exactly

### Build Failures

- **Error**: "Module not found" or TypeScript errors
  - **Solution**: Make sure `package.json` has all dependencies
  - Check that `tsconfig.json` is correct
  - Verify build command is `pnpm build` or `npm run build`

### Cold Start Issues

- **Issue**: First request is slow
  - **Solution**: This is normal for serverless functions. Vercel keeps functions warm for active projects.

## Custom Domain (Optional)

To use a custom domain instead of `amyz.vercel.app`:

1. Go to **Settings > Domains** in Vercel dashboard
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `FRONTEND_URL` environment variable to match

## Monitoring

- **Vercel Dashboard**: View deployments, logs, and analytics
- **Vercel CLI**: `vercel logs` to view real-time logs
- **Health Endpoint**: Monitor `/health` endpoint for uptime

## Notes

- Vercel automatically handles HTTPS
- Serverless functions have a 10-second timeout for Hobby plan, 60 seconds for Pro
- File uploads are limited by Vercel's limits (4.5MB for Hobby, 4.5MB for Pro)
- Database connections are pooled and reused across function invocations

