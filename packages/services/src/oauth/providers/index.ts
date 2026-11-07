import type { ApiClient } from "@s-agent/shared";
import type { OAuthRuntimeConfig } from "../runtimeConfig.js";
import type { OAuthProviderAdapter } from "./providerAdapter.js";

/** Native account providers are retired; keep the adapter seam for future non-account providers. */
export function createOAuthProviderAdapters(
  _config: OAuthRuntimeConfig,
  _options: { apiClient?: ApiClient } = {},
): OAuthProviderAdapter[] {
  return [];
}

export type { OAuthProviderAdapter, OAuthProviderContext } from "./providerAdapter.js";
