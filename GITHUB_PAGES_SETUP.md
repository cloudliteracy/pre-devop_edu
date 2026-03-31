# GitHub Pages Deployment Setup

## ✅ Files Created

1. **`.github/workflows/deploy.yml`** - GitHub Actions workflow
2. **`frontend/public/404.html`** - Client-side routing support
3. **`frontend/package.json`** - Updated with `homepage` field
4. **`frontend/public/index.html`** - Updated with redirect script

## 🚀 Setup Instructions

### Step 1: Enable GitHub Pages

1. Go to your GitHub repo
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select:
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **(root)**
4. Click **Save**

### Step 2: Push to Main Branch

```bash
git add .
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

### Step 3: Monitor Deployment

1. Go to **Actions** tab in your GitHub repository
2. Watch the "Deploy to GitHub Pages" workflow run
3. Wait for green checkmark (usually 2-5 minutes)

### Step 4: Access Your Live Site

Your site will be available at:
```
https://<your-username>.github.io/<repository-name>/
```

Example:
- If username: `johndoe`
- If repo: `cloudliteracy_edu`
- URL: `https://johndoe.github.io/cloudliteracy_edu/`

## 🔧 What the Workflow Does

1. **Triggers**: Automatically runs on every push to `main` branch
2. **Checkout**: Gets your latest code
3. **Setup Node.js**: Installs Node.js v18
4. **Install Dependencies**: Runs `npm ci` in frontend directory
5. **Build**: Creates optimized production build (`npm run build`)
6. **Deploy**: Pushes build files to `gh-pages` branch

## ⚙️ Configuration Details

### Homepage Field
Added to `frontend/package.json`:
```json
"homepage": "."
```
This ensures assets load correctly on GitHub Pages.

### Client-Side Routing
- **404.html**: Redirects all routes to index.html
- **index.html**: Restores the correct route after redirect
- Enables React Router to work on GitHub Pages

### Environment Variables
The workflow uses `CI=false` to prevent build warnings from failing the deployment.

## 🔄 Custom Domain (Optional)

If you have a custom domain:

1. Update `.github/workflows/deploy.yml`:
```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./frontend/build
    cname: yourdomain.com  # Replace with your domain
```

2. In GitHub Settings → Pages:
   - Add your custom domain
   - Enable "Enforce HTTPS"

3. Configure DNS:
   - Add CNAME record pointing to `<username>.github.io`

## 🐛 Troubleshooting

### Build Fails
- Check **Actions** tab for error logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### 404 Errors on Routes
- Ensure `404.html` exists in `frontend/public/`
- Verify redirect script in `index.html`
- Clear browser cache

### Assets Not Loading
- Check `homepage` field in `package.json`
- Verify build output in Actions logs
- Ensure `gh-pages` branch exists

### Backend API Calls
GitHub Pages only hosts static files. For backend:
- Deploy backend separately (Heroku, AWS, Railway, etc.)
- Update API URLs in frontend code
- Consider environment variables for different environments

## 📝 Notes

- **First deployment** may take 5-10 minutes
- **Subsequent deployments** are faster (2-3 minutes)
- **GitHub Pages is free** for public repositories
- **HTTPS is automatic** with GitHub Pages
- **No server-side code** - frontend only

## 🎯 Next Steps

1. ✅ Push code to trigger first deployment
2. ✅ Verify site loads at GitHub Pages URL
3. ✅ Test all routes work correctly
4. ✅ Deploy backend to separate hosting service
5. ✅ Update frontend API URLs to point to deployed backend
6. ✅ (Optional) Configure custom domain

---

**Your GitHub Actions workflow is ready! Push to `main` to deploy.** 🚀

======