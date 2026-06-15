import serverless from 'serverless-http';
import app from '../backend/src/app';

const handler = serverless(app);

module.exports = async (req: any, res: any) => {
  // Express routes are prefixed with /api (e.g. /api/auth/login)
  // Vercel passes the full path including /api so no rewriting needed
  return handler(req, res);
};
