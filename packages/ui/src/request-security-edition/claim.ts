import type { ICodingPlanSubscriptionService } from "@s-agent/services";
import type { RequestVerificationProof } from "@s-agent/shared";
export function useRequestVerificationPrewarm(_visible: boolean): void {}
export async function prepareRequestVerificationClaim(
  _service: ICodingPlanSubscriptionService,
  signal: AbortSignal,
  _onVerifying: () => void,
): Promise<RequestVerificationProof | undefined> {
  signal.throwIfAborted();
  return {};
}
