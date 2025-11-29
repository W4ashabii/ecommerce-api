# Debugging API 500 Errors

## Quick Diagnostic Steps

### Step 1: Check Health Endpoint

Visit:
```
https://amyz-api.vercel.app/health
```

This will show:
- Database connection status
- Environment variables status
- Basic configuration

### Step 2: Check Diagnostic Endpoint

Visit:
```
https://amyz-api.vercel.app/diagnostic
```

This provides detailed information about:
- Database connection state
- Configuration values (masked for security)
- Connection test results

### Step 3: Check Vercel Logs

1. Go to **Vercel Dashboard > API Project (amyz-api)**
2. Click **Logs** tab
3. Look for error messages related to:
   - Database connection failures
   - Missing environment variables
   - Authentication errors

## Common Issues and Fixes

### Issue 1: Database Connection Fails

**Symptoms:**
- `/api/settings` returns 500
- `/api/auth/google/callback` returns 500
- Health endpoint shows `database.connected: false`

**Fix:**
1. Check `MONGODB_URI` in Vercel environment variables
2. Verify MongoDB Atlas network access allows connections from anywhere (0.0.0.0/0)
3. Test connection string locally or with MongoDB Compass
4. Check if MongoDB Atlas cluster is running

**Verify:**
```bash
# Test the connection string format
mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

### Issue 2: Missing Environment Variables

**Symptoms:**
- Various endpoints return 500
- Diagnostic endpoint shows `hasMongoUri: false` or similar

**Fix:**
1. Go to **Vercel Dashboard > Settings > Environment Variables**
2. Verify all required variables are set:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `ALLOWED_ADMIN_EMAILS`
   - `FRONTEND_URL`
   - `NODE_ENV=production`

3. **Redeploy** after adding/updating variables

### Issue 3: Google OAuth Client Mismatch

**Symptoms:**
- `/api/auth/google/callback` returns 500
- Error logs show "Failed to exchange authorization code"

**Fix:**
1. Verify `GOOGLE_CLIENT_ID` in Vercel matches the client in Google Cloud Console
2. Verify `GOOGLE_CLIENT_SECRET` matches that client's secret
3. Ensure redirect URI `https://amyzz.vercel.app/auth/callback` is in Google Console
4. Redeploy API after updating credentials

### Issue 4: CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- Preflight requests fail

**Fix:**
1. Verify `FRONTEND_URL=https://amyzz.vercel.app` in Vercel
2. Must include `https://` protocol
3. No trailing slash
4. Redeploy after updating

## Testing Endpoints

### Working Endpoints (Should return 200):
- `GET /health` - Basic health check
- `GET /diagnostic` - Detailed diagnostics
- `GET /api/config` - App configuration

### Endpoints That Require Database:
- `GET /api/settings` - Requires MongoDB connection
- `POST /api/auth/google/callback` - Requires MongoDB + Google OAuth
- `GET /api/me` - Requires authentication

## Step-by-Step Debugging

1. **Check Health:**
   ```
   https://amyz-api.vercel.app/health
   ```
   - If this fails, there's a fundamental issue with the API

2. **Check Diagnostics:**
   ```
   https://amyz-api.vercel.app/diagnostic
   ```
   - Review database connection state
   - Check environment variables

3. **Check Vercel Logs:**
   - Look for specific error messages
   - Note the timestamp of errors
   - Check for database connection errors

4. **Test Database Connection:**
   - Use MongoDB Compass with the same connection string
   - Verify network access in MongoDB Atlas

5. **Verify Environment Variables:**
   - Double-check all variables in Vercel
   - Ensure no typos
   - Verify values are correct

6. **Redeploy:**
   - After fixing issues, redeploy the API
   - Wait for deployment to complete
   - Test again

## Getting Help

When reporting issues, include:
1. Response from `/health` endpoint
2. Response from `/diagnostic` endpoint
3. Relevant error logs from Vercel
4. Which endpoints are failing
5. Environment variable names (not values) that are set

