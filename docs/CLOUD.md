# Cloud copy (optional)

**English** | [Русский](CLOUD.ru.md)

The trainer works without the cloud: double-click `trainer/index.html`, progress stays in the browser. The cloud is for studying on both your phone and your computer with shared progress.

How it works: Cloudflare Pages serves the `trainer/` folder, Cloudflare Access protects the site with an email code login, and the `/api/progress` function stores progress in KV and merges changes from different devices (`trainer/merge.js`). Everything fits in the free tier.

> **Course materials usually may not be published.** The trainer lives only at the protected address. The main address of the Pages project stays public, so a placeholder is served there.

## Setup

1. Copy `assets/cloud/` into the project folder next to `trainer/` (you get `cloud/wrangler.toml`, `cloud/functions/`, `cloud/placeholder/`).
2. `npx wrangler login`.
3. Create the progress store: `npx wrangler kv namespace create progress` and put its `id` into `cloud/wrangler.toml`. Set `name` — the project name — there too.
4. Create the Pages project and deploy the placeholder to the main address:
   ```bash
   cd cloud && npx wrangler pages project create <name> --production-branch main
   npx wrangler pages deploy placeholder --branch main
   ```
5. In the Cloudflare dashboard: Workers & Pages → project → Settings → **Enable access policy** (Preview deployments). An Access application for `*.<name>.pages.dev` appears. In its policy, allow only your own email.
6. In Zero Trust → Access → Applications, open that application and copy the **Application Audience (AUD) Tag** into `AUD`, and the team name (`<team>.cloudflareaccess.com`) into `TEAM` in `cloud/wrangler.toml`.
7. Deploy the trainer: from the project folder, `bash ~/.claude/skills/study-quiz/scripts/deploy.sh`. The script deploys to the `app` branch (`https://app.<name>.pages.dev`) and checks that the address is closed without login and that the trainer is not on the main address.

After any change in `trainer/`, run `deploy.sh` again. Progress syncs by itself (`trainer/sync.js`): after answers, when you return to the tab and on start. When the file is opened by double-click, there is no sync.
