# Fixing OAuth Redirect URI Mismatch and CORS Issues

## Problem

You're getting:
- `Error 400: redirect_uri_mismatch` from Google OAuth
- UI can't call API (CORS blocking)

## Root Causes

1. **Redirect URI Mismatch**: The redirect URI in Google Cloud Console doesn't match what the API is generating
2. **CORS Blocking**: The API's `FRONTEND_URL` doesn't match your actual frontend domain

## Solution

### Step 1: Verify API Environment Variables

In **Vercel Dashboard > API Project (amyz-api) > Settings > Environment Variables**, make sure:

```env
FRONTEND_URL=https://amyzz.vercel.app
```

**Critical**: 
- Must include `https://` protocol
- Must NOT have trailing slash
- Must match your frontend domain exactly: `amyzz.vercel.app`

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   ```
   https://amyzz.vercel.app
   ```
5. Under **Authorized redirect URIs**, add:
   ```
   https://amyzz.vercel.app/auth/callback
   ```
6. **Save** the changes

**Important**: The redirect URI must be EXACTLY:
- `https://amyzz.vercel.app/auth/callback`
- Not `http://` (must be `https://`)
- Not `amyzz.vercel.app/auth/callback/` (no trailing slash)
- Not `https://amyz-api.vercel.app/auth/callback` (wrong domain)

### Step 3: Verify the Flow

The OAuth flow works like this:

1. **User clicks "Sign in"** → Frontend calls `GET /api/auth/google/url`
2. **API generates Google OAuth URL** with redirect URI: `https://amyzz.vercel.app/auth/callback`
3. **User redirected to Google** → Google shows consent screen
4. **Google redirects back** → `https://amyzz.vercel.app/auth/callback?code=...`
5. **Frontend extracts code** → Calls `POST /api/auth/google/callback` with code
6. **API exchanges code** → Gets user info, sets cookie, returns user data

### Step 4: Test CORS

After updating `FRONTEND_URL`, test if CORS works:

1. Open browser DevTools on `https://amyzz.vercel.app`
2. Go to **Console** tab
3. Try to sign in
4. Check **Network** tab for API calls
5. Look for CORS errors in console

If you see CORS errors, check:
- `FRONTEND_URL` in API matches frontend domain exactly
- No trailing slash in `FRONTEND_URL`
- Protocol is `https://` (not `http://`)

### Step 5: Redeploy API

After updating environment variables:

1. Go to Vercel Dashboard > API Project
2. Go to **Deployments**
3. Click **Redeploy** on the latest deployment
4. Or push a new commit to trigger redeploy

### Step 6: Clear Browser Cache

Sometimes cached redirect URIs cause issues:

1. Clear browser cache
2. Try in incognito/private window
3. Or use a different browser

## Verification Checklist

- [ ] `FRONTEND_URL=https://amyzz.vercel.app` in API Vercel env vars
- [ ] `https://amyzz.vercel.app` in Google Cloud Console **Authorized JavaScript origins**
- [ ] `https://amyzz.vercel.app/auth/callback` in Google Cloud Console **Authorized redirect URIs**
- [ ] API redeployed after env var changes
- [ ] Browser cache cleared
- [ ] Tested in incognito window

## Debugging

### Check What Redirect URI API is Using

The API generates the redirect URI from `FRONTEND_URL`. You can verify by:

1. Calling: `https://amyz-api.vercel.app/api/auth/google/url`
2. The response will contain a Google OAuth URL
3. Extract the `redirect_uri` parameter from that URL
4. It should be: `https://amyzz.vercel.app/auth/callback`

### Check CORS Headers

In browser DevTools > Network tab:
1. Find a request to the API
2. Check **Response Headers**
3. Look for `Access-Control-Allow-Origin`
4. It should be: `https://amyzz.vercel.app`

If it's different or missing, `FRONTEND_URL` is wrong.

## Common Mistakes

❌ **Wrong**: `FRONTEND_URL=amyzz.vercel.app` (missing protocol)
❌ **Wrong**: `FRONTEND_URL=https://amyzz.vercel.app/` (trailing slash)
❌ **Wrong**: `FRONTEND_URL=https://amyz-api.vercel.app` (wrong domain)
✅ **Correct**: `FRONTEND_URL=https://amyzz.vercel.app`

❌ **Wrong**: Redirect URI in Google: `http://amyzz.vercel.app/auth/callback`
❌ **Wrong**: Redirect URI in Google: `https://amyzz.vercel.app/auth/callback/`
✅ **Correct**: Redirect URI in Google: `https://amyzz.vercel.app/auth/callback`

