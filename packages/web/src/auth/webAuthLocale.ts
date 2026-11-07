type WebAuthLocale = "zh-CN" | "en-US";

interface WebAuthPageCopy {
  brand: string;
  loginTitle: string;
  loginDescription: string;
}

const WEB_AUTH_COPY = {
  "zh-CN": {
    brand: "S-Agent",
    loginTitle: "账号登录已停用",
    loginDescription: "此版本不再提供账号登录，因此无法使用需要登录的 Web 远程控制。",
  },
  "en-US": {
    brand: "S-Agent",
    loginTitle: "Account sign-in is unavailable",
    loginDescription: "This version no longer provides account sign-in or authenticated web control.",
  },
} satisfies Record<WebAuthLocale, WebAuthPageCopy>;

function resolveWebAuthLocale(language?: string): WebAuthLocale {
  const candidate =
    language ??
    document.documentElement.lang ??
    navigator.language ??
    navigator.languages?.[0] ??
    "";

  return candidate.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

export function getWebAuthCopy(locale: WebAuthLocale = resolveWebAuthLocale()): WebAuthPageCopy {
  return WEB_AUTH_COPY[locale];
}
