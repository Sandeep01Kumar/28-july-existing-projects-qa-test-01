const app = require('./app');

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server running at http://${hostname}:${port}/`);
});
