import type { ICredentialService } from "#src/credential/credential.js";

export async function isCurrentOAuthCredentialRequest(options: {
  headers: Headers;
  credentialService: Pick<ICredentialService, "load">;
}): Promise<boolean> {
  const authorization = options.headers.get("authorization")?.trim() ?? "";
  if (!authorization) return false;

  const currentJwt =
    (await options.credentialService.load("zcodejwttoken"))?.trim() ?? "";
  return Boolean(
    currentJwt &&
    (authorization === currentJwt || authorization === `Bearer ${currentJwt}`),
  );
}
