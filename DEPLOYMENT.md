# Baaje Electronics E-commerce

## Deployment Instructions

### Backend Deployment (Railway)

1. Create a Railway account at https://railway.app
2. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```
3. Login to Railway:
   ```bash
   railway login
   ```
4. Navigate to the backend directory:
   ```bash
   cd backend
   ```
5. Initialize Railway project:
   ```bash
   railway init
   ```
6. Deploy the backend:
   ```bash
   railway up
   ```
7. After deployment, get your Railway app URL from the Railway dashboard.

### Frontend Deployment (Netlify)

1. Create a Netlify account at https://www.netlify.com
2. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
3. Login to Netlify:
   ```bash
   netlify login
   ```
4. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
5. Update `.env.production` with your Railway backend URL:
   ```
   REACT_APP_API_URL=https://your-railway-app-url.railway.app/api
   ```
6. Build the frontend:
   ```bash
   npm run build
   ```
7. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

### Backend (Railway)
- `PORT`: Set automatically by Railway
- `HOST`: Set automatically by Railway
- `JWT_SECRET`: Your JWT secret key (set in Railway dashboard)

### Frontend (Netlify)
- `REACT_APP_API_URL`: Your Railway backend API URL

## Important Notes

1. Make sure to add the JWT_SECRET environment variable in the Railway dashboard
2. Update the CORS settings in the backend if needed
3. Configure your domain in Netlify if you want to use a custom domain
4. The SQLite database will be created automatically on first run