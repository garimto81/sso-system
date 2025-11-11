/**
 * HTTPS Redirect Middleware
 * Forces HTTPS in production environment
 */

export function httpsRedirect(req, res, next) {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is already secure
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // Redirect HTTP to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  console.log(`🔒 Redirecting to HTTPS: ${httpsUrl}`);
  res.redirect(301, httpsUrl);
}
