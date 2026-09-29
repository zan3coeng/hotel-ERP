const serverless = require('serverless-http');
const app = require('../backend/server');

const handler = serverless(app);

module.exports = (req, res) => {
  return handler(req, res);
};
