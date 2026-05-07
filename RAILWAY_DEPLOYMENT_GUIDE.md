# 🚀 Railway.app Deployment - Complete Step-by-Step Guide

**Deploy your CCNA platform to Railway in 5-10 minutes for FREE**

---

## ✅ Prerequisites (Check These First)

- [ ] GitHub account (free - https://github.com/signup)
- [ ] This repository code pushed to GitHub
- [ ] 5-10 minutes of time
- [ ] That's it! ✓

No credit card needed. No software to install. No command line required.

---

## 📋 Step 1: Create Railway Account

### 1.1 Go to Railway.app
```
https://www.railway.app
```

### 1.2 Click "Sign Up"
Look for the signup button in the top right

### 1.3 Click "GitHub"
Sign up with your GitHub account

### 1.4 Authorize Railway
Railways will ask for permission to access your GitHub repos
- Click "Authorize"

### Result
✓ You now have a Railway account

---

## 🔧 Step 2: Create New Project

### 2.1 Click "New Project"
Located on your Railway dashboard after login

### 2.2 Select "Import from GitHub"
You should see options including:
- Import from GitHub
- Start from Template
- Create Empty Project

Click "Import from GitHub"

### 2.3 Select Your Repository
You'll see a list of your GitHub repositories

Find and click: **websitepractice** (or your repo name)

### Result
✓ Railway will import your repository

---

## ⚙️ Step 3: Configure Deployment

### 3.1 Railway Auto-Detects Your App
Railway will automatically detect:
- ✓ Node.js application
- ✓ Backend NestJS API
- ✓ Frontend Next.js app

### 3.2 Create Services (They Auto-Appear)
Railway will automatically create services for:
1. **Backend Service** - NestJS API
2. **Frontend Service** - Next.js app
3. **PostgreSQL Database** - Automatically provisioned

### 3.3 Wait for Auto-Configuration
Railway's AI will:
- Detect your `package.json`
- Set build commands: `npm install && npm run build`
- Set start commands: `npm start` or `npm run dev`
- Create environment variables

### Result
✓ All services are configured automatically

---

## 🔑 Step 4: Set Environment Variables

### 4.1 Go to Backend Service Settings
In Railway dashboard:
1. Click on "backend" service
2. Click "Variables" tab

### 4.2 Add Backend Environment Variables
Click "New Variable" and add:

```
NODE_ENV                  = production
PORT                      = 3001
JWT_SECRET                = $(openssl rand -base64 32)
LOG_LEVEL                 = info
DATABASE_URL              = [auto-filled by Railway]
FRONTEND_URL              = [will be your Railway URL]
```

**Important:**
- Click the key icon next to `JWT_SECRET` to auto-generate
- `DATABASE_URL` will be auto-filled from PostgreSQL service
- `FRONTEND_URL` will be your deployed URL

### 4.3 Go to Frontend Service Settings
1. Click on "frontend" service
2. Click "Variables" tab

### 4.4 Add Frontend Environment Variables
Click "New Variable" and add:

```
NEXT_PUBLIC_API_URL       = https://backend-[random].railway.app/api/v1
NEXT_PUBLIC_APP_URL       = https://frontend-[random].railway.app
NODE_ENV                  = production
```

**Note:** Replace `[random]` with your actual Railway URL (you'll see it after deployment)

### Result
✓ Environment variables are configured

---

## 🗄️ Step 5: Configure PostgreSQL Database

### 5.1 PostgreSQL Auto-Appears
Railway automatically creates PostgreSQL when you deploy

### 5.2 Get Database Credentials
In Railway dashboard:
1. Click "PostgreSQL" service
2. Click "Variables" tab
3. Copy the connection string that starts with `postgresql://`

### 5.3 Add to Backend
The `DATABASE_URL` should already be connected to your backend service

### Result
✓ Database is connected

---

## 🚀 Step 6: Deploy

### 6.1 Start Deployment
Back on your project overview:
1. Look for your services (backend, frontend, postgres)
2. Click the "Deploy" button

Or Railway might auto-deploy when you complete setup. Watch for the deployment logs.

### 6.2 Watch the Logs
As it deploys, you'll see:
- Building... (2-3 minutes)
- Starting services... (1 minute)
- Deployment complete ✓

### 6.3 Get Your URLs
After deployment, Railway shows:
- **Backend URL:** `https://backend-[random].railway.app`
- **Frontend URL:** `https://frontend-[random].railway.app`
- **Database:** Connected automatically

### Result
✓ Your app is DEPLOYED! 🎉

---

## ✅ Step 7: Verify Deployment

### 7.1 Test Backend API
Visit your backend health endpoint:
```
https://backend-[random].railway.app/api/v1/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-05-05T...",
  "uptime": 123
}
```

### 7.2 Test Frontend
Visit your frontend URL:
```
https://frontend-[random].railway.app
```

You should see:
- CCNA platform landing page
- Sign up / login option
- Navigation menu

### 7.3 Test Full Flow
1. Go to frontend URL
2. Click "Sign Up"
3. Create a test account
4. Try to start an exam
5. Verify everything works

### Result
✓ Everything is working!

---

## 🎯 Step 8: Update Frontend URLs (If Needed)

If your frontend can't reach the backend:

### 8.1 Update Frontend Environment Variables
In Railway dashboard:
1. Click "frontend" service
2. Click "Variables"
3. Update `NEXT_PUBLIC_API_URL` to your actual backend URL:
   ```
   https://backend-abc123.railway.app/api/v1
   ```
4. Click "Save"

### 8.2 Trigger Redeploy
Railway auto-redeploys after variable changes
Wait 1-2 minutes for redeploy

### 8.3 Test Again
Refresh frontend, should now connect to backend

### Result
✓ Frontend and backend are connected

---

## 🔐 Step 9: Set Up Custom Domain (Optional)

If you want a custom domain like `ccna.example.com`:

### 9.1 Register Domain
Buy a domain from:
- Namecheap
- GoDaddy
- Google Domains
- AWS Route 53

Cost: ~$10/year

### 9.2 Connect in Railway
1. Go to frontend service
2. Settings → "Domain"
3. Click "Add Custom Domain"
4. Enter your domain: `ccna.example.com`

### 9.3 Update DNS
Railway gives you DNS records to add to your domain provider

### 9.4 Wait for SSL
Railway auto-generates SSL certificate (takes ~5 min)

### Result
✓ Your app is accessible at `https://ccna.example.com`

---

## 📊 Step 10: Monitor Your Deployment

### 10.1 View Logs
In Railway dashboard:
1. Click any service
2. Click "Logs" tab
3. See real-time logs

### 10.2 Check Resources
1. Click "Metrics" tab
2. View CPU, Memory, Disk usage
3. Make sure not exceeding limits

### 10.3 Monitor Usage
Railway shows:
- Compute hours used
- Database storage
- Bandwidth used

Your $5/month credit should cover:
- ✓ 100+ GB-hours compute
- ✓ 100+ GB bandwidth
- ✓ 10GB database storage

### Result
✓ Monitoring is set up

---

## 💰 Understanding Your FREE Tier

### What's Included
- ✓ $5/month credit (auto-renews)
- ✓ Unlimited projects
- ✓ 3 services per project included
- ✓ PostgreSQL database
- ✓ Free SSL certificates
- ✓ 99.5% uptime SLA

### Will You Exceed It?
Probably NOT. Your CCNA app uses:
- ~50-100 GB-hours/month (way under limit)
- ~1-5 GB bandwidth/month (way under limit)
- ~100MB database (way under limit)

### What If You Exceed?
- Railway alerts you before charges
- You can set spending limits
- Charges are only for overage
- You control everything

### Result
✓ Safe to deploy - won't get surprise bills

---

## 🆘 Troubleshooting

### Problem: Services won't start

**Solution:**
1. Check logs for errors (click service → Logs)
2. Common issues:
   - Missing environment variables → Add them
   - Database not connected → Check DATABASE_URL
   - Build failed → Check build logs

### Problem: Frontend can't reach backend

**Solution:**
1. Verify backend is running (check logs)
2. Check `NEXT_PUBLIC_API_URL` environment variable
3. Make sure URL matches deployed backend
4. Redeploy frontend after fixing

### Problem: Database connection fails

**Solution:**
1. Stop and restart PostgreSQL service
2. Verify DATABASE_URL format
3. Check it starts with `postgresql://`

### Problem: Everything looks fine but app doesn't work

**Solution:**
1. Clear browser cache
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Check mobile view
4. Try incognito/private window

---

## 🎯 Common Tasks After Deployment

### View Logs
```
Click Service → Logs tab → See real-time logs
```

### Restart Service
```
Click Service → Settings → "Restart"
```

### Redeploy Latest Code
```
Click Service → Deployments → "New Deployment"
```

### View Database
```
Click PostgreSQL → Variables → See connection details
```

### Update Environment Variables
```
Click Service → Variables → Edit → Save → Auto-redeploys
```

---

## ✨ Advanced: Auto-Deploy from GitHub

Railway can auto-deploy when you push to GitHub:

### 10.1 Enable Auto-Deploy
1. Click your project
2. Settings → "GitHub"
3. Choose your repo and branch
4. Enable "Auto-deploy on push"

### 10.2 How It Works
- Push to GitHub → Railway auto-deploys
- New version live in 2-3 minutes
- Automatic build and start

---

## ✅ Final Checklist

- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] PostgreSQL connected
- [ ] Environment variables set
- [ ] Both URLs working
- [ ] Health check passes
- [ ] Login/signup works
- [ ] Can start exam
- [ ] No errors in logs

---

## 🎉 You're Done!

Your CCNA platform is now LIVE and FREE on Railway!

### What You Have
- ✓ Production app running
- ✓ PostgreSQL database
- ✓ SSL/HTTPS enabled
- ✓ Auto-scaled infrastructure
- ✓ Free $5/month credit
- ✓ Professional deployment

### Next Steps
1. Share your URL with friends/students
2. Add CCNA exam questions (see docs for admin setup)
3. Invite users to your platform
4. Monitor usage on Railway dashboard

### Cost
**$0/month** for typical usage

---

## 📞 Getting Help

### Railway Issues
- https://docs.railway.app/
- Railway support dashboard

### Your App Issues
- Check logs in Railway dashboard
- See [docs/API.md](docs/API.md) for API docs
- See [DEVELOPMENT.md](DEVELOPMENT.md) for code questions

### Team Questions
- See [docs/INDEX.md](docs/INDEX.md) for all documentation

---

## 🚀 Summary

**You just deployed a production-ready CCNA exam platform for FREE!**

- Setup: Easy (clickable UI)
- Time: 10 minutes total
- Cost: $0/month
- Performance: Professional
- Uptime: 99.5%+

**Congratulations!** 🎉

---

**Need to deploy again after code changes?**
→ Push to GitHub → Railway auto-deploys → Done!

**More questions?**
→ See [FREE_DEPLOYMENT.md](FREE_DEPLOYMENT.md) or [docs/INDEX.md](docs/INDEX.md)
