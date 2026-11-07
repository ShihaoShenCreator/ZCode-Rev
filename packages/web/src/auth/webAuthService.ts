import { BrowserOAuthCredentialRepo } from "./browserOAuthCredentialRepo.js";

interface WebAuthServiceDependencies {
  repo?: BrowserOAuthCredentialRepo;
}

export class WebAuthService {
  private readonly repo: BrowserOAuthCredentialRepo;

  constructor(dependencies: WebAuthServiceDependencies = {}) {
    this.repo = dependencies.repo ?? new BrowserOAuthCredentialRepo();
    this.repo.clearAll();
  }

  getZCodeJwtToken(): null {
    return null;
  }

  async logout(): Promise<void> {
    this.repo.clearAll();
  }
}

export function createWebAuthService(): WebAuthService {
  return new WebAuthService();
}
