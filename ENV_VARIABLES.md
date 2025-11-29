# Environment Variables for Vercel Deployment

Copy these variables to **Vercel Dashboard > Settings > Environment Variables**

## Required Variables

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

FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## Quick Setup Steps

1. **MongoDB**: Get connection string from MongoDB Atlas
2. **JWT_SECRET**: Generate a random 32+ character string
3. **Google OAuth**: Get from Google Cloud Console
4. **Cloudinary**: Get from Cloudinary Dashboard
5. **ALLOWED_ADMIN_EMAILS**: Comma-separated list of admin emails
6. **FRONTEND_URL**: Your frontend Vercel domain (e.g., `https://your-frontend.vercel.app`)

## Important Notes

- **FRONTEND_URL** must include `https://` protocol
- **MONGODB_URI** should be your MongoDB Atlas connection string
- Make sure to add `https://amyz.vercel.app/api/auth/google/callback` to Google OAuth redirect URIs
- All variables should be added for **Production**, **Preview**, and **Development** environments in Vercel

