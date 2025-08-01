const timeout = (ms = 30000) => {
  return (req, res, next) => {
    // Set timeout for the request
    req.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          error: 'The request took too long to process'
        });
      }
    });

    // Set timeout for the response
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Response timeout',
          error: 'The response took too long to send'
        });
      }
    });

    next();
  };
};

module.exports = timeout;