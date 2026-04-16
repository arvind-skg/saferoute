# SafeRoute Deployment Guide (Render.com)

This guide walks you through hosting your SafeRoute application as a single, performant web service on Render.

## 1. Prepare GitHub Repository
Ensure all your local changes are pushed to your GitHub repository:
```bash
git add .
git commit -m "chore: prepare monolithic deployment for Render"
git push origin main
```

## 2. Deploy on Render.com
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. **Configuration Settings**:
   - **Name**: `saferoute` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Click **Deploy Web Service**.

## 3. Setup Uptime Monitor (Bypass Sleep Mode)
Render's free tier spins down after 15 minutes of inactivity. Use **UptimeRobot** to keep it awake:
1. Go to [UptimeRobot.com](https://uptimerobot.com/) and create a free account.
2. Click **Add New Monitor**.
3. **Monitor Type**: `HTTP(s)`
4. **Friendly Name**: `SafeRoute Keeper`
5. **URL (or IP)**: Paste your Render Web Service URL (e.g., `https://saferoute.onrender.com/api/health`).
6. **Monitoring Interval**: `Every 10 minutes` (This keeps the server from sleeping).
7. Save the monitor.

## 4. Troubleshooting
- **Database Reset**: Remember that the SQLite database resets on every deploy. 
- **White Screen**: If you see a blank page, check the Render logs to ensure `npm run build` completed successfully and the `dist` folder was created.
- **API Errors**: Ensure you are using the relative `/api` paths in your frontend code (already handled in this update).

---
**SafeRoute is now ready for world-wide access!** 🛡️
