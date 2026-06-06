# 🚀 DEPLOY IN 5 MINUTES

**Status**: Code ready. All tests passing. All security fixes applied.

**You need:**
- GitHub credentials (push access)
- Vercel account (or your deployment platform)
- 5 minutes

---

## ⚡ STEP 1: Push Code to GitHub (2 min)

```bash
# From your project directory:
cd "/c/Users/WILFRIED/OneDrive - Gravel Ivoire/Bureau/immo"

# Verify everything is committed
git status
# Should show: "Your branch is ahead of 'origin/master' by 21 commits"

# Push to GitHub
git push origin master
```

**Expected output:**
```
Counting objects: 100% (150/150)
Writing objects: 100% (50/50)
* [new branch] master -> master
```

**If you get auth error:**
```bash
# Option 1: Use SSH key (recommended)
git remote set-url origin git@github.com:Yobed/immo.git
git push origin master

# Option 2: Use personal access token
# https://github.com/settings/tokens
# Create token, then use as password when prompted
```

---

## ⚡ STEP 2: Open Vercel Dashboard (30 sec)

1. Go to https://vercel.com/dashboard
2. Find your project "immo" or "immo-ci"
3. Click on it

---

## ⚡ STEP 3: Trigger Deployment (30 sec)

**Option A: Automatic (Recommended)**
- Vercel automatically deploys when you push to GitHub
- Wait 2-3 minutes for green checkmark
- Your site is live at `https://immo-ci.vercel.app` (or your custom domain)

**Option B: Manual**
1. Click "Deploy" button in Vercel dashboard
2. Select branch: `master`
3. Click "Deploy"

---

## ⚡ STEP 4: Set Environment Variables (1 min)

1. In Vercel dashboard, go to **Settings → Environment Variables**
2. Add these 6 variables (get values from Supabase + Cloudinary dashboards):

```
NEXT_PUBLIC_SUPABASE_URL       = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJxxxxxxx.xxxxx.xxxxx
SUPABASE_SERVICE_ROLE_KEY      = eyJxxxxxxx.xxxxx.xxxxx
CLOUDINARY_CLOUD_NAME          = your-cloud-name
CLOUDINARY_API_KEY             = xxxxxxxxxxxxx
CLOUDINARY_API_SECRET          = xxxxxxxxxxxxx
```

3. Optional but recommended:
```
NEXT_PUBLIC_GA_ID              = G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID      = 1234567890
NEXT_PUBLIC_SITE_URL           = https://immo-ci.vercel.app
```

4. Click "Save" for each variable

---

## ⚡ STEP 5: Wait for Green Checkmark (1-2 min)

1. Go to **Deployments** tab
2. Watch the status: `Building... → Ready`
3. When green ✅, click "Visit" button

---

## ✅ POST-DEPLOY VERIFICATION (2 min)

```javascript
// Open browser DevTools (F12) and test:

// Test 1: Cookie Consent appears
// → Should see banner at bottom on first visit
localStorage.removeItem('cookie-consent')
location.reload()
// → Banner should appear

// Test 2: GA4 blocked without consent
// → window.gtag should be undefined until "Accept"
console.log(window.gtag) // undefined or function?

// Test 3: Auth works
// → Try accessing /biens without login
// → Should redirect to /auth/login

// Test 4: SEO schema
// → Go to property page (e.g., /biens/some-id)
// → Right-click → View Page Source
// → Search for "JSON-LD" or "schema.org"
// → Should see Property schema in <script> tag
```

---

## 🎯 FINAL CHECKLIST

- [ ] `git push origin master` succeeded
- [ ] Vercel shows **green checkmark** on deployment
- [ ] Environment variables set (6 required + optionals)
- [ ] Visit production URL: works without errors
- [ ] Cookie consent banner visible on first visit
- [ ] No 500 errors in browser console
- [ ] Property pages load correctly
- [ ] Google Rich Results shows schema (https://search.google.com/test/rich-results)

---

## 🆘 TROUBLESHOOTING

### Build fails on Vercel
**Check**: Environment variables are set
```bash
# Verify in Vercel Settings → Environment Variables
# All 6 REQUIRED vars must be present
```

### "Cannot find module" error
**Fix**: Run locally first
```bash
npm run build
npm run type-check
```

### GA4 not firing
**Check**: Cookie consent was accepted
```javascript
// In DevTools console:
localStorage.getItem('cookie-consent')
// Should return: "accepted"
```

### Auth returns 401
**Check**: Supabase is accessible
```javascript
// Check Supabase credentials in .env.example
// Verify keys are correct in Vercel dashboard
```

---

## 📞 SUPPORT

If stuck, check in order:
1. **LAUNCH_CHECKLIST.md** — Full verification guide
2. **Vercel Logs** — Click "View Logs" on failed deployment
3. **Browser Console** — F12 → Console tab for JavaScript errors

---

## ✨ YOU'RE LIVE!

Once the green checkmark appears on Vercel:

```
🎉 Your app is live at https://immo-ci.vercel.app
✅ GDPR compliant
✅ All security fixes applied
✅ SEO optimized
✅ Production-ready
```

**Total time to production: ~5 minutes**

---

**Questions?** Check `LAUNCH_CHECKLIST.md` for detailed steps.
