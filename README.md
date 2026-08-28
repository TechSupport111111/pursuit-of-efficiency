# Pursuit of Efficiency — Invite-Only MVP

A Cloudflare Worker + static assets MVP for an invite-only AI efficiency advisor landing page.

## Deploy
1. Upload this repo to GitHub.
2. Connect it to Cloudflare Workers Builds, or deploy with Wrangler.
3. Set `BREVO_API_KEY` as an encrypted Worker secret.
4. Set `BREVO_LIST_ID` and `BREVO_SENDER_EMAIL` as Worker variables.
5. Create a Brevo contact list matching `BREVO_LIST_ID`. The API stores COMPANY, COMPANY_SIZE and GOAL attributes.
6. Point `pursuitofefficiency.com` at the Worker/custom domain.

## Important
- No real credentials are included.
- The `/api/invite` endpoint is intentionally server-side so the Brevo API key is never exposed to the browser.
- This MVP does not collect bank credentials or financial-account access.
- Before collecting sensitive business data, add a formal privacy policy, terms, security controls, retention/deletion policy, and appropriate legal/security review.

## SEO/LLMO
The landing page includes a canonical URL, robots directives, Open Graph/Twitter metadata, and SoftwareApplication structured data. It also provides `robots.txt` and `sitemap.xml`.
