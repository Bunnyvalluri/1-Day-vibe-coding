import serverless from 'serverless-http';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import app from '../../backend/src/app';

const serverlessApp = serverless(app);

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Netlify strips the function name prefix from the path.
  // Express routes are defined with /api prefix, so we re-add it here.
  // e.g. incoming /.netlify/functions/api/auth/login → event.path = /auth/login
  // We rewrite to /api/auth/login so Express routes match.
  const modifiedEvent = {
    ...event,
    path: '/api' + (event.path || '/'),
  };
  return serverlessApp(modifiedEvent as any, context) as any;
};
