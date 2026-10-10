# ACookies Consent Mode for Google Tag Manager

Connects the **ACookies WordPress plugin 0.3.0+** to GTM's native consent APIs.
This repository is a development release. It is not a Google CMP partner approval
or a Community Template Gallery listing.

All seven embedded scenarios passed in Google's template editor on 2026-10-05
and again in a new isolated review container on 2026-10-10.
The Google-issued vendor ID is embedded in the released WordPress 1.1.1 patch;
this template remains a manual-import release candidate awaiting Gallery review.

## Install

1. Install ACookies and enable its public banner.
2. Import `template.tpl` into GTM **Templates → Tag Templates → New → Import**.
3. Create one tag with this template and trigger it on **Consent Initialization – All Pages**.
4. In WordPress **Settings → ACookies → Settings → Google integrations**, select
   **Native Google Tag Manager template** and enable the recommended Google banner template.
5. Choose basic or advanced mode and verify in GTM Preview/Tag Assistant before publishing.
   Do not install the same GA4 measurement tag both through the plugin and GTM.

The WordPress plugin supplies its packaged banner and early consent bridge through
WordPress hooks. This template connects to that bridge; it does not install a
standalone banner on sites without the plugin. Missing bridge or wrong integration
mode makes the tag fail with optional consent defaults still denied.

Defaults deny optional consent worldwide and grant `security_storage`. Optional
regional rows use comma-separated ISO 3166-2 codes and GTM's more-specific-region
precedence. The WordPress banner still appears worldwide. User choices override
defaults. Regional grants must match the site's consent policy.
Regional grants are applied only after the WordPress bridge successfully
subscribes; saved choices then override the complete set of defaults.

Google's developer ID comes from the installed vendor plugin. WordPress 1.1.1+
provides ACookies' Google-issued ID, `dNjUxMW`; older versions omit it. There is
no customer-supplied ID field. The template needs no network, script-injection
or cookie permissions.

Full setup and troubleshooting: https://acookies.com/wordpress-google-consent-setup

## Development and releases

Requires Node.js 22+. Run `npm run build` after changing `src/template.js`, the
permission definitions or embedded tests; then run `npm test`. Tests execute the
actual exported sandbox code and all embedded GTM scenarios. Import the export
into GTM and run its Tests tab too; Node's sandbox is not Google's runtime.

All Gallery files must be at repository root on `main`. Before Gallery submission:

- Publish WordPress 1.1.1+ with the embedded Google-issued developer ID, `dNjUxMW`.
- Verify the template in an actual GTM workspace with real Google tags.
- An authorized representative reviews and accepts the Gallery terms in the editor.
- Set `metadata.yaml`'s version SHA to the reviewed template commit.
- Submit the repository through https://tagmanager.google.com/gallery.
- Keep Issues enabled and subscribe to review/support notifications.

For each update, commit the reviewed template first, then add its commit SHA and
change notes at the top of `metadata.yaml`'s versions list in a second commit.
Retain previous version entries. The separate WordPress plugin remains GPL;
the independently authored template and its tooling are Apache 2.0.

## Support

For missing consent signals, email support@acookies.com before contacting Google.
Include plugin/template versions,
the affected public URL, integration mode and a shareable GTM Preview link.
Use repository Issues for template bugs; never post credentials or private
consent records. Staffed technical support is available to all ACookies customers,
including free users, with an initial technical response within four business days.
Support hours: Monday–Friday, 09:00–17:00 Europe/Stockholm.
