# FIREBASE_SETUP.md — turn on cloud saves (about 10 minutes)

> **⚠️ Stay on the free Spark plan. Never upgrade to Blaze.**
> Nothing in this game needs a paid plan. If Firebase ever asks you to "Upgrade", "Modify plan" or add a billing account, say no. The free Spark plan cannot charge you. Blaze (pay-as-you-go) can.

**Without these steps the game still works:** saves stay in your browser, and Settings shows "Cloud save: not configured".
**With them:**
* Your save is also stored in Firebase, under your own anonymous account.
* You can link a Google account to carry the save between devices.

You need a Google account and about 10 minutes. The game side is already built. You only create the Firebase project and paste 6 values.

---

### 1. Create the Firebase project
1. Go to **https://console.firebase.google.com** and sign in with your Google account.
2. Click **Create a project** (or **Add project**).
3. Project name: `shinobi-auto-battler` (anything works). Click **Continue**.
4. On the Google Analytics step, switch **Enable Google Analytics** *off* (not needed). Click **Create project**.
5. ✅ **You should see:** "Your new project is ready". Click **Continue**, and you land on the project's **Project Overview** page.
   * The bottom-left corner shows **Spark** (no-cost). Leave it that way.

> **💡 Tip: "You've reached your project limit"?** Google Cloud limits how many projects an account can have, and projects you deleted still count for 30 days. You can reuse one instead:
> 1. Open **https://console.cloud.google.com/cloud-resource-manager** (Google Cloud console → **IAM & Admin → Manage resources**).
> 2. Click **Resources pending deletion** at the bottom, tick a project you no longer need, and click **Restore**.
> 3. Back in **https://console.firebase.google.com**, click **Create a project**, then the **Add Firebase to Google Cloud project** link under the name field (older consoles: pick the project from the project-name drop-down).
> 4. Choose the restored project, click **Continue** through the steps (Analytics off), and carry on from step 5 above.

### 2. Register a web app and copy its config
1. On **Project Overview**, click the **web icon `</>`** under "Get started by adding Firebase to your app". If you don't see it, click **+ Add app**, then **Web**.
2. App nickname: `Shinobi web`. **Leave "Also set up Firebase Hosting" unticked** (the game is hosted on GitHub Pages). Click **Register app**.
3. ✅ **You should see:** a code box containing `const firebaseConfig = { apiKey: "…", authDomain: "…", projectId: "…", storageBucket: "…", messagingSenderId: "…", appId: "…" };`
4. Copy those six values into a note. You'll paste them in step 7. You can find them again later under ⚙️ **Project settings** → **General** → **Your apps** → **SDK setup and configuration** → **Config**.
5. Click **Continue to console**.

### 3. Turn on Firestore (the database)
1. Direct link: **https://console.firebase.google.com/project/_/firestore**. Pick your project if asked. Or in the left menu: **Build → Firestore Database**.
2. Click **Create database**.
3. If the console asks for an **edition**, choose **Standard edition**. Click **Next**.
4. If it asks for a **Database ID**, leave it as **`(default)`**. Don't type a name: the game talks to the default database, and a named one would stay empty. Click **Next**.
5. Choose a **location** close to you (for example `nam5 (United States)` or `eur3 (Europe)`). This can't be changed later. Click **Next**.
6. Choose **Start in production mode**. Click **Create**.
7. ✅ **You should see:** the Firestore **Data** tab with an empty database ("Start collection"), and **(default)** as the database name at the top.

### 4. Paste the security rules
1. Still in **Firestore Database**, open the **Rules** tab.
2. Delete everything in the editor and paste the whole contents of **`firestore.rules`** from this repository (GitHub → Raw → select all). Don't retype it; the file is the source of truth.
3. Click **Publish**.
4. ✅ **You should see:** a "Rules published" message or a new timestamp at the top of the editor.
   * These rules mean each player can only read and write their own save (`users/{their id}/save/main`). Everything else is locked.
   * **Already had the older rules published?** Paste the new file over them and Publish again. Existing saves keep working — the game has always written the four fields the new rules check.

### 5. Turn on Anonymous and Google sign-in
1. Direct link: **https://console.firebase.google.com/project/_/authentication/providers**. Or in the left menu: **Build → Authentication**, then **Get started**.
2. On the **Sign-in method** tab, click **Anonymous**, switch **Enable** on, and click **Save**.
3. Click **Add new provider → Google**. Switch **Enable** on, choose your email as the **Project support email**, and click **Save**.
4. ✅ **You should see:** both **Anonymous** and **Google** listed with status **Enabled**.

> **⚠️ Leave anonymous account Auto clean-up OFF.** Some projects show an **Auto clean-up** option for anonymous accounts (Authentication → **Settings**). If you see it, make sure it stays **off**. Every player starts as an anonymous account, and their save is stored under that account's id. Clean-up deletes old anonymous accounts, so those players would lose their cloud save for good (only Google-linked players would keep theirs).

### 6. Allow your GitHub Pages site to sign in
1. In **Authentication**, open the **Settings** tab, then **Authorized domains**.
2. Click **Add domain**, type **`dygoma.github.io`** (your GitHub username in lower case, followed by `.github.io`), and click **Add**.
3. ✅ **You should see:** `dygoma.github.io` in the list. `localhost` is already there for local testing.

### 7. Paste the config into the game and publish
1. Open **`js/save/firebase-config.js`** in this repository.
2. Replace each `PASTE_…` placeholder with your value from step 2. Keep the quotes. For example:
   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSy...your key...",
     authDomain: "shinobi-auto-battler.firebaseapp.com",
     projectId: "shinobi-auto-battler",
     storageBucket: "shinobi-auto-battler.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123def456",
   };
   ```
3. Commit and push. You can edit the file directly on github.com with the ✏️ button and click **Commit changes**, or from a terminal:
   ```bash
   git add js/save/firebase-config.js
   ```
   ```bash
   git commit -m "Configure Firebase cloud saves"
   ```
   ```bash
   git push
   ```
4. Wait 1–2 minutes for GitHub Pages to update, then open the game and go to **Settings**.
5. ✅ **You should see:** "Cloud save: connected — Guest (anonymous)", and after your next battle, pull or level-up, "synced". In the Firebase console under **Firestore → Data**, a `users` collection appears with your save at `users/<id>/save/main`.

### 8. (Optional) Carry your save to another device
1. In the game, pick **Sign in with Google** on the start menu (or **Settings → Link Google account** while playing as a guest). On a computer a Google popup opens; on a phone the page goes to Google and comes back. Choose your account.
2. ✅ **You should see:** "Google account linked: your save now follows you." (or "Signed in as …" on the start menu the next time).
3. On the other device, open the game and pick **Sign in with Google** on the start menu with the same Google account.
4. ✅ **You should see:** the game asks **"Cloud save is newer — load it?"**. Choose **Load cloud save**.

### 9. The start menu and sign-in on phones (Session 5)
Nothing to change in the console for this. Since Session 5 the game opens on a start menu and **creates no account until the player picks "Continue as guest" or "Sign in with Google"**: a visitor who only reads the Wiki never appears under Authentication → Users.

On phones and tablets (a touch screen, or an Android/iOS browser) Google sign-in uses Firebase's **redirect** flow instead of a popup: the page leaves for `accounts.google.com`, then comes back to the game, which finishes the sign-in and goes straight in. Computers keep the popup, and fall back to the redirect if the popup is blocked. Both flows run through the same `authDomain` (`inbox-zero-480418.firebaseapp.com`) that step 6 and the API-key restriction already allow, so **no new authorized domain is needed**.

> **⚠️ Check the redirect on a real phone.** Modern browsers are phasing out third-party cookies, and Firebase's redirect flow depends on the `authDomain`'s storage being readable from `dygoma.github.io`. In Chrome for Android with the default settings it works; with **"Block third-party cookies"** on, or in Safari/Firefox with strict tracking protection, the redirect can come back signed out. If that happens the menu shows "Something went wrong" and the player can still continue as a guest. The fixes Firebase documents (serving `/__/auth/` from the game's own domain, or a custom `authDomain`) both need the site and the auth helper on one domain, which GitHub Pages cannot do for a project site; a custom domain for the game would allow it. Until then, it is a known limit, not a console setting.

---

## Security

**Why the web API key is public.** A Firebase **web** API key isn't a password — it only identifies *which project* the game talks to, so every visitor's browser gets it. GitHub secret scanning flags it because it looks like a Google key, but no rotation is needed. The real secrets are service-account JSON files, and this project has none.

**What `firestore.rules` enforces.** One document per player, at `users/{uid}/save/main`, owner-only via `request.auth.uid` (anonymous and Google-linked accounts share a uid, so linking is safe). Writes must have exactly the fields `payload`, `saveVersion`, `updatedAt`, `serverUpdatedAt` — with matching types and a 500,000-character cap on `payload`. Delete is allowed for the owner only.

**Checklist: restrict the browser key in Google Cloud Console**
1. Open **https://console.cloud.google.com/apis/credentials** for project `inbox-zero-480418`.
2. Open **"Browser key (auto created by Firebase)"**.
3. **Application restrictions → Websites:** add `dygoma.github.io/*`, `localhost/*` (add `localhost:*/*` too if local testing breaks), and `inbox-zero-480418.firebaseapp.com/*` (**required** — the Google sign-in popup runs from the authDomain).
4. **API restrictions → Restrict key** to only: **Identity Toolkit API**, **Token Service API**, **Cloud Firestore API**. Storage/Analytics/Realtime DB/Functions/Messaging are unused (the `storageBucket` in the config is unused too).
5. Save, wait a few minutes, then test **anonymous connect** and **Link Google account**.

**Optional:** turn on Firebase App Check to curb quota abuse, and keep anonymous **Auto clean-up** off (see the warning in step 5 above).

## Troubleshooting
| Message in Settings / browser console | Fix |
|---|---|
| `auth/unauthorized-domain` | Step 6: add your `…github.io` domain. |
| `auth/operation-not-allowed` | Step 5: enable Anonymous (and Google for linking). |
| `permission-denied` / `Missing or insufficient permissions` | Step 4: publish the rules exactly as shown. |
| Google popup closes immediately | Allow pop-ups for the site, then try again (the game also falls back to the redirect flow when the popup is blocked). |
| On a phone, "Sign in with Google" goes to Google and comes back signed out | Third-party cookies or storage are blocked for `inbox-zero-480418.firebaseapp.com` (step 9). Allow them for this site, or continue as a guest. |
| The start menu says "Couldn't reach cloud save" | Offline, or the Firebase scripts (gstatic.com) are blocked. **Play offline** keeps the save in the browser; **Try again** reconnects. |
| Still "not configured" | Step 7: every `PASTE_…` placeholder must be replaced, and the page reloaded after GitHub Pages updates. |
| Saves write but nothing appears under **Firestore → Data** | Step 3: the database must be the one named **(default)**. Delete a database created with a custom Database ID and create it again with `(default)`. |
| "You've reached your project limit" when creating the project | Step 1 tip: restore a pending-deletion project and use **Add Firebase to Google Cloud project**. |
| A guest player's cloud save disappeared after a few weeks | Step 5: turn anonymous account **Auto clean-up** off. |

**Free-tier limits (Spark):**
* Firestore: 50,000 reads and 20,000 writes per day.
* The game writes at most once every few seconds while you play, and only after changes, so a single player stays far below these limits.
