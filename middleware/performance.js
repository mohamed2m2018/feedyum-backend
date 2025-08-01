const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Log slow requests
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 5000) { // Log requests taking more than 5 seconds
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
    
    if (duration > 1000) { // Log requests taking more than 1 second
      console.log(`Request: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  
  next();
};

module.exports = performanceMonitor;