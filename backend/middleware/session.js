/**
 * Middleware to check if user session is valid
 * Extends session expiration on each request
 */
export const sessionMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    // Touch the session to extend expiration
    req.session.touch();
  }
  next();
};

/**
 * Middleware to log session information (for debugging)
 * Only use in development
 * Only logs when session has user data to avoid spam
 */
export const sessionLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // Only log if session has user data (authenticated requests)
    if (req.session && req.session.userId) {
      console.log('Session Info:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        email: req.session.userEmail,
      });
    }
  }
  next();
};
