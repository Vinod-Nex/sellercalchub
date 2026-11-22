import { handleFeedbackRequest, type FeedbackWorkerEnv } from '../src/lib/feedback-worker';

export default {
  async fetch(request: Request, env: FeedbackWorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/report-fee' || url.pathname === '/') {
      return handleFeedbackRequest(request, env);
    }
    return new Response('Not Found', { status: 404 });
  },
};
