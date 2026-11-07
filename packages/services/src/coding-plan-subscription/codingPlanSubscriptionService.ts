import {
  ApiError,
  applyDynamicWorkflowUserMode,
  buildRuntimeZCodeApiUrl,
  CODING_PLAN_SYSTEM_BUSY,
  createDynamicWorkflowClientConfig,
  DEFAULT_DYNAMIC_WORKFLOW_MODE,
  normalizeDynamicWorkflowMode,
  readValidatedRequestVerificationConfig,
  resolveDynamicWorkflowClientConfig,
  ZCODE_DYNAMIC_WORKFLOW_MODE_ENV,
  ZCODE_VERSION,
  type ApiClient,
  type ApiRequestInit,
  type DynamicWorkflowClientConfig,
  type RequestVerificationClientConfig,
} from "@s-agent/shared";
import { createServiceLogger } from "../logger/serviceLogger.js";
import { readApiJson } from "../providers/api/apiJson.js";
import type { ICodingPlanSubscriptionService } from "./codingPlanSubscription.js";

const REQUEST_TIMEOUT_MS = 15_000;
const CLIENT_CONFIG_CACHE_TTL_MS = 60 * 60 * 1000;
const ZCODE_CLIENT_CONFIG_API_PREFIX = "/api/v1/client/configs";
const log = createServiceLogger("codingPlanSubscription");

interface ZCodeClientConfigEnvelope {
  code?: number;
  msg?: string;
  success?: boolean;
  data?: {
    configs?:
      | (RequestVerificationClientConfig & {
          // 动态工作流灰度：mode 的取值域由
          // shared 的 normalizeDynamicWorkflowMode 裁决，这里保持 unknown，不在类型层假设服务端合法。
          dynamicWorkflow?: {
            mode?: unknown;
          } | null;
        })
      | null;
  } | null;
}

interface CodingPlanSubscriptionServiceDependencies {
  apiClient: ApiClient;
  /**
   * 用户在设置里选的动态工作流模式（launch.md「The user's choice」）。只有拥有设置权威的装配
   * （desktop 本地 Host、web/standalone server）注入；缺省时快照只含服务端的「提供」。
   */
  resolveDynamicWorkflowUserMode?: () => Promise<unknown>;
}

/**
 * 原 service 委托 BigModel/Zai 两个 provider；S-Agent 退役后只保留两条仍有存活消费者的
 * 平台级读路径（动态工作流灰度 + 请求验签配置），均来自 client/configs 通道，直接内联：
 *   - 动态工作流：请求失败 fail-closed（disabled/default），不阻断普通聊天；
 *   - 请求验签：坏配置必须抛错，不能按网络故障自动重试或打开跳过校验。
 */
export function createCodingPlanSubscriptionService(
  dependencies: CodingPlanSubscriptionServiceDependencies,
): ICodingPlanSubscriptionService {
  let clientConfigSnapshot: ZCodeClientConfigEnvelope | null = null;
  let clientConfigSnapshotExpiresAt = 0;
  let clientConfigRequest: Promise<ZCodeClientConfigEnvelope> | null = null;

  async function getClientConfigs(): Promise<ZCodeClientConfigEnvelope> {
    if (clientConfigSnapshot && clientConfigSnapshotExpiresAt > Date.now()) {
      return clientConfigSnapshot;
    }
    if (clientConfigRequest) {
      return await clientConfigRequest;
    }

    // client/configs 和其他 ZCode 平台接口必须共享运行时 endpoint；
    // E2E/测试环境会通过 ZCODE_BASE_URL 指向本地 mock，硬编码线上域名会让配置状态不可控。
    const url = resolveCodingPlanClientConfigUrl(process.env);
    url.searchParams.set("app_version", ZCODE_VERSION);
    url.searchParams.set("platform", resolveClientPlatformKey());
    clientConfigRequest = readCodingPlanApiJson<ZCodeClientConfigEnvelope>(dependencies.apiClient, url, {
      method: "GET",
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
    try {
      const payload = await clientConfigRequest;
      clientConfigSnapshot = payload;
      clientConfigSnapshotExpiresAt = Date.now() + CLIENT_CONFIG_CACHE_TTL_MS;
      return payload;
    } finally {
      clientConfigRequest = null;
    }
  }

  // 用户选择在这里套到「提供」上，renderer 读到的就是生效值；规则只写在 shared 的
  // applyDynamicWorkflowUserMode 里，renderer 不自己算。
  const applyUserMode = async (
    offer: DynamicWorkflowClientConfig,
  ): Promise<DynamicWorkflowClientConfig> => {
    const resolveUserMode = dependencies.resolveDynamicWorkflowUserMode;
    return resolveUserMode ? applyDynamicWorkflowUserMode(offer, await resolveUserMode()) : offer;
  };

  return {
    /**
     * 动态工作流灰度快照：与 client/configs 同源。三条边界：
     *   1. 本地覆盖（ZCODE_DYNAMIC_WORKFLOW_MODE）在任何网络动作之前裁决，命中即返回——
     *      preview 构建和开发者手测因此不受 1h 快照与首次 Host 竞态影响；
     *   2. forceRefresh 清掉快照后重拉（灰度翻转最长 1h 不可见）；
     *   3. 请求失败 fail-closed：返回 default（disabled）并 warn，绝不把异常抛给调用方——
     *      调用方在 session create/client 就绪路径上，灰度读失败不能阻断普通聊天。
     */
    getDynamicWorkflowClientConfig: async (options) => {
      // 覆盖合法即短路：判据（normalize）与快照构造（resolve）都留在 shared，这里不复述取值域。
      if (normalizeDynamicWorkflowMode(process.env[ZCODE_DYNAMIC_WORKFLOW_MODE_ENV])) {
        return applyUserMode(resolveDynamicWorkflowClientConfig({ remote: undefined, env: process.env }));
      }
      if (options?.forceRefresh) {
        clientConfigSnapshot = null;
        clientConfigSnapshotExpiresAt = 0;
      }
      let offer: DynamicWorkflowClientConfig;
      try {
        const payload = await getClientConfigs();
        offer = resolveDynamicWorkflowClientConfig({
          remote: payload.data?.configs?.dynamicWorkflow,
          env: process.env,
        });
      } catch (error) {
        log.warn(undefined, "动态工作流灰度配置读取失败，按关闭处理", {
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        offer = createDynamicWorkflowClientConfig(DEFAULT_DYNAMIC_WORKFLOW_MODE, "default");
      }
      return applyUserMode(offer);
    },

    getRequestVerificationConfig: async () => {
      const payload = await getClientConfigs();
      // HTTP 成功不等于配置有效；坏配置不能按网络故障自动重试，更不能打开跳过校验。
      if ((payload.code !== undefined && payload.code !== 0) || payload.success === false) {
        throw new Error("Request verification configuration is invalid");
      }
      return readValidatedRequestVerificationConfig(payload.data?.configs);
    },
  };
}

function resolveCodingPlanClientConfigUrl(env: NodeJS.ProcessEnv): URL {
  return new URL(buildRuntimeZCodeApiUrl(env, ZCODE_CLIENT_CONFIG_API_PREFIX));
}

function resolveClientPlatformKey(): string {
  return `${process.platform}-${process.arch}`;
}

async function readCodingPlanApiJson<T>(
  apiClient: ApiClient,
  input: string | URL,
  init?: ApiRequestInit,
): Promise<T> {
  try {
    return await readApiJson<T>(apiClient, input, init);
  } catch (error) {
    const message = readRemoteErrorMessage(error);
    if (isUnrenderableRemoteErrorMessage(message)) {
      // 支付接口偶发返回 WAF/HTML 页面或非 JSON 响应，原样透传会把整段
      // HTML 渲到确认支付页。服务边界先收敛为稳定错误码，UI 再做本地化提示。
      // HTML 只影响展示，不能丢掉 HTTP 状态和传输原因，否则配置读取无法区分 503 与 401。
      if (error instanceof ApiError) {
        throw new ApiError({
          message: CODING_PLAN_SYSTEM_BUSY,
          url: error.url,
          method: error.method,
          status: error.status,
          responseHeaders: error.responseHeaders,
          // 原 ApiError.message 可能是完整 HTML；只延续底层 cause，不把正文重新带入错误链。
          cause: error.cause,
        });
      }
      throw new Error(CODING_PLAN_SYSTEM_BUSY);
    }
    throw error;
  }
}

function readRemoteErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return String(error);
}

function isUnrenderableRemoteErrorMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return (
    normalized.startsWith("<!doctype") ||
    /<\s*(html|head|body|script|style|title|meta)\b/.test(normalized) ||
    normalized.includes("errors.aliyun.com") ||
    normalized.includes("request has been blocked") ||
    normalized.includes("unexpected token '<'") ||
    normalized.includes("unexpected end of json input") ||
    normalized.includes("invalid json response")
  );
}
