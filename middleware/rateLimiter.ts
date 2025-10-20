import rateLimit from 'express-rate-limit';
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: {
    error: 'Too many requests for this sensitive operation, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests for this sensitive operation, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 50, 
  message: {
    error: 'Too many file uploads from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many file uploads from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});
