// kavedi.com is the site; kavedi.com/sign-in is the app's own sign-in, passed through from the app's server (5 Oct,
// Kelvin: "kavedi.com/sign-in, then when you've entered, dashboard.kavedi.com"). Only the addresses below reach this
// script (run_worker_first in wrangler.jsonc); every other one is the site's files, as before.
// After signing in, the app hands the session to the dashboard's own address.
const APP = 'https://kavedi-app-r.onrender.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, env.APP_ORIGIN || APP);
    const passed = new Request(target, request);
    passed.headers.set('X-Forwarded-Host', url.host);
    // A redirect from the app is handed back as it is, so the browser follows it from kavedi.com.
    return fetch(passed, { redirect: 'manual' });
  },
};
