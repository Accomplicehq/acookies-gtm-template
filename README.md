# ACookies Consent Mode for Google Tag Manager

Connects the **ACookies WordPress plugin 1.1.1+** to GTM's native consent APIs by
default. An explicit **Load the standalone ACookies banner through GTM** option
can instead install the banner on a website without the WordPress plugin.
The template remains under Community Template Gallery review. Publication of this
source does not establish Google CMP partner admission or Gallery approval.

Version **1.1.0**, published on 2026-10-23, adds the optional standalone loader.
All 13 embedded scenarios passed in Google's actual template sandbox; the
combined product checks include 266 automated tests. The runtime is hosted on
acookies.com. Try the [standalone review page](https://acookies.com/runtime/gtm-demo).

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

## Install with WordPress (default)

1. Install ACookies and enable its public banner.
2. Import `template.tpl` into GTM **Templates → Tag Templates → New → Import**.
3. Create one tag with this template and trigger it on **Consent Initialization – All Pages**.
4. In WordPress **Settings → ACookies → Settings → Google integrations**, select
   **Native Google Tag Manager template** and enable the recommended Google banner template.
5. Choose basic or advanced mode and verify in GTM Preview/Tag Assistant before publishing.
   Do not install the same GA4 measurement tag both through the plugin and GTM.

The WordPress plugin supplies its packaged banner and early consent bridge through
WordPress hooks. Keep **Banner installation → Use the ACookies WordPress plugin**.
The default never downloads the standalone runtime. Missing bridge or wrong
integration mode makes the tag fail with optional consent defaults still denied.

## Install the standalone banner through GTM

1. Import the template and create one tag on **Consent Initialization – All Pages**.
2. Select **Banner installation → Load the standalone ACookies banner through GTM**.
3. Set a unique **Site key** (letters, numbers, hyphens or underscores; up to
   80 characters), your published HTTPS **Cookie policy URL**, languages and
   **Policy version**. Changing the policy version requests a fresh choice.
4. Optionally set an HTTPS **Configuration URL** returning JSON with CORS enabled
   for your site's origin. Use JSON configuration (example below)
   for wording, styles, translations and cookie disclosures. Tag fields control
   consent identity, policy version and policy URL; remote JSON cannot hide the banner.
5. Configure all measurement/advertising tags to respect consent. For basic mode,
   use the Custom Event trigger **acookies_consent_update** together with the
   appropriate additional consent checks (for example `analytics_storage` for
   an analytics tag). This event is emitted after the native consent update for
   saved and new choices. Denied defaults alone permit the
   cookieless requests used by advanced Consent Mode. Verify fresh visitors,
   Reject, Accept All, analytics-only, saved choices and withdrawal in Tag Assistant
   before publishing.

Example optional configuration JSON:

```json
{
  "theme": "light",
  "position": "bottom-right",
  "bannerStyles": { "primaryColor": "#1f1f1f", "radius": "8px" },
  "translations": {
    "en_US": {
      "bannerTitle": "Your cookie choices",
      "bannerText": "Choose which optional cookies to allow."
    }
  },
  "cookies": [
    { "name": "_ga", "provider": "Google Analytics", "category": "analytics", "description": "Measures website usage." }
  ]
}
```

The tag sets denied defaults and the issued developer ID synchronously, then uses
`injectScript` to load only
`https://acookies.com/runtime/acookies-gtm-v1.js?integration=gtm`. The runtime
waits for the document/configuration, restores a valid saved choice and passes
changes back to the template's native `updateConsentState` API. It never queues
`gtag('consent', ...)` commands in GTM mode. Regional defaults are applied only
after successful initialization, before saved choices override them.

The banner includes cookie-policy and Google data-use links and a persistent
preferences button for changing or withdrawing consent. Choices use standalone
storage keys, separate from WordPress. A configuration fetch/script error or
invalid configuration fails initialization and retains denied optional defaults.

**WordPress takes precedence:** even if standalone mode is selected, an existing
native WordPress bridge is used without downloading a second banner. A direct
WordPress bridge causes the standalone tag to fail without changing consent.
The bridge is checked again after script loading, and the runtime refuses to
initialize if WordPress is detected while waiting for configuration or the DOM.
If a plugin banner appears later, the runtime removes its own controls and hands
native consent updates to the WordPress bridge, without copying standalone choices.
Keep the plugin's early bridge ahead of GTM and use only one banner installation.
The standalone path does not replace WordPress settings, scanning, consent logs,
WP Consent API integration or server-side script blocking. Scripts outside GTM
must be controlled separately; GTM cannot block code that already ran.

The runtime is published at the exact URL above. The standalone review page uses
our isolated test GTM container and Analytics property. Historical Google sandbox
evidence above covers earlier WordPress-only candidates; the 13-scenario run also
checks the optional loader and WordPress precedence.

Defaults deny optional consent worldwide and grant `security_storage`. Optional
regional rows use comma-separated ISO 3166-2 codes and GTM's more-specific-region
precedence. The WordPress banner still appears worldwide. User choices override
defaults. Regional grants must match the site's consent policy.
Regional grants are applied only after the WordPress bridge successfully
subscribes or the standalone runtime is ready; saved choices then override the
complete set of defaults.

The template embeds ACookies' Google-issued ID, `dNjUxMW`, and registers it
immediately after denied defaults, before reading the WordPress bridge. It
ignores any developer ID returned by the bridge and has no customer-supplied ID
field. Registration does not grant consent; missing or misconfigured integration
retains denied optional defaults and reports initialization failure.
Its data-layer write permission is limited to `developer_id.dNjUxMW`. The
template's script-injection permission is restricted to the exact ACookies runtime
URL. Existing WordPress installations make no new script request. The template
has no cookie-reading, arbitrary global-write or general network-send permissions.

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
