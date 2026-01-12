# Google OAuth Setup Guide

## Environment Variables Required

Add these to your Render dashboard (Environment Variables section) or your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://hitek-server.onrender.com/api/auth/google/callback
FRONTEND_URL=https://your-frontend-domain.com
```

## Steps to Configure

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Configure:
   - **Name**: Hi-Tek Computers OAuth
   - **Authorized JavaScript origins**: 
     - ⚠️ **IMPORTANT**: Only FRONTEND domains, base domain only, NO trailing slash, NO path
     - These are where the OAuth request originates from (the browser)
     - `https://hitek.vercel.app` (your frontend - no trailing slash!)
     - `http://localhost:3000` (local development - no trailing slash!)
     - ❌ **DO NOT** add your backend domain here (e.g., `https://hitek-server.onrender.com`)
     - Wrong: `https://hitek-server.onrender.com/` ❌
     - Wrong: `https://hitek-server.onrender.com/api/auth/google/callback` ❌
   - **Authorized redirect URIs**:
     - ✅ This CAN have a path
     - `https://hitek-server.onrender.com/api/auth/google/callback`
     - `http://localhost:3001/api/auth/google/callback` (local development)
7. Click **Create**
8. **Copy the Client ID and Client Secret**

### 2. Add to Render Environment Variables

1. Go to your Render dashboard
2. Select your service (hitek-server)
3. Go to **Environment** tab
4. Add each variable:
   - `GOOGLE_CLIENT_ID` = (paste your Client ID)
   - `GOOGLE_CLIENT_SECRET` = (paste your Client Secret)
   - `GOOGLE_REDIRECT_URI` = `https://hitek-server.onrender.com/api/auth/google/callback`
   - `FRONTEND_URL` = (your frontend URL, e.g., `https://your-domain.com`)

### 3. Restart Your Server

After adding environment variables, restart your Render service for changes to take effect.

### 4. Test the Integration

1. Go to your signup page
2. Click "Login with Google" or "Sign up with Google"
3. You should be redirected to Google's consent screen
4. After authorizing, you'll be redirected back and logged in

## Troubleshooting

- **"Invalid Origin: URIs must not contain a path or end with '/'."**: 
  - Authorized JavaScript origins must be base domain only (no path, no trailing slash)
  - Example: `https://hitek-server.onrender.com` ✅
  - Wrong: `https://hitek-server.onrender.com/` ❌
  - Wrong: `https://hitek-server.onrender.com/api/auth/google/callback` ❌
- **"redirect_uri_mismatch"**: Make sure the redirect URI in Google Console exactly matches `GOOGLE_REDIRECT_URI`
- **"invalid_client"**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- **CORS errors**: Make sure your frontend URL is added to Authorized JavaScript origins (base domain only, no path)

