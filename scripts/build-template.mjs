import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const string = (value) => ({ type: 1, string: value });
const boolean = (value) => ({ type: 8, boolean: value });
const map = (values) => ({ type: 3, mapKey: Object.keys(values).map(string), mapValue: Object.values(values) });
const list = (values) => ({ type: 2, listItem: values });
const permission = (publicId, key, values) => ({
  instance: { key: { publicId, versionId: '1' }, param: key ? [{ key, value: list(values) }] : [] },
  isRequired: true
});
const consentTypes = ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization', 'functionality_storage', 'personalization_storage', 'security_storage'];
const permissions = [
  permission('access_consent', 'consentTypes', consentTypes.map((type) => map({ consentType: string(type), read: boolean(false), write: boolean(true) }))),
  permission('access_globals', 'keys', ['AcookiesConsent.getConfig', 'AcookiesConsent.subscribe', 'AcookiesStatic.initGtm'].map((key) => map({ key: string(key), read: boolean(false), write: boolean(false), execute: boolean(true) }))),
  permission('write_data_layer', 'keyPatterns', [string('developer_id.dNjUxMW')]),
  permission('access_template_storage'),
  permission('inject_script', 'urls', [string('https://acookies.com/runtime/acookies-gtm-v1.js?integration=gtm')])
];
const info = JSON.parse(await readFile(new URL('src/info.json', root), 'utf8'));
const terms = await readFile(new URL('src/terms.txt', root), 'utf8');
const code = await readFile(new URL('src/template.js', root), 'utf8');
const standaloneOnly = [{ paramName: 'installationMode', type: 'EQUALS', paramValue: 'standalone' }];
const parameters = [
  {
    type: 'SELECT', name: 'installationMode', displayName: 'Banner installation', defaultValue: 'wordpress',
    selectItems: [
      { value: 'wordpress', displayValue: 'Use the ACookies WordPress plugin (default)' },
      { value: 'standalone', displayValue: 'Load the standalone ACookies banner through GTM' }
    ],
    help: 'WordPress users should keep the default. Standalone mode loads a banner only when no WordPress consent bridge is present. Use one ACookies tag on Consent Initialization – All Pages.'
  },
  ...[
    ['siteKey', 'Site key', '', 'A unique identifier for this website. Use letters, numbers, hyphens or underscores.'],
    ['privacyUrl', 'Cookie policy URL', '', 'The HTTPS URL of your published cookie policy.'],
    ['configUrl', 'Configuration URL (optional)', '', 'An HTTPS JSON URL with CORS enabled for your site. Optional banner wording, styles, translations and cookie disclosures.'],
    ['defaultLanguage', 'Default language', 'en_US', 'For example en_US or sv_SE.'],
    ['enabledLanguages', 'Enabled languages', 'en_US', 'Comma-separated locales. Built-in: en_US, sv_SE, nb_NO, da_DK, fi, ja, is_IS.'],
    ['policyVersion', 'Policy version', '1', 'Change this when visitors need to choose again after a policy change.']
  ].map(([name, displayName, defaultValue, help]) => ({
    type: 'TEXT', name, displayName, defaultValue, help, enablingConditions: standaloneOnly,
    ...(name === 'configUrl' ? {} : { valueValidators: [{ type: 'NON_EMPTY' }] })
  })),
  {
    type: 'SIMPLE_TABLE', name: 'regionDefaults', displayName: 'Optional regional consent defaults',
    help: 'Leave empty for denied optional consent worldwide. Regional rules use ISO 3166-2 codes separated by commas. Configure grants only when appropriate for your consent policy; the banner still appears globally.',
    simpleTableColumns: [
      { defaultValue: '', displayName: 'Regions (e.g. US, US-CA)', name: 'region', type: 'TEXT', isUnique: true, valueValidators: [{ type: 'NON_EMPTY' }] },
      ...consentTypes.filter((type) => type !== 'security_storage').map((type) => ({
        defaultValue: 'denied', displayName: type, name: type, type: 'SELECT',
        selectItems: [{ value: 'denied', displayValue: 'Denied' }, { value: 'granted', displayValue: 'Granted' }]
      }))
    ]
  }
];
const scenarios = await readFile(new URL('test/scenarios.yaml', root), 'utf8');
const sections = [
  ['TERMS_OF_SERVICE', terms.trim()],
  ['INFO', JSON.stringify(info, null, 2)],
  ['TEMPLATE_PARAMETERS', JSON.stringify(parameters, null, 2)],
  ['SANDBOXED_JS_FOR_WEB_TEMPLATE', code.trim()],
  ['WEB_PERMISSIONS', JSON.stringify(permissions, null, 2)],
  ['TESTS', scenarios.trim()],
  ['NOTES', 'WordPress integration by default; optional standalone banner loading through GTM. Embeds ACookies developer ID dNjUxMW. Existing WordPress bridges take precedence over the standalone loader.']
];
// Preserve the Google editor export's UTF-8 BOM and final section spacing.
await writeFile(new URL('template.tpl', root), '\uFEFF' + sections.map(([name, body]) => `___${name}___\n\n${body}`).join('\n\n\n') + '\n\n\n');
console.log('Generated template.tpl from source, permissions and embedded tests.');
