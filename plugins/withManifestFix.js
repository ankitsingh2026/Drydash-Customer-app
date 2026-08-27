const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];

    if (application && application['meta-data']) {
      application['meta-data'].forEach((meta) => {
        if (
          meta.$ &&
          (meta.$['android:name'] === 'com.google.firebase.messaging.default_notification_color' ||
           meta.$['android:name'] === 'com.google.firebase.messaging.default_notification_icon')
        ) {
          meta.$['tools:replace'] = 'android:resource';
        }
      });
    }

    return config;
  });
};
