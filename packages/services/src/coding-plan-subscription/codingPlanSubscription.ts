import type {
  DynamicWorkflowClientConfig,
  RequestVerificationConfig,
} from "@s-agent/shared";
import type { ModelSelectionView } from "@s-agent/provider";
import { ServiceChannels } from "@s-agent/shared";
import { createServiceDescriptor } from "../descriptors.js";

/**
 * 闲时任务灰度配置。Off-Peak 远端链路已退役，服务不再提供读取接口；
 * 该类型仅作为 zcode-agent 中已禁用工具装配的编译期契约保留。
 */
export interface OffPeakClientConfig {
  readonly enabled: boolean;
  readonly modelSelectionView: ModelSelectionView;
  /** mock 演示强制通道：真实路径不下发，UI 使用 Host 的 Account support。 */
  readonly codingPlanActive?: boolean;
}

export interface ICodingPlanSubscriptionService {
  /**
   * 动态工作流灰度快照：远端 `configs.dynamicWorkflow.mode`
   * 与本地覆盖折叠后的结果；forceRefresh 绕过 1h 快照缓存。请求失败 fail-closed（disabled/default）。
   */
  getDynamicWorkflowClientConfig(options?: {
    forceRefresh?: boolean;
  }): Promise<DynamicWorkflowClientConfig>;
  getRequestVerificationConfig(): Promise<RequestVerificationConfig | null>;
}

export const ICodingPlanSubscriptionService =
  createServiceDescriptor<ICodingPlanSubscriptionService>(ServiceChannels.CodingPlanSubscription);
