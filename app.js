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

const dispatch = app.handle.bind(app);

app.handle = (req, res, next) => {
  dispatch(req, res, next || (() => notFound(req, res)));
};

module.exports = app;
