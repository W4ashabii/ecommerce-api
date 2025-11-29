# Fixing MongoDB Connection Issues

## Current Status

Your database is stuck in "connecting" state, which means:
- The connection attempt is being made
- But it's timing out or being blocked
- This causes all database-dependent endpoints to fail with 500 errors

## Most Common Cause: MongoDB Atlas Network Access

MongoDB Atlas blocks connections by default. You need to allow Vercel's IP addresses.

### Step 1: Check MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Click **Network Access** in the left sidebar
4. Check your current IP access list

### Step 2: Allow Vercel IPs

You have two options:

#### Option A: Allow All IPs (Easiest, Less Secure)
1. Click **Add IP Address**
2. Click **Allow Access from Anywhere**
3. This adds `0.0.0.0/0` to your whitelist
4. Click **Confirm**

**Note**: This allows connections from anywhere. For production, consider Option B.

#### Option B: Add Vercel IP Ranges (More Secure)
Vercel uses dynamic IPs, but you can:
1. Check Vercel's documentation for current IP ranges
2. Add those ranges to MongoDB Atlas
3. Or use Option A for now and restrict later

### Step 3: Verify Connection String

In **Vercel Dashboard > Settings > Environment Variables**, check `MONGODB_URI`:

**Correct format:**
```
mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

**Common issues:**
- ❌ Missing `mongodb+srv://` prefix
- ❌ Wrong username/password
- ❌ Wrong cluster URL
- ❌ Missing database name
- ❌ Special characters in password not URL-encoded

### Step 4: Test Connection

After updating network access:

1. **Wait 1-2 minutes** for changes to propagate
2. **Redeploy your API** in Vercel
3. **Check health endpoint:**
   ```
   https://amyz-api.vercel.app/health
   ```
   Should show `database.connected: true`

4. **Check diagnostic endpoint:**
   ```
   https://amyz-api.vercel.app/diagnostic
   ```
   Should show connection details

### Step 5: Check Vercel Logs

If still not working:

1. Go to **Vercel Dashboard > API Project > Logs**
2. Look for database connection errors
3. Common errors:
   - `MongoServerError: bad auth` - Wrong username/password
   - `MongoNetworkError` - Network access blocked
   - `MongoTimeoutError` - Connection timeout

## Connection Timeout Settings

I've added connection timeouts to prevent indefinite hanging:
- **Server selection timeout**: 5 seconds
- **Socket timeout**: 45 seconds
- **Connection timeout**: 10 seconds

If connection takes longer, it will fail gracefully instead of hanging.

## Testing Locally

To test if your connection string works:

1. **Use MongoDB Compass:**
   - Download [MongoDB Compass](https://www.mongodb.com/products/compass)
   - Connect using your `MONGODB_URI`
   - If it works locally, the issue is network access in Atlas

2. **Test from your local machine:**
   ```bash
   # In your local .env, use the same MONGODB_URI
   cd ecommerce-api
   pnpm dev
   ```
   - If it works locally, Atlas is blocking Vercel IPs
   - If it doesn't work, check your connection string

## Quick Checklist

- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0` or Vercel IPs
- [ ] `MONGODB_URI` in Vercel is correct format
- [ ] Username and password are correct
- [ ] Database name exists in Atlas
- [ ] Waited 1-2 minutes after changing network access
- [ ] Redeployed API after changes
- [ ] Checked Vercel logs for specific errors

## Still Not Working?

If connection still fails after allowing network access:

1. **Check Vercel logs** for specific error messages
2. **Verify connection string** by testing in MongoDB Compass
3. **Check MongoDB Atlas cluster status** - make sure it's running
4. **Verify database user** has correct permissions
5. **Check if password has special characters** that need URL encoding

## URL Encoding Special Characters

If your password has special characters, they need to be URL-encoded:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

Example:
```
# Password: myP@ss#word
# Encoded: myP%40ss%23word
mongodb+srv://username:myP%40ss%23word@cluster.mongodb.net/dbname
```

