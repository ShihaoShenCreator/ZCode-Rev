import { SAgentAppLogo } from "@s-agent/ui/app-logo";
import { getWebAuthCopy } from "./webAuthLocale.js";

export function WebLoginPage() {
  const copy = getWebAuthCopy();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-sm rounded-lg border border-card-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <SAgentAppLogo className="size-10" />
          <div className="min-w-0">
            <div className="text-ui-xs font-medium text-foreground">{copy.brand}</div>
            <h1 className="text-ui-lg font-medium text-foreground">{copy.loginTitle}</h1>
          </div>
        </div>
        <p className="mb-5 text-ui-xs leading-6 text-foreground-subtle">{copy.loginDescription}</p>
      </section>
    </main>
  );
}
