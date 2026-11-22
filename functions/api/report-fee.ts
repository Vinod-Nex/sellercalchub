import { handleFeedbackRequest, type FeedbackWorkerEnv } from '../../src/lib/feedback-worker';

export interface PagesContext {
  request: Request;
  env: FeedbackWorkerEnv;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return handleFeedbackRequest(context.request, context.env);
}

export async function onRequestOptions(context: PagesContext): Promise<Response> {
  return handleFeedbackRequest(context.request, context.env);
}
