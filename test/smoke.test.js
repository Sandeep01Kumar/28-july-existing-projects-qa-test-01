const test = require('node:test');
const assert = require('node:assert');
const net = require('node:net');
const app = require('../app');

const rawRequest = (port, requestLine) => new Promise((resolve, reject) => {
  const chunks = [];
  const socket = net.connect(port, '127.0.0.1', () => {
    socket.end(`${requestLine}\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
  });
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => chunks.push(chunk));
  socket.on('end', () => resolve(chunks.join('')));
  socket.on('error', reject);
});

test('GET / returns the original Hello, World! payload', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.strictEqual(await response.text(), 'Hello, World!\n');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('GET /good-evening returns the Good evening payload', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/good-evening`);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/plain/);
    assert.strictEqual(await response.text(), 'Good evening');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('an unparsable request target receives the constant plain-text 404', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject));
  try {
    for (const method of ['GET', 'POST', 'TRACE']) {
      const raw = await rawRequest(server.address().port, `${method} http://[ HTTP/1.1`);
      const [head, body] = raw.split('\r\n\r\n');
      assert.match(head, /^HTTP\/1\.1 404 Not Found/);
      assert.match(head, /^content-type: text\/plain/im);
      assert.strictEqual(body, 'Not Found\n');
      assert.doesNotMatch(raw, /<html|<pre|Cannot /i);
      assert.doesNotMatch(raw, /http:\/\/\[/);
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
