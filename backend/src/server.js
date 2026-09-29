require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Rental Invoicing Server Running on Port ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[Server Error] Port ${PORT} is already in use by another running instance.`);
    console.error(`The backend is already active and accessible at http://localhost:${PORT}/api/health\n`);
  } else {
    console.error('[Server Error]', err);
  }
});

