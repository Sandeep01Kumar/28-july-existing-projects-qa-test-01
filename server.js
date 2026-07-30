const app = require('./app');

const hostname = '127.0.0.1';
const port = 3000;

const server = app.listen(port, hostname, () => {
  // A conflicting bind still invokes this callback on Windows, where the listen
  // error is delivered asynchronously afterwards, so the socket reports an
  // address only once it is genuinely listening. Announcing readiness solely on
  // that signal keeps the line a truthful liveness indicator on every platform.
  if (server.address()) {
    console.log(`Server running at http://${hostname}:${port}/`);
  }
});

// A bind conflict must terminate the process with exit code 1 and identify the
// failure on stderr. The listen error is discarded silently when nothing
// observes it, which would make a failed start indistinguishable from a success.
server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
