const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');

// app.listen reports a failed bind through the server's 'error' event, so the
// listening promise has to settle on either event: awaiting only 'listening' makes
// the runner wait for ever when the ephemeral bind fails instead of producing a
// verdict. A server that never bound is closed before the rejection propagates so
// no handle is left behind.
const startServer = () => new Promise((resolve, reject) => {
  const server = app.listen(0, '127.0.0.1');
  const onError = (error) => {
    server.removeListener('listening', onListening);
    server.close(() => reject(error));
  };
  const onListening = () => {
    server.removeListener('error', onError);
    resolve(server);
  };
  server.once('error', onError);
  server.once('listening', onListening);
});

// Closing is awaited from a finally block so a rejected fetch or a failed assertion
// still releases the listener: a listener left open keeps the test process alive
// long after the verdict is known, which turns one failing assertion into a hung
// run. ERR_SERVER_NOT_RUNNING is tolerated so the teardown never masks the failure
// that triggered it.
const stopServer = (server) => new Promise((resolve, reject) => {
  server.close((error) => {
    if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') {
      reject(error);
      return;
    }
    resolve();
  });
});

test('GET / returns the original Hello, World! payload', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.strictEqual(await response.text(), 'Hello, World!\n');
  } finally {
    await stopServer(server);
  }
});

test('GET /good-evening returns the Good evening payload', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/good-evening`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.strictEqual(await response.text(), 'Good evening');
  } finally {
    await stopServer(server);
  }
});
