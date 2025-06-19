# 🐿️ Squirrel AI Deployment Guide

## Overview
This guide will help you deploy Squirrel AI to Vercel. Since Squirrel AI has both a frontend (React) and backend (FastAPI), we'll deploy them separately for optimal performance.

## 📋 Prerequisites
- [Vercel Account](https://vercel.com)
- [GitHub Account](https://github.com)
- [Railway/Render Account](https://railway.app) (for backend)

## 🎯 Deployment Strategy

### Option 1: Recommended Setup
- **Frontend**: Vercel (React)
- **Backend**: Railway/Render (FastAPI)

### Option 2: Alternative Setup
- **Frontend**: Vercel (React)
- **Backend**: Vercel (Serverless Functions)

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
1. **Update API URL**: The frontend is already configured to use environment variables
2. **Build Test**: Ensure the frontend builds successfully
   ```bash
   cd frontend
   npm run build
   ```

### Step 2: Deploy to Vercel

#### Method A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow the prompts:
# - Set project name: squirrel-ai-frontend
# - Set build command: npm run build
# - Set output directory: dist
```

#### Method B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set the following:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Configure Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.com
```

---

## 🔧 Backend Deployment

### Option A: Railway (Recommended)

#### Step 1: Prepare Backend
1. Create `railway.json` in the root directory:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && python main.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set the root directory to `backend`
5. Add environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

### Option B: Render

#### Step 1: Create `render.yaml`
```yaml
services:
  - type: web
    name: squirrel-ai-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python main.py
    envVars:
      - key: OPENAI_API_KEY
        value: your_openai_api_key
```

#### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service

---

## 🔗 Connect Frontend to Backend

### Step 1: Get Backend URL
After deploying your backend, note the URL:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`

### Step 2: Update Frontend Environment
In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add/Update:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

### Step 3: Redeploy Frontend
```bash
vercel --prod
```

---

## 🧪 Testing Deployment

### Frontend Test
1. Visit your Vercel URL
2. Try analyzing a repository
3. Check if API calls work

### Backend Test
1. Visit `https://your-backend-url.com/docs`
2. Test the `/health` endpoint
3. Try the `/analyze` endpoint

---

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
**Solution**: Add CORS middleware to backend
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 2. Environment Variables Not Working
**Solution**: 
- Check Vercel environment variables
- Ensure variable names start with `VITE_`
- Redeploy after adding variables

#### 3. Build Failures
**Solution**:
- Check `package.json` dependencies
- Ensure all imports are correct
- Test build locally first

#### 4. API Timeout
**Solution**:
- Increase timeout in frontend
- Optimize backend response time
- Use streaming for long operations

---

## 📊 Performance Optimization

### Frontend
- Enable Vercel Edge Functions
- Use CDN for static assets
- Implement lazy loading

### Backend
- Use caching for embeddings
- Implement request queuing
- Optimize database queries

---

## 🔒 Security Considerations

### Environment Variables
- Never commit API keys
- Use Vercel's environment variable system
- Rotate keys regularly

### CORS Configuration
- Only allow specific origins
- Use HTTPS in production
- Implement rate limiting

---

## 📈 Monitoring

### Vercel Analytics
- Enable Vercel Analytics
- Monitor performance metrics
- Track user behavior

### Backend Monitoring
- Set up health checks
- Monitor API response times
- Log errors and exceptions

---

## 🎉 Success!

Your Squirrel AI application is now deployed and ready to use! 

**Frontend**: `https://your-app.vercel.app`
**Backend**: `https://your-backend-url.com`
**API Docs**: `https://your-backend-url.com/docs`

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Vercel/Railway logs
3. Test locally first
4. Check environment variables

Happy coding! 🚀 