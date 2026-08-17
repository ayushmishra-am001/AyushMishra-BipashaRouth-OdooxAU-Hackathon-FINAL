# Email Verification & Password Reset - Setup Complete ✓

All files have been created and configured for you. Here's what's been set up:

## ✅ Files Created

### Frontend Pages
1. **verify-email.html** - Email verification page
   - Automatically processes verification token from email link
   - Shows success/error messages
   - Links to login page

2. **forgot-password.html** - Forgot password request page
   - Users enter their email
   - Receives password reset link via email
   - Styled form with validation

3. **reset-password.html** - Password reset form
   - Users enter new password
   - Validates password match
   - Requires minimum 6 characters

### Updated Pages
- **login.html** - Added "Forgot Password?" link
- **signup.html** - Added info message about email verification requirement

## 📧 Email Configuration

### Step 1: Update `.env` file
Create or update your `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rms

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@rentalsystem.com

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:3000

# Port
PORT=5000
```

### Step 2: Get Gmail App Password
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Enable 2-Factor Authentication (if not already enabled)
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password
6. Paste it as `EMAIL_PASSWORD` in `.env`

**Example:**
```env
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

## 🗄️ Database Setup

### For Existing Databases
Run the migration script:

```bash
psql -U your_user -d your_database -f db/migration-add-email-verification.sql
```

This adds 4 new columns:
- `email_verified` (boolean)
- `email_verification_token` (text)
- `password_reset_token` (text)
- `password_reset_expires` (timestamp)

### For New Databases
The schema is already updated in `db/schema.sql`. No additional action needed.

## 🚀 How It Works

### User Registration Flow
1. User signs up at `/pages/signup.html`
2. Backend creates user with `email_verified = false`
3. Verification email sent automatically
4. User clicks link in email → `/verify-email.html?token=...`
5. Frontend sends token to backend
6. User can now login

### Login Flow
1. User visits `/pages/login.html`
2. Enters email and password
3. Backend checks if email is verified
4. If not verified → error "Please verify your email"
5. If verified → login successful

### Forgot Password Flow
1. User visits `/pages/forgot-password.html`
2. Enters email address
3. Backend sends password reset email (doesn't reveal if email exists)
4. User clicks link in email → `/reset-password.html?token=...`
5. User enters new password
6. Backend updates password and clears token
7. User can login with new password

## 🔌 API Endpoints

All endpoints are at `http://localhost:5000/api/auth/`

### 1. Sign Up
```
POST /signup
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
Response: { user, token, message: "Check your email..." }
```

### 2. Verify Email
```
POST /verify-email
Body: { "token": "verification-token" }
Response: { message: "Email verified successfully" }
```

### 3. Login
```
POST /login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: { user, token }
```

### 4. Forgot Password
```
POST /forgot-password
Body: { "email": "john@example.com" }
Response: { message: "If email exists, reset link sent" }
```

### 5. Reset Password
```
POST /reset-password
Body: {
  "token": "reset-token",
  "password": "newpassword123"
}
Response: { message: "Password reset successfully" }
```

## 🧪 Testing

### Test Email Verification
1. Start your server: `npm start`
2. Go to `http://localhost:3000/pages/signup.html`
3. Fill out the form and submit
4. Check server console for verification token
5. Open `http://localhost:3000/pages/verify-email.html?token=YOUR_TOKEN`
6. Should see "Email verified successfully"
7. Now you can login

### Test Password Reset
1. Go to `http://localhost:3000/pages/forgot-password.html`
2. Enter an email address
3. Check server console for reset token
4. Open `http://localhost:3000/pages/reset-password.html?token=YOUR_TOKEN`
5. Enter new password and submit
6. Login with new password

### Production Email Testing
1. Configure `.env` with real Gmail credentials
2. Complete signup - should receive real email
3. Click link in email to verify
4. Test forgot password - should receive reset email

## ⚙️ Advanced Configuration

### Using Different Email Services

#### Outlook/Hotmail
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Yahoo Mail
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-password
```

#### Custom SMTP Server
Edit `backend/services/email.service.js` to add custom transporter:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: env.emailUser,
    pass: env.emailPassword,
  },
});
```

### Customize Email Templates
Edit `backend/services/email.service.js`:
- `sendVerificationEmail()` - verification email HTML
- `sendPasswordResetEmail()` - password reset email HTML

### Change Token Expiry Times
Edit `backend/services/auth.service.js`:
- Verification token: Line ~52 (currently 24 hours)
- Password reset: Line ~75 (currently 1 hour)

## 🐛 Troubleshooting

### "Emails not sending?"
1. Check `.env` configuration
2. Check server console for errors
3. For Gmail: Use app password, not regular password
4. Verify credentials are correct: `echo $EMAIL_USER`

### "Invalid token error?"
1. Token may have expired (verify: 24h, reset: 1h)
2. Check token format in database
3. Ensure token is passed correctly from email link

### "Can't login after email verification?"
1. Check `email_verified = true` in database
2. Ensure token was cleared from `email_verification_token`

### "Email link not working?"
1. Check `FRONTEND_URL` in `.env` is correct
2. Ensure frontend pages are accessible at that URL
3. Check browser console for JavaScript errors

## 📝 Notes

- ✅ Email verification enforced on login
- ✅ Forgot password doesn't reveal if email exists (security)
- ✅ Password reset tokens expire after 1 hour
- ✅ Verification tokens expire after 24 hours
- ✅ All passwords hashed with bcryptjs
- ✅ Tokens are cryptographically secure (32 bytes)

## 📞 Support

If you encounter any issues:
1. Check server console for error messages
2. Check browser console (F12) for frontend errors
3. Verify database has new columns
4. Verify `.env` configuration
5. Check email service credentials

---

**Setup Date:** 2026-08-17
**Status:** ✅ Complete and Ready
