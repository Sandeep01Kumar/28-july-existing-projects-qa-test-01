const express = require('express');

const app = express();

app.disable('x-powered-by');

app.get('/', (req, res) => {
  res.type('text/plain').send('Hello, World!\n');
});

app.get('/good-evening', (req, res) => {
  res.type('text/plain').send('Good evening');
});

const notFound = (req, res) => {
  res.status(404).type('text/plain').send('Not Found\n');
};

app.use(notFound);

// Not removable: the router resolves a pathname before matching any layer and
// completes early when that fails [node_modules/router/index.js:L224-L228], so
// app.use above cannot answer a malformed target. Without this callback Express
// falls back to finalhandler, which reflects the request method in HTML and
// renders the error stack [node_modules/finalhandler/index.js:L107,L247,L271].
const completeRequest = (err, req, res) => {
  if (err) {
    console.error(err.stack || String(err));
  }

  if (res.headersSent) {
    if (err && req.socket) {
      req.socket.destroy();
    }
    return;
  }

  if (err) {
    res.status(500).type('text/plain').send('Internal Server Error\n');
    return;
  }

  notFound(req, res);
};

const dispatch = app.handle.bind(app);

app.handle = (req, res, next) => {
  if (typeof next === 'function') {
    dispatch(req, res, next);
    return;
  }

  dispatch(req, res, (err) => {
    completeRequest(err, req, res);
  });
};

module.exports = app;
