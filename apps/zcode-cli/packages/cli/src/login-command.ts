import { formatJson } from "@s-agent/core";
import type { GlobalOptions, RunContext } from "@s-agent/shared-types";
import type { RunDependencies } from "./cli-types.js";

const LOGIN_RETIRED_MESSAGE =
  "S-Agent no longer supports account sign-in. Configure a custom provider instead.";
const LOGOUT_RETIRED_MESSAGE =
  "Account sign-out is no longer available. Existing credentials are left untouched and will not be used.";

export async function runLoginCommand(
  ctx: RunContext,
  options: GlobalOptions,
  _deps: RunDependencies,
  _noBrowser: boolean,
  _args: readonly string[] = [],
): Promise<number> {
  if (options.json) {
    ctx.stdout.write(formatJson({ status: "error", code: "account_login_retired", message: LOGIN_RETIRED_MESSAGE }));
  } else {
    ctx.stderr.write(`Error: ${LOGIN_RETIRED_MESSAGE}\n`);
  }
  return 1;
}

export async function runLogoutCommand(
  ctx: RunContext,
  options: GlobalOptions,
  _deps: RunDependencies,
): Promise<number> {
  if (options.json) {
    ctx.stdout.write(
      formatJson({
        status: "error",
        code: "account_logout_retired",
        message: LOGOUT_RETIRED_MESSAGE,
      }),
    );
  } else {
    ctx.stderr.write(`${LOGOUT_RETIRED_MESSAGE}\n`);
  }
  return 1;
}
