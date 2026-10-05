const setDefaultConsentState = require('setDefaultConsentState');
const updateConsentState = require('updateConsentState');
const callInWindow = require('callInWindow');
const gtagSet = require('gtagSet');
const templateStorage = require('templateStorage');

if (templateStorage.getItem('subscribed')) {
  data.gtmOnSuccess();
} else {
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

  // More specific regional defaults take precedence over the denied fallback.
  (data.regionDefaults || []).forEach((row) => {
    const regions = (row.region || '').split(',').map((region) => region.trim().toUpperCase()).filter((region) => region !== '');
    if (regions.length === 0) return;
    const regional = { region: regions, security_storage: 'granted', wait_for_update: 500 };
    ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization', 'functionality_storage', 'personalization_storage'].forEach((type) => {
      regional[type] = row[type] === 'granted' ? 'granted' : 'denied';
    });
    setDefaultConsentState(regional);
  });

  const config = callInWindow('AcookiesConsent.getConfig');
  if (!config || config.integration !== 'gtm') {
    data.gtmOnFailure();
  } else {
    if (config.developerId) {
      gtagSet('developer_id.' + config.developerId, true);
    }
    const onConsent = (state) => {
      if (!state) return;
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
    if (callInWindow('AcookiesConsent.subscribe', onConsent) === true) {
      templateStorage.setItem('subscribed', true);
      data.gtmOnSuccess();
    } else {
      data.gtmOnFailure();
    }
  }
}
