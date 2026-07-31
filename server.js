const app = require('./app');

const hostname = '127.0.0.1';
const port = 3000;

// express@5.2.1 does not hand this callback straight to http.Server#listen:
// app.listen wraps it in once() and also registers it as the server's error
// listener - `server.once('error', done)` at
// node_modules/express/lib/application.js L602-L603 - so a failed bind arrives
// here as the first argument instead of being thrown. Measured without the
// rethrow below: a bind conflict on 127.0.0.1:3000 logs the 41-byte readiness
// line for a socket that never bound and exits 0. Rethrowing restores the
// documented process contract - exit code 1 and no readiness line when the port
// is already taken (assumption A-002) - while still registering no 'error'
// listener, no retry and no graceful-shutdown handling of our own. The success
// path is unchanged: the same 41-byte readiness line, interpolated from the same
// two constants that were passed to listen.
app.listen(port, hostname, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server running at http://${hostname}:${port}/`);
});
