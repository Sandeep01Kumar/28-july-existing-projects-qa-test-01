const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');

test('GET / returns the original Hello, World! payload', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', resolve);
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.strictEqual(await response.text(), 'Hello, World!\n');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /good-evening returns the Good evening payload', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', resolve);
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/good-evening`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.strictEqual(await response.text(), 'Good evening');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
