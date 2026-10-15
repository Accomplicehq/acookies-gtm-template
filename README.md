# ACookies Consent Mode for Google Tag Manager

Connects the **ACookies WordPress plugin 1.1.1+** to GTM's native consent APIs.
This repository is a development release. It is not a Google CMP partner approval
or a Community Template Gallery listing.

The previous seven embedded scenarios passed in Google's template editor on
2026-10-05, 2026-10-10 and 2026-10-13. The repository was submitted to the Gallery
on 2026-10-13 and remains under review. Google's CMP feedback on 2026-10-15
requested embedding the issued developer ID directly in the template. The
revised candidate does so and adds regression coverage; its verification is
recorded separately from the earlier candidate.
All eight revised scenarios passed in Google's template editor on 2026-10-15;
all 16 local tests passed. Google Preview confirmed denied defaults and the
issued developer ID before the measurement tag on the isolated review site.

Pär Thunberg approved the Gallery Developer Terms of Service on behalf of
Accomplice AB on 2026-10-13. The Gallery candidate retains the tested consent
code and permissions, adds the approved terms and includes a 96×96 brand icon.
Direct/native basic/advanced live evidence and the customer example are available
at https://google-review.acookies.com/.

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

The template embeds ACookies' Google-issued ID, `dNjUxMW`, and registers it
immediately after denied defaults, before reading the WordPress bridge. It
ignores any developer ID returned by the bridge and has no customer-supplied ID
field. Registration does not grant consent; missing or misconfigured WordPress
integration retains denied optional defaults and reports initialization failure.
Its data-layer write permission is limited to `developer_id.dNjUxMW`. The
template needs no network, script-injection or cookie permissions.

Full setup and troubleshooting: https://acookies.com/wordpress-google-consent-setup

## Development and releases

Requires Node.js 22+. Run `npm run build` after changing `src/template.js`,
`src/info.json`, `src/terms.txt`, the permission definitions or embedded tests;
then run `npm test`. Tests execute the
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
