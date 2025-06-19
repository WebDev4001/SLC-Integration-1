# SLC Web Combo Backend

## 🌟 Features

* User authentication (Register/Login with JWT)
* Google Sign-In integration (manual token verification, new user flow with Roll Number)
* Role-based admin controls (update/delete users, admin safety logic)
* Suggestions, applications, and feedback handling with file uploads (Multer)
* Device logging for login events (limited to 5 entries)
* Secure file uploads with Multer (PDF and images) with basic validation

## 🏗 Project Structure

```
SLC/backend/
├── routes/
│   ├── auth.js         # Authentication routes (register, login, google, add-roll-number)
│   ├── admin.js        # Admin-specific routes
│   └── engage.js       # Routes for suggestions, applications, feedback
├── models/
│   ├── User.js         # User schema (includes deviceInfo, rollNumber, googleId)
│   ├── Suggestion.js   # Suggestion schema
│   ├── Application.js  # Application schema
│   └── Feedback.js     # Feedback schema
├── middleware/
│   ├── verifyToken.js  # JWT verification middleware
│   └── checkRole.js    # Role checking middleware
├── uploads/            # Directory for uploaded files (resumes, suggestions)
├── .env                # Environment variables (MONGO_URI, JWT_SECRET, etc.)
├── server.js           # Main Express server setup
└── package.json        # Project dependencies and scripts
```

## 🛡 Security Enhancements Implemented/Verified

* JWT expiry and validation.
* Device logging limited to the last 5 entries per user.
* CORS configured (defaulting to `http://localhost:3000` or `process.env.CORS_ORIGIN`).
* Admins cannot delete their own accounts.
* Admins cannot downgrade their own roles via the user management API.
* Basic input validation on some routes (manual checks).
* Checks for essential environment variables (`MONGO_URI`, `JWT_SECRET`) on startup.

## 📝 Security Placeholders (Due to `npm install` constraint)

The following security features have placeholders in the code and require `npm install` of respective packages to be fully activated:

* **Helmet:** For setting various HTTP security headers.
  * `// TODO: npm install helmet` in `server.js`.
* **Express Rate Limiter:** For protecting authentication routes from brute-force attacks.
  * `// TODO: Implement and configure rate limiting for auth routes` in `server.js`.
* **Express-validator:** For robust input validation and sanitization on authentication and other routes.
  * `// TODO: Add express-validator checks` in `routes/auth.js`.

## 💡 Future Improvements

* Email verification (e.g., using Nodemailer).
* OTP-based login flow.
* Comprehensive Admin Dashboard UI.
* Excel/CSV export for logs from the admin panel.
* Full AI assistant integration for the PATH chatbot.
* More robust error handling and logging.
* Implement CSRF protection if using session cookies alongside JWTs for any reason.
* Detailed API documentation (e.g., using Swagger/OpenAPI).**Phase 4, Step 1: Create `README.md` - COMPLETED.**
I've updated the features list to include Google Sign-In and refined the security section to distinguish between implemented features and placeholders.
