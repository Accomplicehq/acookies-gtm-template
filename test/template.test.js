import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const exported = await readFile(new URL('../template.tpl', import.meta.url), 'utf8');
const sections = exported.split(/___([A-Z_]+)___/);
const section = (name) => sections[sections.indexOf(name) + 1].trim();
const source = section('SANDBOXED_JS_FOR_WEB_TEMPLATE');
const plain = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

function harness() {
  const calls = new Map();
  const overrides = new Map();
  const storage = new Map();
  const apis = {
    setDefaultConsentState() {}, updateConsentState() {}, callInWindow() {}, gtagSet() {},
    templateStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), clear: () => storage.clear() }
  };
  const record = (name, args) => { if (!calls.has(name)) calls.set(name, []); calls.get(name).push(args); };
  const runCode = (data) => vm.runInNewContext(source, {
    data: { ...data, gtmOnSuccess: () => record('gtmOnSuccess', []), gtmOnFailure: () => record('gtmOnFailure', []) },
    require: (name) => {
      assert.ok(Object.hasOwn(apis, name), `Unknown sandbox API ${name}`);
      if (typeof apis[name] !== 'function') return apis[name];
      return (...args) => { record(name, args); return (overrides.get(name) || apis[name])(...args); };
    }
  });
  return {
    calls, storage, runCode,
    require: (name) => apis[name],
    mock: (name, fn) => overrides.set(name, fn),
    assertThat: (value) => ({ isEqualTo: (expected) => assert.deepEqual(plain(value), plain(expected)) }),
    assertApi: (name) => ({
      wasCalled: () => assert.ok(calls.get(name)?.length, `${name} was not called`),
      wasNotCalled: () => assert.equal(calls.get(name)?.length || 0, 0, `${name} was unexpectedly called`),
      wasCalledWith: (...expected) => assert.ok(calls.get(name)?.some((actual) => JSON.stringify(plain(actual)) === JSON.stringify(plain(expected))), `${name} was not called with expected values`)
    })
  };
}

const setup = section('TESTS').split('setup: |-\n')[1].split('\nscenarios:')[0].split('\n').map((line) => line.replace(/^  /, '')).join('\n');
for (const block of section('TESTS').split('\n- name: ').slice(1)) {
  const [name, body] = block.split('\n  code: |-\n');
  const code = body.split('\n').map((line) => line.replace(/^    /, '')).join('\n');
  test(`embedded GTM test: ${name}`, () => vm.runInNewContext(`${setup}\n${code}`, harness()));
}

test('source and exported sandbox code match', async () => {
  assert.equal(source, (await readFile(new URL('../src/template.js', import.meta.url), 'utf8')).trim());
  assert.equal(section('TESTS'), (await readFile(new URL('./scenarios.yaml', import.meta.url), 'utf8')).trim());
});

test('embedded setup clears a subscription left by an earlier Google sandbox test', () => {
  const h = harness();
  h.storage.set('subscribed', true);
  vm.runInNewContext(setup, h);
  h.runCode({});
  assert.equal(h.calls.get('setDefaultConsentState').length, 1);
  assert.equal(h.calls.get('gtmOnFailure').length, 1);
});

test('duplicate firing neither resets state nor registers another listener', () => {
  const h = harness();
  h.mock('callInWindow', (path) => path === 'AcookiesConsent.getConfig' ? { integration: 'gtm' } : true);
  h.runCode({});
  h.runCode({});
  assert.equal(h.calls.get('setDefaultConsentState').length, 1);
  assert.equal(h.calls.get('callInWindow').filter(([path]) => path === 'AcookiesConsent.subscribe').length, 1);
  assert.equal(h.calls.get('gtmOnSuccess').length, 2);
});

test('failed initialization can retry once the bridge is available', () => {
  const h = harness();
  h.runCode({});
  h.mock('callInWindow', (path) => path === 'AcookiesConsent.getConfig' ? { integration: 'gtm' } : true);
  h.runCode({});
  assert.equal(h.calls.get('gtmOnFailure').length, 1);
  assert.equal(h.calls.get('gtmOnSuccess').length, 1);
});

test('saved consent updates follow regional defaults after connection succeeds', () => {
  const h = harness();
  const order = [];
  h.mock('setDefaultConsentState', (state) => order.push(state.region ? 'regional' : 'global'));
  h.mock('updateConsentState', (state) => {
    order.push('update');
    assert.equal(state.analytics_storage, 'denied');
  });
  h.mock('callInWindow', (path, callback) => {
    if (path === 'AcookiesConsent.getConfig') return { integration: 'gtm' };
    callback({ analytics_storage: 'denied' });
    return true;
  });
  h.runCode({ regionDefaults: [{ region: 'US', analytics_storage: 'granted' }] });
  assert.deepEqual(order, ['global', 'regional', 'update']);
  assert.equal(h.calls.get('gtmOnSuccess').length, 1);
});

test('template has no network, script-loading, cookie or general global permissions', () => {
  const permissions = JSON.parse(section('WEB_PERMISSIONS'));
  assert.deepEqual(permissions.map((entry) => entry.instance.key.publicId), ['access_consent', 'access_globals', 'write_data_layer', 'access_template_storage']);
  const globals = permissions[1].instance.param[0].value.listItem.map((item) => item.mapValue[0].string);
  assert.deepEqual(globals, ['AcookiesConsent.getConfig', 'AcookiesConsent.subscribe']);
  assert.doesNotMatch(source, /gtag\(['"]consent|injectScript|sendPixel/);
});

test('export grants native storage and developer identification using GTM permission keys', () => {
  const permissions = JSON.parse(section('WEB_PERMISSIONS'));
  const writes = permissions.find((entry) => entry.instance.key.publicId === 'write_data_layer');
  assert.equal(writes.instance.param[0].key, 'keyPatterns');
  assert.deepEqual(writes.instance.param[0].value.listItem, [{ type: 1, string: 'developer_id.*' }]);
  const storage = permissions.find((entry) => entry.instance.key.publicId === 'access_template_storage');
  assert.equal(storage.isRequired, true);
  assert.deepEqual(storage.instance.param, []);
});
