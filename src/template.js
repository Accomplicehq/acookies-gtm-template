const setDefaultConsentState = require('setDefaultConsentState');
const updateConsentState = require('updateConsentState');
const callInWindow = require('callInWindow');
const gtagSet = require('gtagSet');
const templateStorage = require('templateStorage');
const injectScript = require('injectScript');

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
    const finish = (success) => {
      if (settled) return;
      settled = true;
      const pending = templateStorage.getItem('pending');
      templateStorage.setItem('pending', false);
      if (success) templateStorage.setItem('subscribed', true);
      pending.forEach((callbacks) => {
        if (success) callbacks.success();
        else callbacks.failure();
      });
    };
    setDefaultConsentState({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
      wait_for_update: 500
    });
    gtagSet('developer_id.dNjUxMW', true);

    const connect = (config, loadBanner) => {
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
        updateConsentState({
          analytics_storage: state.analytics_storage === 'granted' ? 'granted' : 'denied',
          ad_storage: state.ad_storage === 'granted' ? 'granted' : 'denied',
          ad_user_data: state.ad_user_data === 'granted' ? 'granted' : 'denied',
          ad_personalization: state.ad_personalization === 'granted' ? 'granted' : 'denied',
          functionality_storage: state.functionality_storage === 'granted' ? 'granted' : 'denied',
          personalization_storage: state.personalization_storage === 'granted' ? 'granted' : 'denied',
          security_storage: 'granted'
        });
      };
      const ready = () => {
        if (settled) return;
        // Apply regional grants only after the bridge/runtime is ready.
        (data.regionDefaults || []).forEach((row) => {
          const regions = (row.region || '').split(',').map((region) => region.trim().toUpperCase()).filter((region) => region !== '');
          if (regions.length === 0) return;
          const regional = { region: regions, security_storage: 'granted', wait_for_update: 500 };
          ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization', 'functionality_storage', 'personalization_storage'].forEach((type) => {
            regional[type] = row[type] === 'granted' ? 'granted' : 'denied';
          });
          setDefaultConsentState(regional);
        });
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
        ready();
      } else {
        finish(false);
      }
    };
    const config = standalone ? existingBridge : callInWindow('AcookiesConsent.getConfig');
    if (config || !standalone) {
      connect(config, false);
    } else {
      injectScript('https://acookies.com/runtime/acookies-gtm-v1.js?integration=gtm', () => {
        // WordPress may have initialized while the asynchronous script was loading.
        const bridge = callInWindow('AcookiesConsent.getConfig');
        connect(bridge, !bridge);
      }, () => finish(false), 'acookies-gtm-v1');
    }
  }
}
