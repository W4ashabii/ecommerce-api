# Troubleshooting Vercel Deployment Issues

## Common Error: FUNCTION_INVOCATION_FAILED (500)

### 1. Check Vercel Logs

Go to your Vercel dashboard:
- **Deployments** > Select latest deployment > **Functions** tab
- Look for error messages in the logs
- Check for stack traces

### 2. Verify Environment Variables

Make sure ALL these are set in **Vercel Dashboard > Settings > Environment Variables**:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_ADMIN_EMAILS=...
FRONTEND_URL=https://...
```

**Common Issues:**
- Missing `MONGODB_URI` → Database connection fails
- Missing `JWT_SECRET` → Auth fails
- Missing `FRONTEND_URL` → CORS errors
- Wrong `MONGODB_URI` format → Connection fails

### 3. Test Database Connection

Your MongoDB Atlas connection string should:
- Start with `mongodb+srv://` or `mongodb://`
- Include username and password
- Include cluster URL
- Include database name
- Have network access enabled (0.0.0.0/0 or Vercel IPs)

Test locally:
```bash
# In your local .env, use the same MONGODB_URI
# Then test connection
cd ecommerce-api
pnpm dev
```

### 4. Check Import Paths

The `api/index.ts` uses relative imports like `../src/config/index.js`. 

If you see "Cannot find module" errors:
- Make sure the `src` folder is included in deployment
- Check that `tsconfig.json` is correct
- Verify build completes successfully

### 5. Database Connection Issues

**Symptoms:**
- Timeout errors
- "MongoServerError: bad auth"
- "MongoNetworkError"

**Solutions:**
- Verify MongoDB Atlas username/password
- Check network access settings
- Ensure connection string is correct
- Try connecting from MongoDB Compass with same credentials

### 6. Module Initialization Errors

**Symptoms:**
- Error happens before handler runs
- Import errors
- "Cannot find module" errors

**Solutions:**
- Check that all dependencies are in `package.json`
- Verify `pnpm install` works locally
- Check for TypeScript compilation errors: `pnpm build`

### 7. CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- Frontend can't connect to API

**Solutions:**
- Verify `FRONTEND_URL` matches your frontend domain exactly
- Include `https://` protocol
- No trailing slash

### 8. Quick Debug Steps

1. **Test health endpoint:**
   ```
   https://amyz.vercel.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test config endpoint:**
   ```
   https://amyz.vercel.app/api/config
   ```
   Should return your app config

3. **Check function logs:**
   - Vercel Dashboard > Deployments > Latest > Functions
   - Look for error messages

4. **Test locally with production env:**
   ```bash
   # Copy your Vercel env vars to local .env
   # Then test
   cd ecommerce-api
   pnpm build
   pnpm start
   ```

### 9. Common Error Messages

**"Failed to connect to database"**
- Check `MONGODB_URI` is set correctly
- Verify MongoDB Atlas network access
- Check username/password

**"Missing required config"**
- Check all environment variables are set
- Verify no typos in variable names

**"Cannot find module '../src/...'"**
- Check file structure
- Verify TypeScript compilation
- Check `tsconfig.json` paths

**"CORS policy blocked"**
- Verify `FRONTEND_URL` matches frontend domain
- Check CORS configuration in `api/index.ts`

### 10. Getting More Debug Info

Add temporary logging to `api/index.ts`:

```typescript
export default async (req: express.Request, res: express.Response) => {
  console.log('Request received:', req.method, req.url);
  console.log('Environment check:', {
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL
  });
  
  try {
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    console.error('Error details:', error);
    // ... rest of error handling
  }
};
```

Then check Vercel logs for these messages.

### 11. Still Not Working?

1. **Check Vercel Build Logs:**
   - Go to Deployments > Latest > Build Logs
   - Look for build errors or warnings

2. **Test Minimal Version:**
   Create a simple test endpoint to verify basic functionality:
   ```typescript
   app.get('/test', (req, res) => {
     res.json({ 
       message: 'API is working',
       env: process.env.NODE_ENV,
       hasMongo: !!process.env.MONGODB_URI
     });
   });
   ```

3. **Contact Support:**
   - Include full error logs from Vercel
   - Include your `vercel.json`
   - Include environment variable names (not values)

