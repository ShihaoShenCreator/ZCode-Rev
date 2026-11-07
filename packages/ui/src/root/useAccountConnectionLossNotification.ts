import { useEffect, useRef } from "react";
import type { IServiceAccessor } from "@s-agent/services";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { toast, dismissToast } from "@/components/ui/toast.js";
import {
  createAccountConnectionRefreshObserver,
  type AccountConnectionLoss,
} from "@/root/accountConnectionRefreshObserver.js";
import { logger } from "@/logger.js";

/**
 * 账号连接失效只做状态提示。
 * S-Agent 去集成：替代套餐切换建议（Coding Plan/Start Plan/Team）已退役，
 * 通用账号连接不可用提示保留，适用于任何携带 accountState 的 Provider。
 */
export function useAccountConnectionLossNotification(
  services: IServiceAccessor,
  intentKey: string,
  refreshAppSettings?: () => Promise<void>,
) {
  const { intl } = useZCodeIntl();
  const latest = useRef({ intl, refreshAppSettings });
  latest.current = { intl, refreshAppSettings };
  const observerRef = useRef<ReturnType<typeof createAccountConnectionRefreshObserver> | null>(
    null,
  );
  const noticeRef = useRef<{ id: number; event: AccountConnectionLoss } | null>(null);
  useEffect(() => {
    // 设置/登录意图先于 Account 查询回包变化；即使切走又切回，旧提示也不能残留。
    observerRef.current?.invalidate();
    if (noticeRef.current) dismissToast(noticeRef.current.id);
    noticeRef.current = null;
  }, [intentKey]);
  useEffect(() => {
    const observer = createAccountConnectionRefreshObserver(async (event) => {
      if (!event.isCurrent()) return;
      const id = toast(
        latest.current.intl.formatMessage({ id: "settings.modelProvider.connectionUnavailableNotice" }),
        { variant: "info", durationMs: 12000 },
      );
      noticeRef.current = { id, event };
    });
    observerRef.current = observer;
    const accept = (view: Parameters<typeof observer.accept>[0]) => {
      void observer.accept(view);
      const notice = noticeRef.current;
      if (notice && !notice.event.isCurrent()) {
        dismissToast(notice.id);
        noticeRef.current = null;
      }
    };
    const subscription = services.providerSettingsService.onDidChange(accept);
    void services.providerSettingsService
      .getView()
      .then(accept)
      .catch((error) => {
        logger.lifecycle.warn("[AccountConnection] 初次读取失败，等待正常刷新", { error });
      });
    return () => {
      observer.dispose();
      observerRef.current = null;
      subscription.dispose();
      if (noticeRef.current) dismissToast(noticeRef.current.id);
      noticeRef.current = null;
    };
  }, [services]);
}
