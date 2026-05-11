function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    error: 'Error interno del servidor',
    detail: err.message
  });
}

module.exports = {
  errorHandler
};
