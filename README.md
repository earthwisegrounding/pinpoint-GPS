# PINPOINT

A phone-location prank with a staged satellite zoom from Washington to Bremerton, followed by a customizable media reveal. No actual phone tracking or phone-number collection.

- Site: https://earthwisegrounding.github.io/pinpoint-prank/
- Private admin entry: https://earthwisegrounding.github.io/pinpoint-prank/admin/
- **[Admin and Supabase setup](SETUP.md)**

The default reveal works without Supabase. Secure login and shared uploads require the one-time setup above. No credentials are embedded in this repository.

## Local preview

```sh
python3 -m http.server 4173 --directory dist
```

Visit http://localhost:4173. Plain HTML, CSS, and JavaScript; no build step. The `dist` folder is the complete public site. Pushes to `main` deploy that folder through GitHub Actions.
