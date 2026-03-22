# Map Research

Small React + Vite app for tracking a 1000x1000 map, found objects, empty runs, and the next suggested 25x25 search zone.

Without Firebase config, the app falls back to browser local storage so you can still use it immediately.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the Firebase template:

   ```bash
   cp .env.example .env.local
   ```

3. Fill the Vite Firebase variables in `.env.local`.

4. Run the app:

   ```bash
   npm run dev
   ```

## GitHub Pages

This repo is configured to deploy with GitHub Actions to GitHub Pages.

1. Push the project to GitHub.
2. In the repository, go to `Settings -> Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Make sure your default branch is `main`.
5. Add these repository secrets under `Settings -> Secrets and variables -> Actions`:

   ```txt
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

6. Push to `main` or run the `Deploy to GitHub Pages` workflow manually from the `Actions` tab.

The Vite `base` path is resolved automatically during GitHub Actions builds from `GITHUB_REPOSITORY`, so the app works both locally at `/` and on Pages at `/<repo>/`.

If your Pages URL is `https://<user>.github.io/<repo>/`, the deployed site will be:

```txt
https://<user>.github.io/<repo>/
```

## Firestore

Create a `positions` collection. Each document stores:

- `x`: number
- `y`: number
- `status`: `"found"` or `"empty"`
- `item`: string or `null`
- `note`: string
- `createdAt`: server timestamp

Example Firestore rules for a private prototype:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /positions/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Tighten those rules before using this beyond a quick internal tool.
