# Agent Orchestrator daily player

Open `index.html` in a browser, or serve this folder with any static web server.

## Deploy on Vercel

Import this folder as a new Vercel project. It has no build step: leave the framework preset as **Other**, leave the build command empty, and deploy from the project root. The YouTube player needs a hosted `https://` site, so use the Vercel URL rather than a `file://` preview for playback.

## Daily images and playlists

In `app.js`, each day in `WEEK` has:

- The seven supplied daily images are already set in `assets/backgrounds/`.
- The seven supplied YouTube playlist IDs are already set in `app.js`.

The browser's own timezone controls the day and time. The page checks every second; at a local midnight it crossfades the background, fades the active song out, then loads and fades in the new day's YouTube playlist. If nothing is playing at the changeover, the player remains paused. YouTube requires the listener's first press of Play before audio may begin.
