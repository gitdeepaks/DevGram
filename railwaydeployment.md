# Deploy DevGram to Railway

This guide walks you through deploying the DevGram backend API to [Railway](https://railway.com/).

## Prerequisites

- A [Railway](https://railway.com/) account (sign up with GitHub)
- GitHub repository with your DevGram code
- MongoDB database (MongoDB Atlas free tier or Railway MongoDB plugin)
- Razorpay account (for payments)

---

## Step 1: Prepare Your Application for Railway

### 1.1 Add a Start Script

Add a `start` script to your `package.json` so Railway knows how to run your app:

```json
"scripts": {
  "start": "bun run src/index.js",
  "dev": "bun --watch src/index.js",
  ...
}
```

### 1.2 Use Dynamic Port

Railway assigns a `PORT` environment variable at runtime. Update `src/index.js` to use it:

```javascript
// Change this:
app.listen(4100, () => {

// To this:
const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`server is running on port:${PORT}`);
});
```

### 1.3 Update CORS Origins (Optional)

Add your Railway URL to CORS if your frontend will call it from a different domain:

```javascript
origin: ["http://localhost:5173", "http://localhost:5174", "http://devfinderapp.com", "https://your-app.up.railway.app"],
```

---

## Step 2: Create a Railway Project

1. Go to [railway.com](https://railway.com/) and sign in with GitHub.
2. Click **New Project**.
3. Select **Deploy from GitHub repo**.
4. Choose your DevGram repository.
5. Railway will auto-detect it as a Node.js project.

---

## Step 3: Configure Build (Optional)

Railway uses Nixpacks by default and usually auto-detects Bun. For better Bun support, add a `railway.json` in your project root:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  }
}
```

If needed, in **Settings** → **Build & Deploy** you can set:
- **Start Command:** `bun run start` or `bun run src/index.js`

---

## Step 4: Add MongoDB Database

### Option A: MongoDB Atlas (Recommended for production)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Get your connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/devgram`).
3. Add it as an environment variable in Railway (Step 6).

### Option B: Railway MongoDB Plugin

1. In your Railway project, click **+ New**.
2. Select **Database** → **MongoDB**.
3. Railway will provision MongoDB and create a `MONGO_URL` variable.
4. Use this variable or map it to `MONGODB_URI` (see Step 6).

---

## Step 5: Add Environment Variables

In your Railway service, go to **Variables** and add:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/devgram` |
| `JWT_SECRET` | Secret for JWT token signing | A long random string |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | From Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | From Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification | From Razorpay Webhooks settings |
| `NODE_ENV` | Environment | `production` |

If you used Railway MongoDB, you may need to add:

```
MONGODB_URI=${{MongoDB.MONGO_URL}}
```

Or manually copy the `MONGO_URL` value into `MONGODB_URI`.

---

## Step 6: Generate a Public Domain

1. In your service, go to **Settings** → **Networking**.
2. Click **Generate Domain**.
3. Railway will create a URL like `your-app-name.up.railway.app`.

---

## Step 7: Deploy

1. Push your code changes (start script, port, CORS) to GitHub.
2. Railway will detect the push and start a new deployment.
3. Check **Deployments** for build and runtime logs.
4. Once deployed, your API will be available at the generated domain.

---

## Step 8: Configure Razorpay Webhook (for payments)

1. In [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Settings** → **Webhooks**.
2. Add a new webhook URL: `https://your-app-name.up.railway.app/payment/webhook`
3. Select events: `payment.captured`, `payment.failed`, etc.
4. Copy the **Webhook Secret** and set it as `RAZORPAY_WEBHOOK_SECRET` in Railway.

---

## Troubleshooting

### Build fails with "bun: command not found"

Railway may default to Node.js. Add a `nixpacks.toml` in the project root:

```toml
[phases.setup]
nixPkgs = ["bun"]

[phases.install]
cmds = ["bun install"]

[start]
cmd = "bun run src/index.js"
```

### Database connection fails

- Confirm `MONGODB_URI` is set correctly.
- For Atlas: add Railway’s IP range or allow `0.0.0.0/0` in Network Access.
- Ensure the user has read/write permissions.

### App crashes or doesn’t respond

- Check logs in Railway dashboard.
- Confirm the app uses `process.env.PORT`.
- Ensure all required env vars are set.

---

## Useful Links

- [Railway Docs](https://docs.railway.com/)
- [Railway Discord](https://discord.gg/railway)
- [Deploy Bun on Railway](https://bun.com/docs/guides/deployment/railway)
