# Enable your private reveal studio

The site works immediately with its included prank video. Complete this one-time setup to enable email/password sign-in and shared uploads. GitHub Pages serves the website; Supabase handles authentication and media storage.

## 1. Create a Supabase project

Visit https://supabase.com/dashboard and create a project. Keep the database password private. You do not need to put it in this website.

## 2. Create your admin account

In **Authentication → Users → Add user → Create new user**, create the account with the email address and password you specified in our conversation. Enable **Auto Confirm User**. The password is intentionally absent from the repository and website files.

Disable public signups in **Authentication → Sign In / Providers → Allow new users to sign up**. Leave the Email provider enabled. The site has no public signup form, and server-side policies restrict all writes to your admin user ID.

## 3. Set up secure storage

Open the SQL Editor and paste the entire contents of [supabase/setup.sql](supabase/setup.sql). Replace `YOUR_ADMIN_EMAIL` with your admin email, then run the script. Run it after creating the admin user. It creates the public reveal bucket, the current-reveal record, and policies that permit only your admin account to upload, replace, or delete media.

The script can be rerun. Use a project dedicated to this site, or verify there are no existing permissive policies for the same tables/bucket. Media is public because prank recipients need to view it; admin sign-in and upload permissions are private.

## 4. Connect your website

Copy your **Project URL** and **publishable API key** from the project Connect dialog or project settings. The legacy **anon** key also works. Do not use a service-role key, secret key, database password, or admin password.

Edit [dist/config.js](dist/config.js):

```js
window.PINPOINT_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseKey: 'YOUR_PUBLISHABLE_KEY'
};
```

Commit the change to the `main` branch. GitHub Actions automatically republishes the website. These two values are designed to be public; database and storage policies enforce authorization.

Set the Supabase Auth **Site URL** to `https://earthwisegrounding.github.io/pinpoint-GPS/`.

## 5. Sign in and upload

Visit **https://earthwisegrounding.github.io/pinpoint-GPS/admin/**. Sign in with your admin email and password. Choose your media, preview it, then click **Publish reveal**. You can also restore the included default video. No link to the admin page appears on the public page.

Supported: JPG, PNG, GIF, WebP, MP4, WebM, MP3, WAV, and OGG, up to 50 MB. For best phone compatibility, use MP4 with H.264 video and AAC audio. Convert iPhone MOV/HEIC files before uploading. Videos try to play with sound, then fall back to muted playback when browser autoplay rules require it; native playback controls remain available.

The latest published reveal applies to everyone. People who already opened the page may need to reload to receive a new reveal. A failed upload keeps the previous reveal. The admin session is held in memory: reloading the admin page requires signing in again, and expired sessions require another sign-in.

## Check your setup

- While signed out, open the public page and enter `(360) 555-0123`. It should end with your uploaded media.
- Sign in, publish a second file, and check from a separate browser/private window.
- Sign out; you should no longer see the upload interface.
- In Supabase, verify only your user ID is present in `reveal_admins`.
- If sign-in succeeds but uploads fail, rerun the SQL script and check the 50 MB limit and supported file types.

## How the prank works

The site plays an approximately 13-second sequence using real satellite imagery: Washington → Western Washington → Kitsap County → Bremerton → a fixed public waterfront target. It does not query phone ownership, track devices, access browser geolocation, or infer a private home address. The `360`/`564` area-code label is a broad regional cue only. Other valid US numbers use the same staged Washington sequence. Phone numbers are neither saved nor transmitted; only the map tiles and current reveal are requested from external services.

The reveal explicitly explains that no phone was tracked. A small entertainment-simulation disclosure is present on the initial page. If satellite imagery fails, the sequence continues with an availability notice; if custom media cannot be fetched or played, the included video or a text reveal is used.

## Reference documentation

- [GitHub Pages is static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Washington area-code information](https://www.utc.wa.gov/regulated-industries/utilities/telecommunications/consumer-topics/area-codes)

Satellite imagery is credited on the map to Esri and its imagery contributors. Leaflet is bundled locally under its BSD license in `dist/vendor/LEAFLET-LICENSE.txt`.
