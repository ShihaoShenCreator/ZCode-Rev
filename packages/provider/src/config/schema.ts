import { z } from "zod";
import { modelConfigDataSchema } from "@s-agent/shared/model-config";
import { providerConfigDataSchema, zhipuAccountAccessDataSchema } from "./provider-data-schema.js";
import { ModelConfig, ModelConfigRules } from "./model-config.js";
import {
  ApiKeyAccessConfig,
  ProviderApiConfig,
  ProviderConfig,
  ProviderConfigMap,
  ProviderTemplate,
  ProviderTemplateMap,
  ZhipuAccountAccessConfig,
} from "./provider-config.js";
import {
  builtinModelConfigRulesSchema,
  personalModelConfigRulesSchema,
  builtinProviderConfigRulesSchema,
  personalProviderConfigRulesSchema,
  providerConfigRuleSchema,
  providerTemplateConfigRuleSchema,
  builtinProviderConfigRuleSchema,
  type ProviderConfigRuleData,
  type ProviderTemplateConfigRuleData,
} from "./rule-data-schema.js";

const accountProviderConfigSchema = providerConfigDataSchema
  .pick({ builtinModelIds: true })
  .extend({
    access: zhipuAccountAccessDataSchema.pick({ type: true, entitled: true }).nullable().optional(),
  });

export function parseProviderConfigMap(input: unknown): ProviderConfigMap {
  return createProviderRules(z.array(providerConfigRuleSchema).parse(input));
}

export function parseZCodeBuiltinProviderConfigMap(input: unknown): ProviderConfigMap {
  return createProviderRules(
    z
      .array(builtinProviderConfigRuleSchema)
      .parse(input)
      .filter((rule) => !isRetiredNativeProviderRule(rule)),
  );
}

export function parseProviderTemplateMap(input: unknown): ProviderTemplateMap {
  return createTemplateRules(z.array(providerTemplateConfigRuleSchema).parse(input));
}

export function parseZCodeBuiltinProviderConfigRules(input: unknown): {
  providers: ProviderConfigMap;
  providerTemplates: ProviderTemplateMap;
} {
  const parsed = builtinProviderConfigRulesSchema.parse(input);
  return {
    providers: createProviderRules(
      parsed.providerRules.filter((rule) => !isRetiredNativeProviderRule(rule)),
    ),
    providerTemplates: createTemplateRules(
      parsed.templateRules.filter((rule) => !isRetiredNativeProviderRule(rule)),
    ),
  };
}

export function parsePersonalProviderConfigMap(input: unknown): ProviderConfigMap {
  return createProviderRules(personalProviderConfigRulesSchema.parse(input).providerRules);
}

/** Account 运行时事实仍只有成员及权益；不是磁盘配置规则的第二种格式。 */
export function parseAccountProviderConfigMap(input: unknown): ProviderConfigMap {
  const parsed = z.record(z.string().min(1), accountProviderConfigSchema).parse(input);
  return new ProviderConfigMap(
    Object.entries(parsed).map(([providerId, config]) => [
      providerId,
      createProviderConfig(config),
    ]),
  );
}

export function parseProviderConfig(input: unknown): ProviderConfig {
  return createProviderConfig(providerConfigDataSchema.parse(input));
}

export function parseModelConfig(input: unknown): ModelConfig {
  return createModelConfig(modelConfigDataSchema.parse(input));
}

export function parseZCodeBuiltinModelConfigRules(input: unknown): ModelConfigRules {
  const parsed = builtinModelConfigRulesSchema.parse(input);
  return new ModelConfigRules([
    ...parsed.modelRules.map((rule) => ({
      ...rule,
      type: "model" as const,
      config: createModelConfig(rule.config),
    })),
    ...parsed.modelApiRules.map((rule) => ({
      ...rule,
      type: "model-api" as const,
      config: createModelConfig(rule.config),
    })),
    ...parsed.providerSiteRules
      .filter((rule) => !isRetiredNativeEndpoint(rule.baseUrlMatch))
      .map((rule) => ({
        ...rule,
        type: "provider-site" as const,
        config: createModelConfig(rule.config),
      })),
    ...parsed.templateModelRules
      .filter((rule) => !isRetiredNativeProviderTemplateId(rule.templateId))
      .map((rule) => ({
        ...rule,
        type: "template-model" as const,
        config: createModelConfig(rule.config),
      })),
    ...parsed.builtinProviderModelRules
      .filter((rule) => !isRetiredNativeProviderId(rule.providerId))
      .map((rule) => ({
        ...rule,
        type: "provider-model" as const,
        config: createModelConfig(rule.config),
      })),
  ]);
}

const RETIRED_NATIVE_PROVIDER_TEMPLATE_IDS = new Set([
  "zai-api",
  "zai-standard-api",
  "bigmodel-api",
  "bigmodel-standard-api",
]);

function isRetiredNativeProviderTemplateId(templateId: string | null | undefined): boolean {
  return templateId != null && RETIRED_NATIVE_PROVIDER_TEMPLATE_IDS.has(templateId);
}

function isRetiredNativeProviderId(providerId: string | null | undefined): boolean {
  return providerId?.startsWith("account:zai-") === true ||
    providerId?.startsWith("account:bigmodel-") === true;
}

function isRetiredNativeProviderRule(
  rule: ProviderConfigRuleData | ProviderTemplateConfigRuleData,
): boolean {
  const { access, api, logo } = rule.config;
  const group = "group" in rule.config ? rule.config.group : undefined;
  return (
    isRetiredNativeProviderTemplateId("templateId" in rule ? rule.templateId : undefined) ||
    isRetiredNativeProviderId("providerId" in rule ? rule.providerId : undefined) ||
    access?.type === "zhipu-account" ||
    access?.type === "zhipu-coding-plan-api-key" ||
    group === "zai-family" ||
    group === "bigmodel-family" ||
    logo?.key === "zai" ||
    logo?.key === "bigmodel" ||
    isRetiredNativeEndpoint(api?.baseUrl)
  );
}

function isRetiredNativeEndpoint(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().replace(/\\\./gu, ".");
  return /(?:^|[^a-z0-9.-])(?:[a-z0-9-]+\.)*z\.ai(?:[^a-z0-9.-]|$)/u.test(normalized) ||
    /(?:^|[^a-z0-9.-])(?:[a-z0-9-]+\.)*bigmodel\.cn(?:[^a-z0-9.-]|$)/u.test(normalized);
}

export function parsePersonalModelConfigRules(input: unknown): ModelConfigRules {
  const parsed = personalModelConfigRulesSchema.parse(input);
  return new ModelConfigRules([
    ...parsed.providerModelRules.map((rule) => ({
      ...rule,
      type: "provider-model" as const,
      config: createModelConfig(rule.config),
    })),
    ...parsed.manualProviderModelRules.map((rule) => ({
      ...rule,
      type: "manual-provider-model" as const,
      config: createModelConfig(rule.config),
    })),
  ]);
}

function createProviderRules(rules: readonly ProviderConfigRuleData[]): ProviderConfigMap {
  return new ProviderConfigMap(
    rules.map(({ config, ...rule }) => ({
      ...rule,
      config: createProviderConfig(config),
    })),
  );
}

function createTemplateRules(
  rules: readonly ProviderTemplateConfigRuleData[],
): ProviderTemplateMap {
  return new ProviderTemplateMap(
    rules.map((rule) => [
      rule.templateId,
      new ProviderTemplate({ ...rule, config: createProviderConfig(rule.config) }),
    ]),
  );
}

function createProviderConfig(config: z.infer<typeof providerConfigDataSchema>): ProviderConfig {
  return new ProviderConfig({
    ...config,
    access:
      config.access == null
        ? config.access
        : config.access.type !== "zhipu-account"
          ? new ApiKeyAccessConfig(config.access)
          : new ZhipuAccountAccessConfig(config.access),
    api: config.api == null ? config.api : new ProviderApiConfig(config.api),
  });
}

function createModelConfig(config: z.infer<typeof modelConfigDataSchema>): ModelConfig {
  return ModelConfig.fromData(config);
}
