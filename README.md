# Company Dashboard Website

A professional company management dashboard built with React, Firebase, and Tailwind CSS. Features role-based access control for admins and employees with comprehensive HR management capabilities.

## Features

### Admin Panel
- **Employee Management**: Add, edit, and manage employee records
- **Holiday Management**: Create and manage company holidays
- **Task Management**: Assign tasks to employees with priority levels
- **Finance & P&L**: View detailed financial information and payroll

### Employee Portal
- **Holidays**: View company holidays and time off
- **Tasks**: View assigned tasks and track progress
- **Attendance**: Check attendance records
- **Salary & Announcements**: View salary information and company announcements

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Icons**: Lucide React
- **Routing**: React Router v6

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account with a Firestore project

## Setup Instructions

### 1. Clone/Setup Project
```bash
cd "e:\Arch Projects\Company Website"
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Go to Project Settings > Your Apps > Web App
4. Copy the Firebase configuration

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Update the values with your Firebase configuration:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... (other values from Firebase Console)
```

### 4. Setup Firestore Security Rules

1. In Firebase Console, go to Firestore Database
2. Go to "Rules" tab
3. Replace the content with the rules from `firestore.rules`
4. Click "Publish"

### 5. Enable Authentication Methods

In Firebase Console:
1. Go to Authentication > Sign-in method
2. Enable "Email/Password"

### 6. Create Test Users

In Firebase Console > Authentication > Users:

**Admin User:**
- Email: `admin@company.com`
- Password: `Admin@123`

**Employee User:**
- Email: `employee@company.com`
- Password: `Employee@123`

### 7. Setup User Roles in Firestore

Create a `users` collection with documents:

**Admin Document** (`users/admin_user_id`):
```json
{
  "email": "admin@company.com",
  "role": "admin",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Employee Document** (`users/employee_user_id`):
```json
{
  "email": "employee@company.com",
  "role": "employee",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 8. Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── EmployeeManagement.jsx
│   │   ├── HolidayManagement.jsx
│   │   ├── TaskManagement.jsx
│   │   └── FinanceManagement.jsx
│   └── employee/
│       ├── EmployeeDashboard.jsx
│       ├── Holidays.jsx
│       ├── Tasks.jsx
│       ├── Attendance.jsx
│       └── Salary.jsx
├── context/
│   └── AuthContext.jsx
├── config/
│   └── firebase.js
├── pages/
│   ├── Login.jsx
│   └── Dashboard.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Firestore Database Structure

### Collections

1. **users**
   - Stores user profile and role information
   - Fields: email, role, createdAt, updatedAt

2. **employees**
   - Employee records
   - Fields: name, email, department, position, salary, joinDate, status, createdAt, updatedAt

3. **holidays**
   - Company holidays
   - Fields: name, date, description, type (national/company/regional), companyId, createdAt, updatedAt

4. **tasks**
   - Task assignments
   - Fields: title, description, assignedTo, dueDate, priority, status, companyId, createdAt, updatedAt

5. **attendance**
   - Employee attendance records
   - Fields: employeeId, date, status, checkIn, checkOut, createdAt, updatedAt

6. **salarySlips**
   - Salary information
   - Fields: employeeEmail, date, basicSalary, amount, deductions, createdAt, updatedAt

7. **announcements**
   - Company announcements
   - Fields: title, content, category, companyId, createdAt, updatedAt

## Security

### Firebase Security Rules

The application uses Firestore Security Rules to enforce:
- Authentication requirements (users must be logged in)
- Role-based access control (admin-only operations)
- User data privacy (employees can only view their own data)

### Environment Variables

**⚠️ Important**: Never commit `.env.local` file. Add it to `.gitignore`.

The Firebase API key in `.env.local` should be restricted in Firebase Console:
1. Go to APIs & Services > Credentials
2. Click on your Web API Key
3. Restrict to JavaScript origin (your domain)
4. Restrict API to Firestore API only

## Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase:
```bash
firebase init hosting
firebase login
```

3. Build the project:
```bash
npm run build
```

4. Deploy:
```bash
firebase deploy
```

### Alternative: Deploy to Vercel, Netlify, etc.

The build output is in the `dist/` folder and can be deployed to any static hosting service.

## Default User Credentials

For testing purposes, use these credentials:

| Role     | Email                | Password      |
|----------|----------------------|---------------|
| Admin    | admin@company.com    | Admin@123     |
| Employee | employee@company.com | Employee@123  |

⚠️ Change these credentials immediately in production!

## Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code (if configured)
npm run lint
```

## Features in Detail

### Admin Features
- ✅ Add/Edit/Delete employees
- ✅ Create holiday calendar
- ✅ Assign and track tasks
- ✅ View comprehensive finance reports
- ✅ Monitor employee payroll

### Employee Features
- ✅ View company holidays
- ✅ Check assigned tasks and deadlines
- ✅ Review attendance records
- ✅ Download salary slips
- ✅ Read company announcements

## Security Checklist

- [ ] Change default admin and employee passwords
- [ ] Update Firebase API key restrictions
- [ ] Enable Firestore backup
- [ ] Set up two-factor authentication for admin accounts
- [ ] Review and test Firestore security rules
- [ ] Configure CORS policies
- [ ] Set up monitoring and alerts
- [ ] Enable audit logs
- [ ] Implement SSL/TLS for all communications

## Troubleshooting

### Firebase Authentication Issues
- Ensure users are created in Firebase Authentication
- Verify users have role documents in Firestore
- Check browser console for error messages

### Firestore Access Denied
- Verify Firestore rules are published
- Check user authentication status
- Ensure user has correct role in database

### Styling Issues
- Clear browser cache
- Rebuild Tailwind CSS: `npm run build`
- Check if `index.css` is properly imported

## Support & Contributing

For issues or improvements, please contact your development team or refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is proprietary and confidential. All rights reserved.

---

**Last Updated**: June 2026
**Version**: 1.0.0
