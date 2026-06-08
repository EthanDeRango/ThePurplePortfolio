# Purple Portfolio — From File to Live Website

This guide takes you from the JSX artifact to a working website at a real URL. No prior web-development experience required. Estimated time: 30–60 minutes the first time.

---

## What You'll End Up With

A live website (e.g. `purpleportfolio.vercel.app` or your own domain) running Purple Portfolio. When you edit the code and push it, the site auto-updates in about 30 seconds. Free hosting, no backend, no database — the app runs entirely in the visitor's browser, exactly as designed.

---

## Prerequisites

You need two things installed on your computer. Both are free and take a few minutes.

### 1. Node.js (the engine that runs JavaScript tooling)

Go to **https://nodejs.org** and download the **LTS** version (not "Current"). Run the installer, accept all defaults.

To verify it worked, open a terminal:
- **Mac**: open the app called "Terminal" (in Applications → Utilities)
- **Windows**: open "Command Prompt" or "PowerShell" (search in Start menu)

Type this and press Enter:

```
node --version
```

You should see something like `v22.x.x`. If you see an error, restart your terminal and try again (the installer sometimes needs a fresh window).

### 2. A code editor

Download **VS Code** from **https://code.visualstudio.com** — it's the standard and free. You can use any text editor, but VS Code makes everything easier.

---

## Step 1: Create the Project Folder

Create a folder somewhere on your computer called `purple-portfolio`. Inside it, you need exactly these files:

```
purple-portfolio/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── src/
    ├── main.jsx
    └── PurplePortfolio.jsx
```

**I've provided all of these files in this delivery.** Here's how to set them up:

1. Download all the files I've attached (the project zip or individual files).
2. Put them in your `purple-portfolio` folder exactly as shown above.
3. The `PurplePortfolio.jsx` file goes inside the `src/` subfolder.

If you're copying files manually, make sure:
- `package.json`, `index.html`, `vite.config.js`, and `.gitignore` are in the ROOT of the folder (not inside `src/`)
- `main.jsx` and `PurplePortfolio.jsx` are inside the `src/` subfolder

---

## Step 2: Install Dependencies

Open your terminal and navigate to the project folder:

```
cd path/to/purple-portfolio
```

For example, if you put the folder on your Desktop:
- **Mac**: `cd ~/Desktop/purple-portfolio`
- **Windows**: `cd C:\Users\YourName\Desktop\purple-portfolio`

Then run:

```
npm install
```

This downloads React, Lucide icons, and the build tool (Vite) into a `node_modules` folder. It takes 30–60 seconds and creates a `package-lock.json` file. Both are normal.

---

## Step 3: Test It Locally

Still in the same terminal, run:

```
npm run dev
```

You'll see output like:

```
  VITE v5.4.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser. You should see Purple Portfolio running — the full planner, dashboard, everything. Click through it to make sure it works.

To stop the local server, press `Ctrl+C` in the terminal.

---

## Step 4: Put It on GitHub

GitHub stores your code online and connects to the hosting service. If you don't have an account, sign up at **https://github.com** (free).

### Option A: Using VS Code (easiest)

1. Open the `purple-portfolio` folder in VS Code (File → Open Folder).
2. Click the **Source Control** icon in the left sidebar (it looks like a branching line).
3. Click **"Initialize Repository"**.
4. In the message box at the top, type `Initial commit` and click the checkmark (✓) to commit.
5. Click **"Publish Branch"** — VS Code will ask you to sign into GitHub and create a repository. Make it **Public** (Vercel's free tier needs public repos, or you can use a paid plan for private).

### Option B: Using the terminal

```
git init
git add .
git commit -m "Initial commit"
```

Then go to **https://github.com/new**, create a repository called `purple-portfolio` (public), and follow GitHub's instructions to push. They'll look like:

```
git remote add origin https://github.com/YOUR-USERNAME/purple-portfolio.git
git branch -M main
git push -u origin main
```

---

## Step 5: Deploy on Vercel (Free)

Vercel is a hosting platform that auto-deploys from GitHub. It's free for personal projects.

1. Go to **https://vercel.com** and sign up with your GitHub account.
2. Click **"Add New Project"** (or **"Import Project"**).
3. It will show your GitHub repositories — find `purple-portfolio` and click **Import**.
4. Vercel auto-detects it's a Vite project. You don't need to change any settings.
5. Click **Deploy**.
6. Wait about 60 seconds. Vercel will build the project and give you a URL like:

```
https://purple-portfolio-xxxx.vercel.app
```

That's your live website. Open it — Purple Portfolio is now on the internet.

---

## Step 6: Custom Domain (Optional)

If you own a domain (e.g. `purpleportfolio.ca`):

1. In Vercel, go to your project → **Settings** → **Domains**.
2. Type your domain and click **Add**.
3. Vercel will tell you to add a DNS record at your domain registrar (where you bought the domain). It's usually a CNAME record pointing to `cname.vercel-dns.com`.
4. Once the DNS propagates (5 minutes to a few hours), your custom domain works with HTTPS automatically.

If you don't have a domain yet, the `.vercel.app` URL works perfectly fine to share.

---

## How to Make Changes Going Forward

This is the workflow every time you want to edit something:

1. **Edit the file** — open `src/PurplePortfolio.jsx` in VS Code, make your changes.
2. **Test locally** — run `npm run dev` and check in your browser at `localhost:5173`.
3. **Push to GitHub** — in VS Code's Source Control panel, stage your changes, write a commit message (e.g. "Updated tax rates for 2027"), and push.
4. **Auto-deploy** — Vercel detects the push and rebuilds your site in about 30 seconds. The live URL updates automatically.

That's it. Edit → test → push → live.

---

## Troubleshooting

**"npm: command not found"**
Node.js isn't installed or your terminal needs to be restarted. Close and reopen the terminal after installing Node.

**"npm install" shows errors**
Make sure you're inside the `purple-portfolio` folder (the one containing `package.json`). Run `ls` (Mac) or `dir` (Windows) to check.

**The page is blank in the browser**
Open the browser's developer console (right-click → Inspect → Console tab). Look for red error messages — they'll tell you what's wrong, usually a missing file or import.

**Vercel build fails**
Click into the deployment in Vercel's dashboard to see the build log. The most common cause is a file not committed to GitHub. Make sure all files (especially `.gitignore` and `vite.config.js`) are in the repo.

**"Module not found: lucide-react"**
Run `npm install` again. This means the dependencies weren't fully installed.

---

## Project Structure Explained

| File | What it does |
|---|---|
| `package.json` | Lists your project's dependencies (React, Lucide, Vite) and scripts |
| `vite.config.js` | Tells Vite to use the React plugin for JSX |
| `index.html` | The single HTML page that loads your app |
| `src/main.jsx` | The 5-line entry point that renders PurplePortfolio into the page |
| `src/PurplePortfolio.jsx` | The entire app — all 2,500 lines of it |
| `.gitignore` | Tells Git to skip `node_modules` and build output (they're regenerated) |
| `node_modules/` | Auto-generated by `npm install` — never edit or commit this |
| `dist/` | Auto-generated by `npm run build` — this is what Vercel serves |

---

## Annual Maintenance

Purple Portfolio's tax figures are for the **2026 tax year**. Each year you'll want to:

1. Update `TAX_CONFIG` in `PurplePortfolio.jsx` with new bracket thresholds, TFSA annual amounts, CPP/EI maximums, etc. (Sources are noted inline.)
2. Set `DEV = true` on line 39, run `npm run dev`, and open the browser console — the self-test will confirm all 11 checks pass with the new figures.
3. Set `DEV` back to `false`, commit, push. The site updates in 30 seconds.

---

## What This Doesn't Include (Yet)

- **Data persistence**: Numbers reset on page refresh. For saved plans, you'd need a backend (database + auth). The current privacy-first design ("nothing stored or sent") is a feature, not a limitation — but it's worth deciding whether to add accounts eventually.
- **Analytics**: No tracking is included. If you want to know how many people use it, add a privacy-respecting tool like Plausible or Fathom.
- **SEO / social sharing**: The `index.html` has a basic title and description. For richer social-media previews, add Open Graph meta tags.
