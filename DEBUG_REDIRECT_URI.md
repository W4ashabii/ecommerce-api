# Debug Redirect URI Mismatch

## Quick Debug Steps

### Step 1: Check What Redirect URI API is Generating

Call this endpoint to see what redirect URI your API is actually using:

```bash
curl https://amyz-api.vercel.app/api/auth/google/url
```

Or visit in browser:
```
https://amyz-api.vercel.app/api/auth/google/url
```

The response will show:
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "redirectUri": "https://amyzz.vercel.app/auth/callback",
  "frontendUrl": "https://amyzz.vercel.app",
  "expectedRedirectUri": "https://amyzz.vercel.app/auth/callback"
}
```

**Copy the `redirectUri` value** - this is what you need to add to Google Cloud Console.

### Step 2: Verify Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** > **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Scroll to **Authorized redirect URIs**
5. Check if you have EXACTLY the redirect URI from Step 1

**Example**: If API returns `https://amyzz.vercel.app/auth/callback`, then Google Console must have:
```
https://amyzz.vercel.app/auth/callback
```

### Step 3: Common Issues

#### Issue 1: Trailing Slash
❌ **Wrong**: `https://amyzz.vercel.app/auth/callback/` (with trailing slash)
✅ **Correct**: `https://amyzz.vercel.app/auth/callback` (no trailing slash)

#### Issue 2: Wrong Protocol
❌ **Wrong**: `http://amyzz.vercel.app/auth/callback` (http instead of https)
✅ **Correct**: `https://amyzz.vercel.app/auth/callback` (https)

#### Issue 3: Wrong Domain
❌ **Wrong**: `https://amyz-api.vercel.app/auth/callback` (API domain)
❌ **Wrong**: `https://amyz.vercel.app/auth/callback` (different domain)
✅ **Correct**: `https://amyzz.vercel.app/auth/callback` (exact frontend domain)

#### Issue 4: Case Sensitivity
❌ **Wrong**: `https://Amyzz.vercel.app/auth/callback` (capital letters)
✅ **Correct**: `https://amyzz.vercel.app/auth/callback` (lowercase)

### Step 4: Fix in Google Cloud Console

1. **Remove** any incorrect redirect URIs
2. **Add** the exact redirect URI from Step 1
3. **Save** changes
4. Wait 1-2 minutes for changes to propagate
5. Try signing in again

### Step 5: Verify FRONTEND_URL

In **Vercel Dashboard > API Project > Settings > Environment Variables**, check:

```env
FRONTEND_URL=https://amyzz.vercel.app
```

**Must be exactly**:
- ✅ `https://amyzz.vercel.app` (with https, no trailing slash)
- ❌ NOT `http://amyzz.vercel.app`
- ❌ NOT `https://amyzz.vercel.app/`
- ❌ NOT `amyzz.vercel.app`

### Step 6: Redeploy After Changes

After updating `FRONTEND_URL` in Vercel:
1. Go to **Deployments**
2. Click **Redeploy** on latest deployment
3. Wait for deployment to complete
4. Test again

## Testing

1. **Get the redirect URI**:
   ```
   https://amyz-api.vercel.app/api/auth/google/url
   ```

2. **Copy the `redirectUri` value**

3. **Add it to Google Cloud Console** (exact match, no variations)

4. **Clear browser cache** or use incognito

5. **Try signing in again**

## Still Not Working?

If the redirect URI matches exactly but still getting the error:

1. **Check for multiple OAuth clients**: Make sure you're editing the correct OAuth client ID
2. **Verify Client ID matches**: Check that the `GOOGLE_CLIENT_ID` in Vercel matches the one in Google Console
3. **Wait for propagation**: Google changes can take 1-5 minutes
4. **Check all environments**: Make sure you added the redirect URI to the correct OAuth client (not a test client)

