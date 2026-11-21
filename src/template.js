const setDefaultConsentState = require('setDefaultConsentState');
const updateConsentState = require('updateConsentState');
const callInWindow = require('callInWindow');
const gtagSet = require('gtagSet');
const templateStorage = require('templateStorage');
const injectScript = require('injectScript');

const optionalTypes = [
  'analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization',
  'functionality_storage', 'personalization_storage'
];
const consentState = (state) => {
  const result = {};
  optionalTypes.forEach((type) => {
    result[type] = state[type] === 'granted' ? 'granted' : 'denied';
  });
  result.security_storage = 'granted';
  return result;
};

if (templateStorage.getItem('subscribed')) {
  data.gtmOnSuccess();
} else if (templateStorage.getItem('pending')) {
  templateStorage.getItem('pending').push({ success: data.gtmOnSuccess, failure: data.gtmOnFailure });
} else {
  const standalone = data.installationMode === 'standalone';
  // An explicitly selected loader must still respect an installed WordPress CMP.
  const existingBridge = standalone ? callInWindow('AcookiesConsent.getConfig') : undefined;
  if (existingBridge && existingBridge.integration !== 'gtm') {
    data.gtmOnFailure();
  } else {
    templateStorage.setItem('pending', [{ success: data.gtmOnSuccess, failure: data.gtmOnFailure }]);
    let settled = false;
    let regionalGrant = false;
    const finish = (success) => {
      if (settled) return;
      settled = true;
      if (!success && regionalGrant) {
        const bridge = callInWindow('AcookiesConsent.getConfig');
        // A direct WordPress bridge owns its own consent updates.
        if (!bridge || bridge.integration === 'gtm') updateConsentState(consentState({}));
      }
      const pending = templateStorage.getItem('pending');
      templateStorage.setItem('pending', false);
      if (success) templateStorage.setItem('subscribed', true);
      pending.forEach((callbacks) => {
        if (success) callbacks.success();
        else callbacks.failure();
      });
    };
    const worldwide = consentState({});
    worldwide.wait_for_update = 500;
    setDefaultConsentState(worldwide);
    gtagSet('developer_id.dNjUxMW', true);

    const applyRegionalDefaults = () => {
      (data.regionDefaults || []).forEach((row) => {
        const regions = (row.region || '').split(',').map((region) => region.trim().toUpperCase()).filter((region) => region !== '');
        if (regions.length === 0) return;
        const regional = consentState(row);
        regional.region = regions;
        regional.wait_for_update = 500;
        if (optionalTypes.some((type) => regional[type] === 'granted')) regionalGrant = true;
        setDefaultConsentState(regional);
      });
    };

    const connect = (config, loadBanner, initialWordPressBridge) => {
      if (!loadBanner && (!config || config.integration !== 'gtm')) {
        finish(false);
        return;
      }
      let connected = false;
      let initialState;
      const onConsent = (state) => {
        if (!state || (settled && !connected)) return;
        // Hold synchronous saved-choice replay until the subscription succeeds
        // and all defaults have been established.
        if (!connected) {
          initialState = state;
          return;
        }
        updateConsentState(consentState(state));
      };
      const ready = () => {
        if (settled) return;
        connected = true;
        if (initialState) onConsent(initialState);
        finish(true);
      };
      if (loadBanner) {
        let accepted = false;
        let isReady = false;
        const onReady = () => {
          isReady = true;
          if (accepted) ready();
        };
        const result = callInWindow('AcookiesStatic.initGtm', {
          siteKey: data.siteKey,
          privacyUrl: data.privacyUrl,
          configUrl: data.configUrl || '',
          defaultLanguage: data.defaultLanguage || 'en_US',
          enabledLanguages: data.enabledLanguages || 'en_US',
          policyVersion: data.policyVersion || '1'
        }, onConsent, onReady, () => finish(false));
        if (result === true) {
          accepted = true;
          if (isReady) ready();
        } else {
          finish(false);
        }
      } else if (callInWindow('AcookiesConsent.subscribe', onConsent) === true) {
        // The already loaded WordPress bridge subscribes synchronously.
        if (initialWordPressBridge) applyRegionalDefaults();
        ready();
      } else {
        finish(false);
      }
    };
    const config = standalone ? existingBridge : callInWindow('AcookiesConsent.getConfig');
    if (config || !standalone) {
      connect(config, false, true);
    } else {
      // Regional policy comes from the tag settings during Consent Initialization.
      // It must be set even while the script and any remote config are pending.
      applyRegionalDefaults();
      injectScript('https://acookies.com/runtime/acookies-gtm-v1.js?integration=gtm', () => {
        // WordPress may have initialized while the asynchronous script was loading.
        const bridge = callInWindow('AcookiesConsent.getConfig');
        connect(bridge, !bridge, false);
      }, () => finish(false), 'acookies-gtm-v1');
    }
  }
}
