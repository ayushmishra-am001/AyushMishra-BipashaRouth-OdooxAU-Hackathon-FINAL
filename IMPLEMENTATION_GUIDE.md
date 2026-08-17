# Email Verification & Password Reset Implementation Guide

This guide explains how to use the new email verification and password reset features.

## Features Added

1. **Email Verification** - New users must verify their email address before they can login
2. **Password Reset** - Users can reset their password via email if they forget it

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install nodemailer (v6.9.7) which is now included in package.json.

### 2. Update Database

Run the migration script to add new columns to existing databases:

```bash
psql -U your_user -d your_database -f db/migration-add-email-verification.sql
```

Or for new setups, the columns are already in `db/schema.sql`.

### 3. Configure Email Service

Set up your email credentials in `.env` file:

```env
# Email Configuration (for verification and password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@rentalsystem.com

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:3000
```

**Important:** For Gmail, use an [App Password](https://myaccount.google.com/apppasswords) instead of your regular password.

### 4. Create Frontend Pages

Create the following pages in your frontend:

#### Email Verification Page (`frontend/pages/verify-email.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Verify Email</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <div class="container">
        <h1>Verifying your email...</h1>
        <p id="message">Please wait...</p>
    </div>

    <script>
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            document.getElementById('message').textContent = 'No verification token provided.';
        } else {
            fetch('http://localhost:5000/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('message').innerHTML = 
                        'Email verified successfully! <a href="login.html">Click here to login</a>';
                } else {
                    document.getElementById('message').textContent = 
                        data.message || 'Verification failed.';
                }
            })
            .catch(err => {
                document.getElementById('message').textContent = 
                    'Error verifying email: ' + err.message;
            });
        }
    </script>
</body>
</html>
```

#### Forgot Password Page (`frontend/pages/forgot-password.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Forgot Password</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <div class="container" style="max-width: 400px;">
        <h1>Reset Your Password</h1>
        <form id="forgotForm">
            <input type="email" id="email" placeholder="Enter your email" required>
            <button type="submit">Send Reset Link</button>
        </form>
        <p id="message" style="color: green;"></p>
    </div>

    <script>
        document.getElementById('forgotForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            try {
                const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();
                document.getElementById('message').textContent = 
                    'If that email is in our system, you will receive a reset link.';
                document.getElementById('forgotForm').reset();
            } catch (err) {
                document.getElementById('message').textContent = 
                    'Error: ' + err.message;
                document.getElementById('message').style.color = 'red';
            }
        });
    </script>
</body>
</html>
```

#### Reset Password Page (`frontend/pages/reset-password.html`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Reset Password</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <div class="container" style="max-width: 400px;">
        <h1>Reset Your Password</h1>
        <form id="resetForm">
            <input type="password" id="password" placeholder="New password" required>
            <input type="password" id="confirmPassword" placeholder="Confirm password" required>
            <button type="submit">Reset Password</button>
        </form>
        <p id="message" style="color: green;"></p>
    </div>

    <script>
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            document.getElementById('message').textContent = 'No reset token provided.';
            document.getElementById('message').style.color = 'red';
        }

        document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                document.getElementById('message').textContent = 'Passwords do not match.';
                document.getElementById('message').style.color = 'red';
                return;
            }

            try {
                const res = await fetch('http://localhost:5000/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password })
                });

                const data = await res.json();
                if (data.success) {
                    document.getElementById('message').textContent = 
                        'Password reset successfully! <a href="login.html">Click here to login</a>';
                    document.getElementById('message').style.color = 'green';
                } else {
                    document.getElementById('message').textContent = 
                        data.message || 'Password reset failed.';
                    document.getElementById('message').style.color = 'red';
                }
            } catch (err) {
                document.getElementById('message').textContent = 
                    'Error: ' + err.message;
                document.getElementById('message').style.color = 'red';
            }
        });
    </script>
</body>
</html>
```

## API Endpoints

### 1. Sign Up (Create Account)
**POST** `/api/auth/signup`
- Still returns JWT token immediately
- Sends verification email in background
- User must verify email before login

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "1234567890"
}
```

### 2. Verify Email
**POST** `/api/auth/verify-email`
- Verifies email address using token from email link
- Required before user can login

```json
{
  "token": "verification-token-from-email"
}
```

### 3. Login
**POST** `/api/auth/login`
- Now requires email to be verified first
- Returns error if email not verified

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### 4. Forgot Password
**POST** `/api/auth/forgot-password`
- Sends password reset email
- Doesn't reveal if email exists (security feature)

```json
{
  "email": "john@example.com"
}
```

### 5. Reset Password
**POST** `/api/auth/reset-password`
- Sets new password using token from email

```json
{
  "token": "reset-token-from-email",
  "password": "newpassword"
}
```

## Email Configuration Examples

### Gmail Setup
1. Enable 2-Factor Authentication on your Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail" and "Windows Computer"
4. Copy the generated password and use it in `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

### Other Email Services
The app supports any email service supported by Nodemailer. Update `.env`:

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

Or for custom SMTP:
```env
EMAIL_SERVICE=custom
SMTP_HOST=smtp.example.com
SMTP_PORT=587
```

(Note: For custom SMTP, you'll need to modify `backend/services/email.service.js`)

## Important Notes

1. **Email Verification**: New users cannot login until they verify their email
2. **Token Expiry**: 
   - Email verification tokens: 24 hours
   - Password reset tokens: 1 hour
3. **Security**: Forgot password endpoint doesn't reveal if email exists
4. **Backwards Compatibility**: If email service is not configured, the app still works but emails won't be sent

## Testing

1. Create a new account and check console logs for verification token
2. Use the token in the verify email endpoint
3. Test forgot password flow
4. Verify emails are sent (or check logs if email not configured)

## Troubleshooting

### Emails not sending?
- Check `.env` file is configured correctly
- Check console logs for errors
- For Gmail: Ensure you're using an App Password, not your regular password
- Check that your email service credentials are correct

### Users can't login?
- Make sure email is verified first
- Check `email_verified` column in database
- Verify email verification token is set correctly

### Tokens not working?
- Check token expiry times
- Verify token format in database
- Check token is being passed correctly from email link

## Database Columns Added

```sql
email_verified BOOLEAN NOT NULL DEFAULT false
email_verification_token TEXT
password_reset_token TEXT
password_reset_expires TIMESTAMPTZ
```

All existing users have `email_verified = false` and need to verify if email service is enforced.
