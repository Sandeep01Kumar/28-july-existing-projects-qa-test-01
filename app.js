const express = require('express');

const app = express();

app.disable('x-powered-by');

const sendNotFound = (res) => {
  res.status(404).type('text/plain').send('Not Found\n');
};

app.get('/', (req, res) => {
  res.type('text/plain').send('Hello, World!\n');
});

app.get('/good-evening', (req, res) => {
  res.type('text/plain').send('Good evening');
});

app.use((req, res) => {
  sendNotFound(res);
});

// The terminal middleware above cannot answer a request whose target the router
// fails to parse: getPathname() in router/index.js swallows the parse error and
// next() completes the router before walking a single layer, handing the request
// to finalhandler's request-reflecting HTML error document. Completing the router
// here keeps the constant plain-text contract universal for malformed targets
// such as the invalid absolute-form `GET http://[`. Nothing derived from the
// request reaches these bodies, and nothing is logged.
const routerHandle = app.handle;

app.handle = function handle(req, res, next) {
  if (typeof next === 'function') {
    routerHandle.call(this, req, res, next);
    return;
  }
  routerHandle.call(this, req, res, (error) => {
    if (res.headersSent) {
      if (error && req.socket) {
        req.socket.destroy();
      }
      return;
    }
    if (error) {
      res.status(500).type('text/plain').send('Internal Server Error\n');
      return;
    }
    sendNotFound(res);
  });
};

module.exports = app;
