# 🚀 Quick Vercel Deployment Guide

## ⚡ Fast Deployment (5 minutes)

### Step 1: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Click "Deploy"**

### Step 2: Deploy Backend to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Set Root Directory**: `backend`
5. **Add Environment Variable:**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
6. **Click "Deploy"**

### Step 3: Connect Frontend to Backend

1. **Copy your Railway URL** (e.g., `https://your-app.railway.app`)
2. **Go to Vercel Dashboard → Your Project → Settings → Environment Variables**
3. **Add Environment Variable:**
   - **Key**: `VITE_API_URL`
   - **Value**: Your Railway URL
4. **Redeploy**: Go to Deployments → Redeploy

## 🎯 That's It!

Your GitGenie app is now live:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

## 🔧 Alternative: Use the Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

## 🐛 Troubleshooting

### Frontend Issues
- **Build fails**: Check `frontend/package.json` dependencies
- **API calls fail**: Verify `VITE_API_URL` environment variable
- **CORS errors**: Backend needs CORS configuration

### Backend Issues
- **Deployment fails**: Check `backend/requirements.txt`
- **API key error**: Verify `OPENAI_API_KEY` environment variable
- **Health check fails**: Check `/health` endpoint

## 📞 Need Help?

1. Check the full `DEPLOYMENT.md` guide
2. Review Vercel/Railway logs
3. Test locally first with `npm run dev`

Happy deploying! 🚀 