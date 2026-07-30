const express = require('express');

const app = express();

app.disable('x-powered-by');

app.get('/', (req, res) => {
  res.type('text/plain').send('Hello, World!\n');
});

app.get('/good-evening', (req, res) => {
  res.type('text/plain').send('Good evening');
});

app.use((req, res) => {
  res.status(404).type('text/plain').send('Not Found\n');
});

// Express resolves a request target to a pathname before it dispatches, and
// router@2.2.0 finishes the dispatch without walking a single layer when that
// pathname comes back null (`if (path == null) { return done(layerError) }` in
// node_modules/router/index.js). The terminal not-found handler above is therefore
// unreachable for such a target, and two behaviours this project does not want
// take over: finalhandler@2.1.1 answers with an HTML document that echoes the
// request method, and Node's legacy URL parser queues a DEP0170 warning that
// copies the raw target to stderr. Both are closed below, at the transport
// boundary, by rewriting an unroutable target before Express or Node ever parses
// it - so the constant plain-text 404 above stays the single answer to every
// unroutable request (AMB-4, response contract 0.5.2.8) and no request byte
// reaches the process log.
//
// The guard belongs to this module, not to the bootstrap, because this module is
// what the package exports: every listener created from the exported application -
// the production bootstrap, the smoke suite and any consumer of
// `require('hello_world')` - is then protected by the same code, so there is one
// not-found contract rather than one per entry point. Installing it here keeps
// importing this module side-effect-free: nothing binds a socket or opens a handle
// until a caller asks for a listener.
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

const normalizeRequestTarget = (req) => {
  if (!isRoutableTarget(req.url)) {
    req.url = unroutableTarget;
  }
};

// express@5.2.1's app.listen creates the Node server, wraps a trailing callback in
// once() and registers that callback with `server.once('error', done)` before it
// listens (node_modules/express/lib/application.js), so delegating to it preserves
// the error-first callback the bootstrap relies on for the bind-conflict contract
// (assumption A-002). Prepending the guard runs it ahead of the Express
// application - which http.createServer registered as the server's first 'request'
// listener - and doing so in the same tick as the delegated call means no
// connection can be accepted in between.
const listen = app.listen;

app.listen = (...args) => {
  const server = listen.apply(app, args);
  server.prependListener('request', normalizeRequestTarget);
  return server;
};

module.exports = app;
