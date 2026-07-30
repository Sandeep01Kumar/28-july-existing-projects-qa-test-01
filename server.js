const app = require('./app');

const hostname = '127.0.0.1';
const port = 3000;

// express@5.2.1 does not pass this callback straight through to
// http.Server#listen: app.listen wraps it in once() and also registers it as the
// server's error listener (`server.once('error', done)` in
// node_modules/express/lib/application.js), so a failed bind is delivered here as
// the first argument instead of being thrown. Rethrowing it preserves the
// documented process contract - exit code 1 with no readiness line when
// 127.0.0.1:3000 is already taken (assumption A-002) - while still registering no
// 'error' listener, no retry and no graceful-shutdown handling of our own. The
// success path is unchanged: the same 41-byte readiness line, interpolated from
// the same two constants that were passed to listen. Unroutable request targets
// are guarded inside app.js, so this listener answers them with the same constant
// plain-text 404 as every other listener the exported application creates.
app.listen(port, hostname, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server running at http://${hostname}:${port}/`);
});
