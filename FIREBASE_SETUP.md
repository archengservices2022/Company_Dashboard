# Firebase Setup Guide

This guide provides step-by-step instructions to set up Firebase for the Company Dashboard application.

## Prerequisites

- Google account
- Firebase CLI (optional, for advanced setup)
- Terminal/Command Prompt access

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `companydashboard` (or your preferred name)
4. Follow the prompts:
   - Disable Google Analytics (or enable if you prefer)
   - Click "Create project"
5. Wait for project creation to complete

## Step 2: Create Firestore Database

1. In Firebase Console, click "Create database"
2. Choose location (select closest to your users)
3. Start in "Production mode" (we'll set security rules)
4. Click "Create"
5. Wait for database initialization

## Step 3: Set Security Rules

1. Go to Firestore Database > Rules
2. Replace default rules with content from `firestore.rules`
3. Click "Publish"

## Step 4: Enable Authentication

1. Go to Authentication section
2. Click "Get started"
3. Click "Email/Password"
4. Enable toggle for "Email/Password"
5. Click "Save"

## Step 5: Create Test Users

### Create Admin User

1. Go to Authentication > Users
2. Click "Add user"
3. Email: `admin@company.com`
4. Password: `Admin@123`
5. Click "Add user"
6. Note the User ID (you'll need it next)

### Create Employee User

1. Click "Add user"
2. Email: `employee@company.com`
3. Password: `Employee@123`
4. Click "Add user"
5. Note this User ID as well

## Step 6: Create User Documents in Firestore

1. Go to Firestore Database > Data
2. Click "Start collection"
3. Collection ID: `users`
4. Click "Next"

### Add Admin User Document

5. Document ID: (Use the Admin User ID from step above)
6. Add fields:
   - `email` (string): `admin@company.com`
   - `role` (string): `admin`
   - `createdAt` (timestamp): Current time
   - `updatedAt` (timestamp): Current time
7. Click "Save"

### Add Employee User Document

8. Click "Add document"
9. Document ID: (Use the Employee User ID)
10. Add fields:
    - `email` (string): `employee@company.com`
    - `role` (string): `employee`
    - `createdAt` (timestamp): Current time
    - `updatedAt` (timestamp): Current time
11. Click "Save"

## Step 7: Get Firebase Configuration

1. Go to Project Settings (gear icon > Project settings)
2. Scroll down to "Your apps"
3. Click the Web icon (</> symbol)
4. Register app (name: `companydashboard-web`)
5. Copy the Firebase config
6. It should look like:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "G_MEASUREMENT_ID"
};
```

## Step 8: Configure Environment Variables

1. In your project root, create `.env.local` file
2. Add Firebase configuration:

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=G_MEASUREMENT_ID
```

3. Save the file (DO NOT commit to git)

## Step 9: Add Sample Data (Optional)

### Create Sample Employees

1. Go to Firestore Database > Collections > Create Collection
2. Collection ID: `employees`
3. Add sample documents:

```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "department": "Engineering",
  "position": "Senior Developer",
  "salary": "5000",
  "joinDate": "2023-01-15",
  "status": "active",
  "companyId": "default",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "department": "Marketing",
  "position": "Marketing Manager",
  "salary": "4500",
  "joinDate": "2023-03-20",
  "status": "active",
  "companyId": "default",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Create Sample Holidays

Collection ID: `holidays`

```json
{
  "name": "New Year",
  "date": "2024-01-01",
  "description": "New Year Day",
  "type": "national",
  "companyId": "default",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

```json
{
  "name": "Independence Day",
  "date": "2024-07-04",
  "description": "National Independence Day",
  "type": "national",
  "companyId": "default",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Create Sample Tasks

Collection ID: `tasks`

```json
{
  "title": "Update Website Homepage",
  "description": "Redesign and update the company website homepage",
  "assignedTo": "employee_user_id_here",
  "dueDate": "2024-12-31",
  "priority": "high",
  "status": "in-progress",
  "companyId": "default",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Step 10: Configure API Key Restrictions (Security)

1. Go to APIs & Services > Credentials
2. Find your Web API Key
3. Click on it to edit
4. Under "Key restrictions":
   - Application restrictions: Select "HTTP referrers (web sites)"
   - Add your domain: `localhost:5173` (for local development)
   - Add your production domain later

5. Under "API restrictions":
   - Select "Restrict key"
   - Check only "Cloud Firestore API"

## Verification

1. Run the application: `npm run dev`
2. Go to `http://localhost:5173`
3. Try logging in with:
   - Email: `admin@company.com`
   - Password: `Admin@123`
4. You should see the Admin Dashboard

## Troubleshooting

### Issue: "Permission denied" errors

**Solution**: 
- Verify Firestore rules are published
- Check that user documents exist in `users` collection
- Confirm user has correct role

### Issue: "Cannot read properties of undefined"

**Solution**:
- Ensure `.env.local` file exists with correct Firebase config
- Restart development server after adding `.env.local`
- Clear browser cache

### Issue: Users cannot log in

**Solution**:
- Verify user exists in Firebase Authentication
- Check that user has email verification if required
- Ensure password is correct
- Check browser console for error messages

### Issue: Admin features not visible

**Solution**:
- Verify admin user has `role: "admin"` in users collection
- Logout and login again to refresh role
- Check Firestore rules are published

## Production Deployment

### Before Going Live

1. ✅ Change default passwords
2. ✅ Restrict API keys to production domain
3. ✅ Enable backup for Firestore
4. ✅ Set up monitoring
5. ✅ Review security rules thoroughly
6. ✅ Enable two-factor authentication
7. ✅ Set up error logging
8. ✅ Configure CORS if needed

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Build the project
npm run build

# Deploy
firebase deploy
```

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Review browser console (F12 > Console)
3. Check Firestore rules for permission issues
4. Verify environment variables are set correctly

---

**Last Updated**: June 2026
