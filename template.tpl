___TERMS_OF_SERVICE___

The Gallery terms must be reviewed and accepted by an authorized company representative before submission.


___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "displayName": "ACookies Consent Mode",
  "description": "Connects the ACookies WordPress banner to native Google Tag Manager consent APIs. Requires ACookies 0.3.0 or later with native GTM integration selected.",
  "categories": [
    "TAG_MANAGEMENT",
    "UTILITY"
  ],
  "containerContexts": [
    "WEB"
  ],
  "securityGroups": [],
  "brand": {
    "id": "github.com_Accomplicehq",
    "displayName": "Accomplice AB"
  }
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "SIMPLE_TABLE",
    "name": "regionDefaults",
    "displayName": "Optional regional consent defaults",
    "help": "Leave empty for denied optional consent worldwide. Regional rules use ISO 3166-2 codes separated by commas. Configure grants only when appropriate for your consent policy; the WordPress banner still appears globally.",
    "simpleTableColumns": [
      {
        "defaultValue": "",
        "displayName": "Regions (e.g. US, US-CA)",
        "name": "region",
        "type": "TEXT",
        "isUnique": true,
        "valueValidators": [
          {
            "type": "NON_EMPTY"
          }
        ]
      },
      {
        "defaultValue": "denied",
        "displayName": "analytics_storage",
        "name": "analytics_storage",
        "type": "SELECT",
        "selectItems": [
          {
            "value": "denied",
            "displayValue": "Denied"
          },
          {
            "value": "granted",
            "displayValue": "Granted"
          }
        ]
      },
      {
        "defaultValue": "denied",
        "displayName": "ad_storage",
        "name": "ad_storage",
        "type": "SELECT",
        "selectItems": [
          {
            "value": "denied",
            "displayValue": "Denied"
          },
          {
            "value": "granted",
            "displayValue": "Granted"
          }
        ]
      },
      {
        "defaultValue": "denied",
        "displayName": "ad_user_data",
        "name": "ad_user_data",
        "type": "SELECT",
        "selectItems": [
          {
            "value": "denied",
            "displayValue": "Denied"
          },
          {
            "value": "granted",
            "displayValue": "Granted"
          }
        ]
      },
      {
        "defaultValue": "denied",
        "displayName": "ad_personalization",
        "name": "ad_personalization",
        "type": "SELECT",
        "selectItems": [
          {
            "value": "denied",
            "displayValue": "Denied"
          },
          {
            "value": "granted",
            "displayValue": "Granted"
          }
        ]
      },
      {
        "defaultValue": "denied",
        "displayName": "functionality_storage",
        "name": "functionality_storage",
        "type": "SELECT",
        "selectItems": [
          {
            "value": "denied",
            "displayValue": "Denied"
          },
          {
            "value": "granted",
            "displayValue": "Granted"
          }
        ]
      },
      {
        "defaultValue": "denied",
        "displayName": "personalization_storage",
        "name": "personalization_storage",
        "type": "SELECT",
        "selectItems": [
          {
            "value": "denied",
            "displayValue": "Denied"
          },
          {
            "value": "granted",
            "displayValue": "Granted"
          }
        ]
      }
    ]
  }
]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

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


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "access_consent",
        "versionId": "1"
      },
      "param": [
        {
          "key": "consentTypes",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "analytics_storage"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "ad_storage"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "ad_user_data"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "ad_personalization"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "functionality_storage"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "personalization_storage"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "security_storage"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_globals",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keys",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "AcookiesConsent.getConfig"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "AcookiesConsent.subscribe"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "write_data_layer",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keyPatterns",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "developer_id.*"
              }
            ]
          }
        }
      ]
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_template_storage",
        "versionId": "1"
      },
      "param": []
    },
    "isRequired": true
  }
]


___TESTS___

setup: |-
  const templateStorage = require('templateStorage');
  templateStorage.clear();
scenarios:
- name: Establishes denied defaults before subscribing
  code: |-
    let defaultsSet = false;
    mock('setDefaultConsentState', (state) => {
      defaultsSet = true;
      assertThat(state.ad_user_data).isEqualTo('denied');
      assertThat(state.ad_personalization).isEqualTo('denied');
      assertThat(state.analytics_storage).isEqualTo('denied');
    });
    mock('callInWindow', (path) => {
      assertThat(defaultsSet).isEqualTo(true);
      if (path === 'AcookiesConsent.getConfig') return {integration: 'gtm', developerId: ''};
      return true;
    });
    runCode({});
    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtagSet').wasNotCalled();
- name: Missing bridge retains denied defaults
  code: |-
    mock('callInWindow', () => undefined);
    runCode({});
    assertApi('setDefaultConsentState').wasCalled();
    assertApi('updateConsentState').wasNotCalled();
    assertApi('gtmOnFailure').wasCalled();
- name: Direct integration does not register a native listener
  code: |-
    mock('callInWindow', () => ({integration: 'gtag', developerId: ''}));
    runCode({});
    assertApi('updateConsentState').wasNotCalled();
    assertApi('gtmOnFailure').wasCalled();
- name: Restores a saved choice and observes withdrawal
  code: |-
    let listener;
    mock('callInWindow', (path, callback) => {
      if (path === 'AcookiesConsent.getConfig') return {integration: 'gtm', developerId: ''};
      listener = callback;
      callback({analytics_storage: 'granted', ad_storage: 'denied'});
      return true;
    });
    runCode({});
    assertApi('updateConsentState').wasCalledWith({analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'denied', personalization_storage: 'denied', security_storage: 'granted'});
    listener({analytics_storage: 'denied'});
    assertApi('updateConsentState').wasCalledWith({analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'denied', personalization_storage: 'denied', security_storage: 'granted'});
- name: Uses the vendor ID issued to the plugin
  code: |-
    mock('callInWindow', (path) => path === 'AcookiesConsent.getConfig' ? {integration: 'gtm', developerId: 'dTest01'} : true);
    runCode({});
    assertApi('gtagSet').wasCalledWith('developer_id.dTest01', true);
- name: Subscription failure cannot grant consent
  code: |-
    mock('callInWindow', (path) => path === 'AcookiesConsent.getConfig' ? {integration: 'gtm', developerId: ''} : false);
    runCode({});
    assertApi('updateConsentState').wasNotCalled();
    assertApi('gtmOnFailure').wasCalled();
- name: Supports configurable regional defaults with a denied fallback
  code: |-
    mock('callInWindow', (path) => path === 'AcookiesConsent.getConfig' ? {integration: 'gtm', developerId: ''} : true);
    runCode({regionDefaults: [{region: 'us, us-ca', analytics_storage: 'granted'}, {region: ''}]});
    assertApi('setDefaultConsentState').wasCalledWith({region: ['US', 'US-CA'], security_storage: 'granted', wait_for_update: 500, analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', functionality_storage: 'denied', personalization_storage: 'denied'});


___NOTES___

WordPress integration only. Developer ID comes from the installed vendor plugin.
