# Days Lived

A React + Vite app. Enter your date of birth to see days lived, exact age,
a next-birthday countdown and a glowing "lap around the sun" dial.

## Run locally

    npm install
    npm run dev

Open the URL shown in the terminal (usually http://localhost:5173).

## Push to GitHub

1. Create an empty repository on github.com (no README, no .gitignore).
2. In this folder run:

       git init
       git add .
       git commit -m "Initial commit"
       git branch -M main
       git remote add origin https://github.com/<your-username>/<your-repo>.git
       git push -u origin main

## Deploy

**GitHub Pages (automatic)**
1. In the repo go to Settings → Pages.
2. Under "Build and deployment", set Source to **GitHub Actions**.
3. Push to `main` (or run the workflow from the Actions tab). The site goes live at
   `https://<your-username>.github.io/<your-repo>/`.

**Vercel**: import the repo at vercel.com/new. Settings are read from `vercel.json`.

**Netlify**: import the repo at app.netlify.com. Settings are read from `netlify.toml`.

## Build manually

    npm run build
    npm run preview

The production files are in `dist/`.
