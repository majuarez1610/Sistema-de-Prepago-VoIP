const express = require('express');
const cors = require('cors');
const { testDatabaseConnection } = require('./config/db');
const { checkPythonHealth } = require('./services/pythonDecisionService');
const userRoutes = require('./routes/userRoutes');
const callRoutes = require('./routes/callRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const twilioRoutes = require('./routes/twilioRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'Backend SSF del sistema prepago VoIP con Red Inteligente',
    principal_flow: 'Celular fisico -> Twilio -> ngrok -> Node.js -> Python -> MySQL -> TwiML'
  });
});

app.get('/health', async (req, res) => {
  const status = {
    node: 'ok',
    mysql: 'unknown',
    python: 'unknown'
  };

  try {
    await testDatabaseConnection();
    status.mysql = 'ok';
  } catch (error) {
    status.mysql = `error: ${error.message}`;
  }

  try {
    await checkPythonHealth();
    status.python = 'ok';
  } catch (error) {
    status.python = `error: ${error.message}`;
  }

  const httpCode = status.mysql === 'ok' ? 200 : 503;
  res.status(httpCode).json({
    status,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/webhooks/twilio', twilioRoutes);

app.use(errorHandler);

module.exports = app;
