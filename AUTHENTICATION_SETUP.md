# Supabase Authentication Setup Guide

This guide will help you set up Supabase Authentication for your Aqeel AI Memory Assistant application.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Your Supabase project URL and anon key

## Step 1: Configure Supabase Authentication

### 1.1 Enable Email Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure the following settings:
   - **Enable email confirmations**: ✅ **ENABLED** (Required for OTP verification)
   - **Enable secure email change**: ✅ **ENABLED**
   - **Enable double confirm changes**: ✅ **ENABLED**

### 1.2 Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm signup**: Welcome email with verification code
   - **Reset password**: Password reset email
   - **Change email address**: Email change confirmation

### 1.3 Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Configure Google OAuth:
   - Create a Google Cloud Project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized origins
   - Add redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

## Step 2: Configure Redirect URLs

### 2.1 Add Site URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URLs:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: 
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/auth/reset`
     - `https://yourdomain.com/auth/callback` (for production)
     - `https://yourdomain.com/auth/reset` (for production)

### 2.2 Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Database Schema

The application requires the following tables with user authentication:

### 3.1 Enable Row Level Security (RLS)

All tables must have RLS enabled with policies that filter by `user_id`:

```sql
-- Enable RLS on all tables
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY "Users can view own interactions" ON interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions" ON interactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Repeat for other tables...
```

## Step 4: Email Configuration

### 4.1 SMTP Settings (Optional)

For custom email sending:

1. Go to **Settings** → **SMTP**
2. Configure your SMTP provider (SendGrid, Mailgun, etc.)
3. Test email delivery

### 4.2 Email Verification

The application enforces email verification:

- Users must verify their email before accessing the app
- OTP codes are sent via email
- Password reset links are sent via email

## Step 5: Testing Authentication

### 5.1 Test Sign Up Flow

1. Start your development server: `npm run dev`
2. Navigate to the app
3. Click "Sign In to Continue"
4. Click "Don't have an account? Sign up"
5. Enter email and password
6. Check email for verification code
7. Enter the code to verify email
8. Sign in with verified account

### 5.2 Test Password Reset

1. Click "Forgot your password?"
2. Enter email address
3. Check email for reset link
4. Click link to reset password
5. Set new password

### 5.3 Test Google OAuth

1. Click "Continue with Google"
2. Complete Google OAuth flow
3. Verify automatic sign-in

## Step 6: Production Deployment

### 6.1 Update Redirect URLs

For production, update your Supabase project:

1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL** to your production domain
3. Add production redirect URLs
4. Update your environment variables

### 6.2 Security Considerations

1. **HTTPS Only**: Ensure your production site uses HTTPS
2. **Secure Headers**: Configure security headers
3. **Rate Limiting**: Consider implementing rate limiting
4. **Session Management**: Monitor active sessions

## Troubleshooting

### Common Issues

1. **"User not authenticated" errors**
   - Check if RLS policies are correctly configured
   - Verify user is signed in
   - Check browser console for auth errors

2. **Email not received**
   - Check spam folder
   - Verify email templates are configured
   - Check SMTP settings if using custom provider

3. **OAuth redirect errors**
   - Verify redirect URLs in Supabase dashboard
   - Check Google OAuth configuration
   - Ensure domain is authorized

4. **Database connection errors**
   - Verify environment variables
   - Check Supabase project status
   - Ensure database schema is properly set up

### Debug Mode

Enable debug logging in your browser console:

```javascript
// Add to your app for debugging
localStorage.setItem('supabase.auth.debug', 'true');
```

## Security Best Practices

1. **Never expose service role keys** in client-side code
2. **Use environment variables** for sensitive configuration
3. **Enable email verification** for all users
4. **Implement proper session management**
5. **Regular security audits** of your authentication setup
6. **Monitor authentication logs** in Supabase dashboard

## Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
3. Check the application console for error messages
4. Verify your Supabase project configuration

---

**Note**: This authentication system enforces email verification and provides secure password reset functionality. All user data is properly isolated using Row Level Security (RLS) policies. 