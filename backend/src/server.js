require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Rental Invoicing Server Running on Port ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
