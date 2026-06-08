# Company Dashboard - Deployment Guide

Complete guide for deploying the Company Dashboard to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure the following are completed:

### Security
- [ ] Change default admin password
- [ ] Change default employee password
- [ ] Update Firebase API key restrictions
- [ ] Review and test Firestore security rules
- [ ] Enable HTTPS/SSL for all connections
- [ ] Set environment variables for production

### Testing
- [ ] Test admin features thoroughly
- [ ] Test employee features thoroughly
- [ ] Test authentication flow
- [ ] Test file uploads (if applicable)
- [ ] Test on multiple browsers
- [ ] Test responsive design on mobile
- [ ] Verify all database operations

### Configuration
- [ ] Update domain in API key restrictions
- [ ] Set up Firebase backup
- [ ] Enable Cloud Firestore backup
- [ ] Configure Cloud Storage backup
- [ ] Set up monitoring and alerts

### Documentation
- [ ] Document admin procedures
- [ ] Document employee procedures
- [ ] Create user manual
- [ ] Document system architecture
- [ ] Document database structure

---

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Recommended)

**Advantages**:
- Easy integration with Firebase
- CDN globally distributed
- Automatic HTTPS
- Zero-configuration deployment
- Automatic scaling

**Steps**:

#### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase
```bash
firebase login
```
This opens browser to authenticate

#### 3. Initialize Firebase
```bash
firebase init hosting
```

Select these options:
- Choose existing project: `companydashboard-fa832`
- What do you want to use as public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No` (optional)

#### 4. Build the Project
```bash
npm run build
```

This creates the `dist` folder with optimized production build.

#### 5. Deploy to Firebase
```bash
firebase deploy
```

**Output** will show your live URL:
```
Hosting URL: https://companydashboard-fa832.firebaseapp.com
```

#### 6. Custom Domain (Optional)
In Firebase Console:
1. Go to Hosting
2. Click "Add custom domain"
3. Verify domain ownership
4. Update DNS records
5. Wait for SSL certificate

---

### Option 2: Vercel (Alternative)

**Advantages**:
- Optimized for React/Vite
- GitHub integration
- Automatic deployments
- Preview URLs for PRs

**Steps**:

#### 1. Create Vercel Account
Go to [vercel.com](https://vercel.com) and sign up

#### 2. Connect Repository
```bash
npm install -g vercel
vercel
```

#### 3. Set Environment Variables
In Vercel Dashboard:
1. Go to Settings > Environment Variables
2. Add all variables from `.env.local`:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - (and all other Firebase variables)

#### 4. Deploy
Vercel automatically deploys on git push

---

### Option 3: Netlify (Alternative)

**Advantages**:
- Easy deployment
- GitHub integration
- Serverless functions
- Auto preview deploys

**Steps**:

#### 1. Create Netlify Account
Go to [netlify.com](https://netlify.com)

#### 2. Connect GitHub Repository
1. Click "New site from Git"
2. Connect GitHub
3. Select repository
4. Build command: `npm run build`
5. Publish directory: `dist`

#### 3. Set Environment Variables
1. Go to Site settings > Build & deploy
2. Add environment variables from `.env.local`

#### 4. Deploy
Click "Deploy site" (automatic on git push)

---

### Option 4: Docker Containerization

**For teams needing containerized deployment**

#### 1. Create Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### 2. Create .dockerignore
```
node_modules
npm-debug.log
dist
.env
.git
.gitignore
```

#### 3. Build & Run
```bash
# Build image
docker build -t company-dashboard .

# Run container
docker run -p 3000:3000 \
  -e VITE_FIREBASE_API_KEY="your_key" \
  company-dashboard

# Or use docker-compose
docker-compose up
```

---

## 🔐 Production Security Setup

### 1. Update Firebase API Keys

In Firebase Console:

1. Go to APIs & Services > Credentials
2. Find your Web API Key
3. Click to edit
4. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Remove `localhost:5173`
   - Add your production domain(s)
   ```
   companydashboard-fa832.firebaseapp.com
   yourdomain.com
   www.yourdomain.com
   ```

5. Under "API restrictions":
   - Select "Restrict key"
   - Check only these APIs:
     - Cloud Firestore API
     - Firebase Authentication API
     - (Remove Firebase Analytics if not needed)

### 2. Enable Firestore Backup

1. Go to Firestore Database
2. Click on menu (three dots)
3. Select "Backups"
4. Create backup schedule:
   - Frequency: Daily/Weekly
   - Retention: 7-30 days

### 3. Configure Security Rules for Production

Review `firestore.rules` and ensure:
- Users must be authenticated
- Admins have full access
- Employees only access their own data
- No public read/write access

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 4. Enable Cloud Audit Logging

In Firebase Console:
1. Go to Cloud Audit Logs
2. Enable Admin Activity
3. Enable Data Access
4. Export logs to BigQuery for analysis

### 5. Set Up SSL/TLS

- **Firebase Hosting**: Automatic HTTPS
- **Custom Domain**: Automatic SSL via Let's Encrypt
- **Other platforms**: Enable HTTPS in platform settings

### 6. Configure CORS (if needed)

If frontend and backend on different domains:

Create CORS configuration in Firestore:
```bash
gsutil cors set cors.json gs://your-bucket
```

cors.json:
```json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 📊 Production Environment Variables

Create `.env.production` with production-specific values:

```bash
# Firebase Configuration (use production Firebase project)
VITE_FIREBASE_API_KEY=your_production_key
VITE_FIREBASE_AUTH_DOMAIN=companydashboard-fa832.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=companydashboard-fa832
VITE_FIREBASE_STORAGE_BUCKET=companydashboard-fa832.appspot.com

# App Configuration
VITE_APP_ENV=production
VITE_API_BASE_URL=https://companydashboard-fa832.firebaseapp.com
```

---

## 🚀 Deployment Commands

### Build Production Bundle
```bash
npm run build
```

### Test Production Build Locally
```bash
npm run preview
```

### Firebase Deployment
```bash
# Deploy everything
firebase deploy

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only hosting
firebase deploy --only hosting

# Deploy with message
firebase deploy -m "Deploy version 1.0.0"
```

---

## 📈 Post-Deployment Tasks

### 1. Verify Deployment

After deployment:
- [ ] Test login with both admin and employee accounts
- [ ] Verify all features work
- [ ] Check console for errors (F12)
- [ ] Test on mobile devices
- [ ] Test API calls in Network tab
- [ ] Verify analytics working

### 2. Set Up Monitoring

#### Google Cloud Monitoring
1. Go to Cloud Console
2. Create uptime check for dashboard
3. Set up alerts
4. Configure log aggregation

#### Firebase Monitoring
1. Go to Firebase Console
2. Enable Google Analytics (if not already)
3. Set up performance monitoring
4. Create custom events

#### Error Tracking
Set up Sentry or Rollbar:
```bash
npm install @sentry/react
```

Initialize in main.jsx:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production",
  tracesSampleRate: 0.1
});
```

### 3. Create Admin Account

1. Go to Authentication in Firebase Console
2. Create new user:
   - Email: your-admin-email@company.com
   - Strong password
3. Set role in Firestore:
   ```json
   {
     "email": "admin@company.com",
     "role": "admin",
     "createdAt": "timestamp",
     "updatedAt": "timestamp"
   }
   ```

### 4. Test All Features

**Admin Panel**:
- [ ] Add employee
- [ ] Edit employee
- [ ] Delete employee
- [ ] Create holiday
- [ ] Assign task
- [ ] View finance report

**Employee Portal**:
- [ ] View holidays
- [ ] View assigned tasks
- [ ] Check attendance
- [ ] View salary information
- [ ] Read announcements

### 5. Create Documentation

- [ ] Admin user manual
- [ ] Employee user manual
- [ ] System admin guide
- [ ] Troubleshooting guide
- [ ] FAQ document

---

## 🔄 Continuous Deployment

### GitHub Actions (for automatic deployments)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: companydashboard-fa832
```

### Setup
1. Generate Firebase service account key
2. Add to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT`
3. Push to main branch triggers deployment

---

## 🐛 Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| Build fails | Check npm versions, clear cache: `npm cache clean --force` |
| Firebase auth fails | Verify API key restrictions, check domain whitelist |
| Firestore permission denied | Review security rules, check user roles |
| Slow page load | Check bundle size: `npm run build`, optimize images |
| API calls fail | Check CORS settings, verify Firebase config |
| CSS not loading | Check Tailwind build, clear browser cache |

---

## 📊 Performance Optimization

### Bundle Analysis
```bash
npm install --save-dev vite-plugin-visualizer
```

Add to vite.config.js:
```javascript
import { visualizer } from 'vite-plugin-visualizer';

export default {
  plugins: [visualizer()]
}
```

### Image Optimization
- Use WebP format
- Optimize file sizes
- Lazy load images
- Use responsive images

### Code Splitting
Vite automatically chunks code. Monitor with:
```bash
npm run build -- --analyze
```

### Database Optimization
- Index frequently queried fields
- Limit document reads
- Cache results client-side
- Batch operations

---

## 📋 Maintenance Plan

### Daily
- Monitor error logs
- Check user reports
- Verify uptime

### Weekly
- Review analytics
- Check database usage
- Update security patches

### Monthly
- Full backup verification
- Security audit
- Performance review
- Dependency updates

### Quarterly
- Major feature updates
- Security assessment
- User training
- Documentation review

---

## 🆘 Rollback Plan

If something goes wrong after deployment:

### Immediate (< 5 minutes)
```bash
# Rollback to previous version
firebase hosting:channels:list
firebase hosting:clone [previous_version_id] production
```

### Manual Rollback
1. Go to Firebase Hosting
2. Click "All releases"
3. Click previous version
4. Click "Rollback"

### Database Rollback
1. Go to Firestore > Backups
2. Select backup to restore
3. Click "Restore"

---

## 📞 Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Production Build](https://react.dev/learn/start-a-new-react-project)
- [Firestore Backup](https://firebase.google.com/docs/firestore/backups-restore)

---

## ✅ Post-Deployment Checklist

- [ ] All features tested in production
- [ ] No console errors
- [ ] API calls working
- [ ] Database operations successful
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] SSL/HTTPS working
- [ ] Users can login
- [ ] Email notifications working (if applicable)
- [ ] Analytics tracking
- [ ] Error logging enabled
- [ ] Documentation updated
- [ ] Admin trained
- [ ] Users notified

---

**Last Updated**: June 2026
**Version**: 1.0.0

---

## Next Steps

1. Test locally: `npm run dev`
2. Build: `npm run build`
3. Preview: `npm run preview`
4. Deploy: `firebase deploy`
5. Verify in production
6. Monitor and maintain
