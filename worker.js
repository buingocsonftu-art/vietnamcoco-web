const AUTHORIZE = 'https://github.com/login/oauth/authorize';
const TOKEN = 'https://github.com/login/oauth/access_token';

function page(status, payload) {
  var msg = JSON.stringify('authorization:github:' + status + ':' + JSON.stringify(payload));
  var html = '<!doctype html><meta charset="utf-8"><body><script>'
    + 'function r(){window.opener&&window.opener.postMessage(' + msg + ',"*")}'
    + 'window.addEventListener("message",r,false);'
    + 'window.opener&&window.opener.postMessage("authorizing:github","*");'
    + '</' + 'script><p>OK</p>';
  return new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
}

export default {
  async fetch(request, env) {
    try {
      var url = new URL(request.url);
      if (url.pathname === '/auth') {
        var a = new URL(AUTHORIZE);
        a.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
        a.searchParams.set('redirect_uri', url.origin + '/callback');
        a.searchParams.set('scope', 'repo,user');
        a.searchParams.set('state', crypto.randomUUID());
        return Response.redirect(a.toString(), 302);
      }
      if (url.pathname === '/callback') {
        var code = url.searchParams.get('code');
        if (!code) return page('error', { message: 'missing_code' });
        var tr = await fetch(TOKEN, {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: code })
        });
        var data = await tr.json();
        if (!data.access_token) return page('error', { message: data.error || 'no_token' });
        return page('success', { token: data.access_token, provider: 'github' });
      }
      return env.ASSETS.fetch(request);
    } catch (e) {
      return new Response('auth worker error', { status: 500 });
    }
  }
};
