import { isZCodeAgentProvider, type ZCodeProvider } from "@s-agent/shared";
import type { ModelSelectionView } from "@s-agent/services";
import type { ModelSelectGroup } from "@/ModelConfigSelect.js";
import {
  decodeCustomModelValue,
  encodeCustomModelValue,
} from "@/lib/zcodeCustomModelValue.js";
import { shouldShowModelVisionBadge } from "@/lib/modelVisionBadge.js";

export interface ModelProviderGroupLabelOptions {
  apiKeyLabel?: string;
  apiKeyBadgeLabel?: string;
  codingPlanLabel?: string;
  codingPlanBadgeLabel?: string;
  startPlanLabel?: string;
  startPlanBadgeLabel?: string;
  teamPlanBadgeLabel?: string;
  teamPlanFallbackLabel?: string;
}

function supportsRegistryApiFormat(
  selectedProvider: ZCodeProvider,
  apiFormat: string | null | undefined,
): boolean {
  if (!apiFormat) return false;
  // 仅剩 glm（ZCode Agent）provider；三方 CLI 的 api format 差异已随 provider 下线。
  return isZCodeAgentProvider(selectedProvider);
}

export function buildRegistryModelSelectGroups(
  selectedProvider: ZCodeProvider,
  view: ModelSelectionView,
  labels: ModelProviderGroupLabelOptions = {},
): ModelSelectGroup[] {
  return view.providers.flatMap((provider) => {
    const accessType = provider.config.access?.type;
    if (
      !supportsRegistryApiFormat(selectedProvider, provider.config.api?.type) ||
      accessType === "zhipu-account" ||
      accessType === "zhipu-coding-plan-api-key"
    ) {
      return [];
    }

    // 合并菜单仍需区分同名供应商的接入方式；API 标识直接来自 access，不能从名称猜测。
    const labelBadge =
      accessType === "api-key" ? (labels.apiKeyBadgeLabel ?? "API") : undefined;

    return [
      {
        key: `registry-provider:${provider.providerId}`,
        label: provider.providerName?.trim() || provider.providerId,
        ...(provider.config.logo ? { logo: provider.config.logo } : {}),
        ...(labelBadge ? { labelBadge } : {}),
        items: provider.models.map(({ modelId, config }) => ({
          key: `registry-provider:${provider.providerId}:${modelId}`,
          value: encodeCustomModelValue(provider.providerId, modelId),
          name: modelId,
          ...(shouldShowModelVisionBadge(
            modelId,
            config.properties?.inputFormat?.supportsImage,
            provider.config.access,
          )
            ? { supportsVisionInput: true }
            : {}),
        })),
      },
    ];
  });
}

export function resolveModelDisplayName(
  modelGroups: readonly ModelSelectGroup[],
  value: string,
): string | null {
  for (const group of modelGroups) {
    const matched = group.items.find((item) => item.value === value);
    if (matched) return matched.name;
  }

  return decodeCustomModelValue(value)?.modelName ?? null;
}
