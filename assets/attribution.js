(function () {
  var STORAGE_KEY = 'kv_attribution';
  var stored = {};
  try { stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) {}

  var params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
    var value = params.get(key);
    if (value) stored[key] = value;
  });
  if (!stored.referrer) stored.referrer = document.referrer || '';

  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch (e) {}

  window.kvGetAttribution = function () {
    var data = {};
    try { data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) {}
    return data;
  };

  window.kvAppendAttribution = function (formData, formId) {
    var data = window.kvGetAttribution();
    if (data.utm_source) formData.append('utm_source', data.utm_source);
    if (data.utm_medium) formData.append('utm_medium', data.utm_medium);
    if (data.utm_campaign) formData.append('utm_campaign', data.utm_campaign);
    formData.append('referrer', data.referrer || '');
    formData.append('form_id', formId || '');
  };
})();
