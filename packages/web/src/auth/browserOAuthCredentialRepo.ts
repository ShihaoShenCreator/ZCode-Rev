const LEGACY_OAUTH_STORAGE_KEYS = [
  "oauth:active_provider",
  "zcodejwttoken",
  "oauth:zai:access_token",
  "oauth:zai:user_info",
  "oauth:bigmodel:access_token",
  "oauth:bigmodel:user_info",
  "oauth_pending_logins",
] as const;

export type WebOAuthProviderId = "zai" | "bigmodel";

export class BrowserOAuthCredentialRepo {
  constructor(private readonly localStorage: Storage = window.localStorage) {}

  clearAll(): void {
    for (const key of LEGACY_OAUTH_STORAGE_KEYS) {
      this.localStorage.removeItem(key);
    }
  }
}
