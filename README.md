# Phase 2e — Deploy to Vercel + Install as PWA

This phase has three sub-steps:

- **2e-1** Push the project to GitHub
- **2e-2** Connect Vercel and get your live URL
- **2e-3** Install the app on your phones

Each sub-step should take ~5-10 minutes.

---

## What changed in the files

Compared to Phase 2d-fix, this update adds:

- `manifest.webmanifest` — tells browsers this is a PWA
- `sw.js` — service worker (required for install prompt to appear)
- `vercel.json` — Vercel deployment config
- `icons/` folder with 5 PNG sizes + master SVG
- `.gitignore` — excludes editor junk from version control
- Small tweaks to `index.html` (manifest link, SW registration)

**Leave `config.js` alone** — same as before, it still has your
Supabase credentials.

Copy all the new files into your `budget-app` folder, overwriting
where needed.

---

## 2e-1 — Push to GitHub

### Prerequisites
- A GitHub account (free — sign up at github.com if you don't have one)
- Git installed on Windows. Check in your terminal:
  ```
  git --version
  ```
  If that errors, download from https://git-scm.com/download/win and
  install with default options.

### Steps

1. **Create a new GitHub repo:**
   - Go to https://github.com/new
   - Repository name: `clements-budget` (or whatever you like)
   - **Visibility:** Public or Private, both work. Private is fine
     since your Supabase credentials are safely scoped by RLS.
   - Leave all the checkboxes OFF ("Initialize this repository
     with..." — we already have files)
   - Click **Create repository**
   - You'll see a page with commands — keep that tab open.

2. **Initialize git in your local `budget-app` folder:**
   Open **PowerShell** (right-click the folder → "Open in Terminal"
   also works in Windows 11). Then run these commands one by one:

   ```powershell
   cd C:\Users\<you>\Documents\budget-app
   git init
   git add .
   git commit -m "Initial commit: working budget app with realtime sync"
   ```

   You should see git list out all the files it staged, then commit
   them.

3. **Connect to the GitHub repo you just created.** GitHub's page
   shows you the exact commands — they look like:

   ```powershell
   git branch -M main
   git remote add origin https://github.com/<your-username>/clements-budget.git
   git push -u origin main
   ```

   The first time you push, GitHub may pop up a login window. Sign
   in with your GitHub account (easiest: "Sign in with your browser").

4. **Verify:** refresh your GitHub repo page. You should see all
   your files listed: `index.html`, `config.js`, `supabase-client.js`,
   `icons/`, etc.

## 2e-2 — Connect Vercel

### Steps

1. Go to https://vercel.com/signup
2. Click **Continue with GitHub** — easiest path since your code is
   already there.
3. After signup, Vercel shows "Import Git Repository."
4. Find your `clements-budget` repo, click **Import**.
5. On the "Configure Project" page:
   - **Framework Preset:** Vercel should auto-detect "Other" — leave it
   - **Root Directory:** just `./` (the default)
   - **Build Command:** leave empty (we have no build step)
   - **Output Directory:** leave empty (root is the output)
   - Click **Deploy**
6. Wait ~30 seconds. Vercel will show "Congratulations!" and give
   you a live URL like `clements-budget-abc123.vercel.app`.

### Customize the URL (optional but recommended)

1. In Vercel, click your project → **Settings** → **Domains**
2. You can set a cleaner subdomain like `clements-budget.vercel.app`
   (if it's not taken) or use any other Vercel-generated URL.

### Verify it works

1. Open the Vercel URL in Chrome.
2. You should see the login screen, sign in as you normally would.
3. All your data should load, editing should work, realtime sync
   should work.

**From here on, any time you push to GitHub's `main` branch, Vercel
auto-deploys within 30 seconds.** No manual steps needed.

## 2e-3 — Install as PWA on your phones

### On iPhone (Safari — it must be Safari, Chrome on iOS won't do it)

1. Open the Vercel URL in Safari.
2. Sign in.
3. Tap the **Share** icon (box with up arrow) at the bottom.
4. Scroll down, tap **Add to Home Screen**.
5. Tap **Add** in the top right.
6. The app now appears as an icon on your home screen. Tap it to
   launch — it runs full-screen with no browser bar, just like a
   native app.

### On Android (Chrome)

1. Open the Vercel URL in Chrome.
2. Sign in.
3. Tap the three-dot menu in the top right.
4. Tap **Add to Home screen** or **Install app**.
5. Confirm the name (default "Budget"), tap **Add**.
6. Icon appears on the home screen.

### On desktop (Chrome/Edge)

1. Open the Vercel URL.
2. In the address bar, you should see a small install icon (looks
   like a monitor with a down arrow) on the right side.
3. Click it, confirm.
4. The app installs as a standalone window with its own icon on
   your taskbar.

### Both of you need to do this individually

Send the URL to Brittany, have her install on her phone using the
same steps. Each install uses her own Supabase login, so there's no
account-switching to worry about.

---

## What's working now

You've got a real app. From either of your phones or laptops:

- Tap the icon, open directly into the app (no browser)
- Sign in once, stay signed in for weeks
- Edit anything, see it sync to the other person within ~1 second
- Full feature parity with the original Budget.html design

## Updating the app later

If you want to add a feature or fix something:

1. Edit files in your local `budget-app` folder
2. `git add . && git commit -m "describe what changed"`
3. `git push`
4. Wait ~30 seconds → Vercel deploys → both your phones get it on
   next open

No app-store submissions, no reviews, no waiting. That's the
beauty of a PWA.

## Troubleshooting

### "git: command not found"
Install Git for Windows from https://git-scm.com/download/win.

### "Permission denied" when pushing to GitHub
You need to authenticate. Easiest way: install GitHub CLI from
https://cli.github.com and run `gh auth login` — it handles the
credentials for you.

### Vercel deploys but app doesn't load
Open DevTools (F12) → Console. If you see errors about `config.js`
or missing Supabase credentials, you may have accidentally gitignored
or overwritten it. Check that `config.js` in the GitHub repo has
your actual URL and key (it's safe to commit — the publishable key
respects RLS).

### iPhone's "Add to Home Screen" button is missing
You must be in **Safari**, not Chrome or Firefox on iOS. Apple
restricts PWA installs to Safari.

### "Add to Home Screen" creates a browser shortcut, not an app
This means the manifest didn't load. Open the Vercel URL in
desktop Chrome, F12 → Application tab → Manifest — you should see
all the manifest fields listed. If empty, check the URL path to
manifest.webmanifest returns valid JSON.

### App icon looks wrong/blurry on phone
iOS caches icons aggressively. Remove the home-screen icon, clear
Safari cache (Settings → Safari → Clear History), re-install.

---

## 🎉 That's the end of the core build

You've gone from "Claude artifact I can't share" to "installable
realtime household budget app" in one week.

If you want more features later, just start a new chat and reference
this project. Things that could come next — not building now, just
a menu if you're curious:

- **CSV bank statement import** (next logical step from your original requirements)
- **Recurring transaction templates** (auto-fill monthly rent, subscriptions, etc.)
- **Trends / charts dashboard** (year-over-year spending graphs)
- **Export to Excel** (for tax prep)
- **Mobile-first layout tweaks** (the current design works but was designed for laptop)

Enjoy the app!
