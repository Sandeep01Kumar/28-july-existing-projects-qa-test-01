const app = require('./app');

const hostname = '127.0.0.1';
const port = 3000;

// Express resolves a request target to a pathname before it dispatches, and
// router@2.2.0 finishes the dispatch without walking a single layer when that
// pathname comes back null (`if (path == null) { return done(layerError) }` in
// node_modules/router/index.js). The terminal not-found handler registered in
// app.js is therefore unreachable for such a target, and two behaviours the
// project does not want take over: finalhandler@2.1.1 answers with an HTML
// document that echoes the request method, and Node's legacy URL parser queues a
// DEP0170 warning that copies the raw target to stderr. Both are closed here, at
// the transport boundary, by rewriting an unroutable target before Express or
// Node ever parses it - so the constant plain-text 404 in app.js stays the single
// answer to every unroutable request (AMB-4, response contract 0.5.2.8) and no
// request byte reaches the process log.
const unroutableTarget = '/unroutable-request-target';

// A target in origin-form (leading '/') is always resolvable: parseurl slices the
// pathname out of the string itself and never consults the legacy parser. Any
// other form is resolvable only when it is a valid absolute URL, which
// URL.canParse reports without throwing and without the deprecation warning that
// url.parse would emit. Where URL.canParse is unavailable (Node below 18.17,
// inside the declared >=18 floor) the check fails closed to the plain-text 404
// rather than throwing.
const isRoutableTarget = (target) => typeof target === 'string'
  && (target.charCodeAt(0) === 0x2f
    || (typeof URL.canParse === 'function' && URL.canParse(target)));

// express@5.2.1 does not pass this callback straight through to
// http.Server#listen: app.listen wraps it in once() and also registers it as the
// server's error listener (`server.once('error', done)` in
// node_modules/express/lib/application.js), so a failed bind is delivered here as
// the first argument instead of being thrown. Rethrowing it preserves the
// documented process contract - exit code 1 with no readiness line when
// 127.0.0.1:3000 is already taken (assumption A-002) - while still registering no
// 'error' listener, no retry and no graceful-shutdown handling of our own. The
// success path is unchanged: the same 41-byte readiness line, interpolated from
// the same two constants that were passed to listen.
const server = app.listen(port, hostname, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server running at http://${hostname}:${port}/`);
});

// Registered on the transport, not on the application: app.js remains the sole
// owner of routing and of the not-found payload, and no framework internal is
// patched. Prepending runs it ahead of the Express application - which app.listen
// registered as the server's first 'request' listener - and registering it in the
// same tick as app.listen means no connection can be accepted beforehand.
server.prependListener('request', (req) => {
  if (!isRoutableTarget(req.url)) {
    req.url = unroutableTarget;
  }
});
