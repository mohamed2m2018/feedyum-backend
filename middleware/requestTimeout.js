/**
 * Request timeout middleware to prevent hanging requests
 */
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    let timeoutTriggered = false;
    
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent && !timeoutTriggered) {
        timeoutTriggered = true;
        console.log(`Request timeout: ${req.method} ${req.url} - ${timeoutMs}ms`);
        
        try {
          res.status(408).json({
            success: false,
            error: 'Request timeout',
            message: 'The request took too long to process'
          });
        } catch (error) {
          console.error('Error sending timeout response:', error.message);
        }
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    // Clear timeout when response is closed
    res.on('close', () => {
      clearTimeout(timeout);
    });

    // Clear timeout on error
    res.on('error', () => {
      clearTimeout(timeout);
    });

    // Add a flag to track if timeout was triggered
    res.timeoutTriggered = () => timeoutTriggered;

    next();
  };
};

module.exports = requestTimeout;