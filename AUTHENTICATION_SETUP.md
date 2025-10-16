# Authentication Setup Guide

## Creating Your First Admin Account

I've already created a test admin account for you:
- **Email**: `admin@pinnacle.com`
- **Password**: `Admin12345`

But the email needs to be confirmed first. Follow these steps:

### Step 1: Disable Email Confirmation (Recommended for Development)

1. Go to your Supabase project: https://owmffmdtppjlixssljcm.supabase.co
2. Navigate to **Authentication** → **Settings** → **Email Auth**
3. **UNCHECK** "Enable email confirmations"
4. Click **Save**

### Step 2: Confirm the Existing User (Alternative)

If you want to keep email confirmations enabled:
1. Go to **Authentication** → **Users**
2. Find the user `admin@pinnacle.com`
3. Click on the user
4. Look for "Email Confirmed" and manually confirm it

### Step 3: Create Additional Users (Optional)

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. **IMPORTANT**: Check "Auto Confirm User" if you disabled email confirmations
5. Click **"Create user"**

#### Option B: Sign Up Via API (If confirmations disabled)
Users can be created programmatically once email confirmations are off

### Step 3: Access the CRM

1. Navigate to: http://localhost:3001/login
2. Enter your email and password
3. Click **"Sign In"**

You'll be automatically redirected to the dashboard!

## Security Features

- **Protected Routes**: All CRM pages require authentication
- **Middleware Protection**: Unauthenticated users are redirected to login
- **Session Management**: Automatic session handling with Supabase Auth
- **Secure Logout**: Sign out button in the sidebar clears session

## Troubleshooting

### "Failed to sign in" Error
- Verify your email and password are correct
- Check that the user exists in Supabase Authentication → Users
- Make sure your `.env.local` has the correct Supabase credentials

### Redirected to Login After Signing In
- Clear your browser cookies and try again
- Check browser console for errors
- Verify Supabase project URL is correct

### 404 Errors
All placeholder pages have been created. If you see 404s, the dev server may need to refresh.

## Next Steps

Once logged in, you can:
- View the dashboard with real-time metrics
- Navigate to different sections (Sellers, Properties, Investors, etc.)
- Use the **Sign Out** button at the bottom of the sidebar

**Note**: The placeholder pages show "Coming soon" messages. Full CRUD functionality will be implemented in future updates.
