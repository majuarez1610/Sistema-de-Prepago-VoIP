const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  override: true
});

const app = require('./app');

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Backend Node.js escuchando en puerto ${PORT}`);
});
