# Azure AD Authentication Setup Guide

## 🎯 Implementation Complete!

Your application now has **serverless-compatible** Azure AD (Entra ID) authentication with:
- ✅ Client-side login with MSAL.js
- ✅ Automatic token refresh
- ✅ Protected upload endpoint
- ✅ Stateless token validation
- ✅ Full Vercel compatibility

---

## 📋 Setup Instructions

### Step 1: Register App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: `Photo Upload App` (or any name)
   - **Supported account types**: Choose based on your needs
   - **Redirect URI**: 
     - Platform: `Single-page application (SPA)`
     - URL: `http://localhost:8080/upload.html` (for local testing)
     - URL: `https://your-domain.vercel.app/upload.html` (for production)
5. Click **Register**

### Step 2: Configure Authentication

1. In your app registration, go to **Authentication**
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens
   - ✅ ID tokens
3. Save changes

### Step 3: Get Your Credentials

1. Go to **Overview** page of your app registration
2. Copy these values:
   - **Application (client) ID**
   - **Directory (tenant) ID**

### Step 4: Update Configuration Files

#### Update `.env` file (server-side):
```env
AZURE_CLIENT_ID=paste-your-client-id-here
AZURE_TENANT_ID=paste-your-tenant-id-here
AZURE_CLIENT_SECRET=not-needed-for-spa
PORT=8080
```

#### Update `upload.html` (client-side):
Find this section around line 230:
```javascript
const msalConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID_HERE", // Replace with your Client ID
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID_HERE", // Replace with your Tenant ID
        redirectUri: window.location.origin + window.location.pathname,
    },
```

Replace:
- `YOUR_CLIENT_ID_HERE` → Your actual Client ID
- `YOUR_TENANT_ID_HERE` → Your actual Tenant ID

---

## 🚀 Testing Locally

1. Make sure your `.env` and `upload.html` are configured
2. Server is already running on port 8080
3. Open: `http://localhost:8080`
4. You'll be redirected to Microsoft login
5. After login, you can upload photos

---

## 🌐 Deploy to Vercel

### Before Deploying:

1. **Add redirect URI in Azure Portal:**
   - Go to your App Registration → Authentication
   - Add production URL: `https://your-app.vercel.app/upload.html`

2. **Set Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `AZURE_CLIENT_ID` = your client ID
     - `AZURE_TENANT_ID` = your tenant ID

3. **Update `upload.html` for production:**
   - The redirect URI is dynamic (`window.location.origin`) so it works for both local and production

4. **Deploy:**
   ```bash
   vercel --prod
   ```

---

## 🔒 How Authentication Works

### First Visit:
1. User visits `/` 
2. MSAL.js checks for login
3. Not logged in → Redirects to Microsoft login
4. User logs in with Microsoft account
5. Redirected back to app
6. Token stored in browser localStorage

### Upload Request:
1. User fills form and clicks upload
2. MSAL.js gets fresh access token (silent refresh)
3. Token sent in `Authorization: Bearer <token>` header
4. Server validates token using Azure AD public keys
5. If valid → Upload succeeds
6. If invalid → 401 error

### After Hours:
1. User returns after hours
2. Access token expired
3. MSAL.js automatically refreshes token silently
4. User can upload without re-login
5. Only re-login needed if refresh token expired (90 days)

---

## 📝 Important Notes

- **Serverless Compatible**: No sessions, fully stateless
- **Token Lifetime**: Access tokens expire in ~1 hour
- **Refresh Tokens**: Valid for ~90 days
- **Silent Refresh**: Happens automatically in background
- **Logout**: Clears all tokens and redirects to Microsoft logout

---

## 🐛 Troubleshooting

### "No token provided" error:
- Check if Client ID and Tenant ID are correct in `upload.html`
- Check browser console for MSAL errors

### "Invalid token" error:
- Check if `.env` values match Azure Portal
- Ensure redirect URI is registered in Azure

### Redirect loop:
- Clear browser cache and localStorage
- Check redirect URI configuration

---

## 🎉 You're All Set!

Once you configure the Azure AD credentials, your app will:
- ✅ Require Microsoft login to access
- ✅ Auto-refresh tokens for seamless experience
- ✅ Work perfectly on Vercel serverless
- ✅ Be fully secure and production-ready

