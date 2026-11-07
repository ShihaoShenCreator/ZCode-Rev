import { Button } from "./components/ui/button.js";
import { SAgentAboutLogo } from "@/components/ui/ZCodeAboutLogo.js";
import { useZCodeIntl } from "./i18n/IntlProvider.js";
import { ThemeHeroVisual } from "./openWorkspacePageThemeHero.js";
import { DesktopOverlayWindowControls } from "@/DesktopOverlayWindowControls.js";

interface WelcomeScreenProps {
  onComplete: (reason: LoginCompleteReason) => void | Promise<void>;
}

export type LoginCompleteReason = "skip";

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { intl } = useZCodeIntl();

  return (
    <main className="relative flex h-full min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6">
      <ThemeHeroVisual className="absolute inset-0" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex h-12 items-center [app-region:drag] platform-windows-desktop:right-[134px] platform-linux-desktop:right-[134px]" />
      <DesktopOverlayWindowControls />
      <section className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-popover-border bg-background p-8 text-center text-ui-base/relaxed shadow-md sm:p-10">
        <SAgentAboutLogo className="h-auto w-16" />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {intl.formatMessage({ id: "login.title" })}
          </h1>
          <p className="text-ui-base/relaxed text-foreground-subtle">
            {intl.formatMessage({ id: "login.description" })}
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => void onComplete("skip")}
        >
          {intl.formatMessage({ id: "login.skip" })}
        </Button>
      </section>
    </main>
  );
}
