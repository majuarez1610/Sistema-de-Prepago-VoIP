const axios = require('axios');

async function requestCallDecision(phoneNumber, destinationNumber) {
  const baseUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  const response = await axios.post(
    `${baseUrl}/decision/call`,
    {
      phone_number: phoneNumber,
      destination_number: destinationNumber || null
    },
    {
      timeout: 10000
    }
  );
  return response.data;
}

async function checkPythonHealth() {
  const baseUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
  return response.data;
}

module.exports = {
  requestCallDecision,
  checkPythonHealth
};
