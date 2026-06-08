# 🚀 Company Dashboard - Quick Start (5 minutes)

Get up and running with the Company Dashboard in 5 minutes!

---

## ⚡ Super Quick Setup

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:5173

# 4. Login with demo credentials
# Email: admin@company.com
# Password: Admin@123
```

**That's it! You're ready to go.** 🎉

---

## 📝 Demo Credentials

### Admin Account
```
Email: admin@company.com
Password: Admin@123
```
Access: Employee Management, Holidays, Tasks, Finance

### Employee Account
```
Email: employee@company.com
Password: Employee@123
```
Access: View Holidays, Tasks, Attendance, Salary

---

## 🎯 What You Can Do Immediately

### Admin Features
1. **Add Employees**
   - Click "Employee Management"
   - Click "Add Employee"
   - Fill in details
   - Click "Add Employee"

2. **Create Holidays**
   - Click "Holidays"
   - Click "Add Holiday"
   - Enter date and name
   - Click "Add Holiday"

3. **Assign Tasks**
   - Click "Tasks"
   - Click "Assign Task"
   - Select employee
   - Set due date and priority
   - Click "Assign Task"

4. **View Finance**
   - Click "Finance & P&L"
   - See payroll reports
   - View salary details

### Employee Features
1. **View Holidays** - See company holidays
2. **Check Tasks** - View assigned tasks
3. **Track Attendance** - See attendance percentage
4. **View Salary** - Check salary information

---

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app component |
| `src/pages/Login.jsx` | Login page |
| `src/pages/Dashboard.jsx` | Dashboard layout |
| `firestore.rules` | Database security rules |
| `.env.local` | Firebase configuration |

---

## 🔧 Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install new package
npm install package-name
```

---

## 🐛 Quick Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000
```

**Styles not showing?**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache

**Can't log in?**
- Verify `.env.local` has Firebase config
- Restart dev server after creating `.env.local`

**Console errors?**
- Open DevTools (F12)
- Check browser console
- Check Network tab for API calls

---

## 📚 Next Steps

1. **Quick Try** (5 min)
   - Start dev server
   - Log in as admin
   - Create a test employee
   - Go to DONE ✓

2. **Firebase Setup** (15 min)
   - Follow `FIREBASE_SETUP.md`
   - Create real users in Firebase
   - Test with real credentials

3. **Explore Features** (30 min)
   - Read `FEATURES_GUIDE.md`
   - Try all admin features
   - Try all employee features

4. **Customize** (varies)
   - Update company name
   - Change colors
   - Add logo
   - Customize fields

5. **Deploy** (30 min)
   - Follow `DEPLOYMENT_GUIDE.md`
   - Deploy to Firebase Hosting
   - Go live!

---

## 🎨 Quick Customizations

### Change Colors
Edit `src/index.css` to customize Tailwind colors

### Change Company Name
Search for "Company Dashboard" in:
- `src/pages/Login.jsx`
- `src/pages/Dashboard.jsx`

### Add Logo
Place logo in `public/` folder and import in Login.jsx

### Change Theme
Modify Tailwind config in `tailwind.config.js`

---

## ✨ Features at a Glance

| Feature | Admin | Employee |
|---------|-------|----------|
| Add Employees | ✓ | - |
| Create Holidays | ✓ | View only |
| Assign Tasks | ✓ | View/Track |
| View Finance | ✓ | - |
| Attendance | ✓ | View own |
| Salary Slips | ✓ | View own |
| Announcements | ✓ | View only |

---

## 🔐 Security Notes

⚠️ **Important**:
- `.env.local` contains sensitive keys - NEVER commit to git
- Change default passwords in production
- Review Firestore security rules
- Enable HTTPS for production

---

## 📞 Need Help?

1. Check `README.md` for full documentation
2. Check `FIREBASE_SETUP.md` for database help
3. Check `FEATURES_GUIDE.md` for feature details
4. Check browser console (F12) for errors

---

## 🎉 You're All Set!

**Run this to start:**
```bash
npm run dev
```

**Then visit:**
```
http://localhost:5173
```

**And login as:**
```
admin@company.com / Admin@123
```

---

**Time to first screen**: ~2 seconds ⚡
**Time to functional dashboard**: ~30 seconds 🎯

Enjoy! 🚀
