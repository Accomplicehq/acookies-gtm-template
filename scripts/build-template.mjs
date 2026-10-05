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
  permission('access_globals', 'keys', ['AcookiesConsent.getConfig', 'AcookiesConsent.subscribe'].map((key) => map({ key: string(key), read: boolean(false), write: boolean(false), execute: boolean(true) }))),
  permission('write_data_layer', 'keyPatterns', [string('developer_id.*')]),
  permission('access_template_storage')
];
const info = {
  type: 'TAG', id: 'cvt_temp_public_id', version: 1,
  displayName: 'ACookies Consent Mode',
  description: 'Connects the ACookies WordPress banner to native Google Tag Manager consent APIs. Requires ACookies 0.3.0 or later with native GTM integration selected.',
  categories: ['TAG_MANAGEMENT', 'UTILITY'],
  containerContexts: ['WEB'], securityGroups: [],
  brand: { id: 'github.com_Accomplicehq', displayName: 'Accomplice AB' }
};
const code = await readFile(new URL('src/template.js', root), 'utf8');
const parameters = [{
  type: 'SIMPLE_TABLE', name: 'regionDefaults', displayName: 'Optional regional consent defaults',
  help: 'Leave empty for denied optional consent worldwide. Regional rules use ISO 3166-2 codes separated by commas. Configure grants only when appropriate for your consent policy; the WordPress banner still appears globally.',
  simpleTableColumns: [
    { defaultValue: '', displayName: 'Regions (e.g. US, US-CA)', name: 'region', type: 'TEXT', isUnique: true, valueValidators: [{ type: 'NON_EMPTY' }] },
    ...consentTypes.filter((type) => type !== 'security_storage').map((type) => ({
      defaultValue: 'denied', displayName: type, name: type, type: 'SELECT',
      selectItems: [{ value: 'denied', displayValue: 'Denied' }, { value: 'granted', displayValue: 'Granted' }]
    }))
  ]
}];
const scenarios = await readFile(new URL('test/scenarios.yaml', root), 'utf8');
const sections = [
  ['TERMS_OF_SERVICE', 'The Gallery terms must be reviewed and accepted by an authorized company representative before submission.'],
  ['INFO', JSON.stringify(info, null, 2)],
  ['TEMPLATE_PARAMETERS', JSON.stringify(parameters, null, 2)],
  ['SANDBOXED_JS_FOR_WEB_TEMPLATE', code.trim()],
  ['WEB_PERMISSIONS', JSON.stringify(permissions, null, 2)],
  ['TESTS', scenarios.trim()],
  ['NOTES', 'WordPress integration only. Developer ID comes from the installed vendor plugin.']
];
await writeFile(new URL('template.tpl', root), sections.map(([name, body]) => `___${name}___\n\n${body}`).join('\n\n\n') + '\n');
console.log('Generated template.tpl from source, permissions and embedded tests.');
