import {
  DEFAULT_FEEDBACK_TICKET_FRAMEWORK,
  type ZCodeProvider,
  type FeedbackTicketFramework,
} from "@s-agent/shared";

export function inferFeedbackFrameworkFromAgentProvider(
  _provider: ZCodeProvider | null | undefined,
): FeedbackTicketFramework {
  return DEFAULT_FEEDBACK_TICKET_FRAMEWORK;
}
