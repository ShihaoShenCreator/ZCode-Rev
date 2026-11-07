import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BUILTIN_MODEL_PROVIDER_IDS } from "@s-agent/shared";
import {
  TID_CHAT_MODEL_SELECT_TRIGGER,
  TID_MODEL_PROVIDER_NAV_ITEM,
  TID_SETTINGS_SECTION_NAV,
  TID_TASK_SETTINGS_BUTTON,
  testId,
} from "@s-agent/shared/test-ids";
import {
  clearAppData,
  DEFAULT_WORKSPACE,
  clickTestIdByDom,
  getE2EAppDataPaths,
  setCurrentElectronRendererContentSize,
  restoreElectronRendererContentSize,
} from "../helpers/desktop-app.js";
import { restartIntoWorkspaceRestoringPreferences } from "../helpers/model-provider-restart-runtime.js";
import { prepareV4ConversationE2E } from "../helpers/v4-conversation.js";
import { skipOccupationOnboardingIfPresent } from "../helpers/occupation-onboarding.js";
import { sel } from "../helpers/selectors.js";

describe("S-Agent no longer exposes retired account-provider surfaces", () => {
  let originalSize: Awaited<ReturnType<typeof setCurrentElectronRendererContentSize>> | undefined;
  afterEach(async () => {
    if (originalSize) await restoreElectronRendererContentSize(originalSize);
    originalSize = undefined;
  });
  after(async () => {
    await clearAppData();
  });

  for (const family of ["bigmodel", "zai"] as const) {
    for (const locale of ["zh-CN", "en-US"] as const) {
      it(`ignores legacy ${family} settings in ${locale}`, async function () {
        this.timeout(180000);
        await skipOccupationOnboardingIfPresent();
        await prepareV4ConversationE2E({ skipProvider: true });
        await restartIntoWorkspaceRestoringPreferences(DEFAULT_WORKSPACE, {
          afterElectronProcessExit: async () => {
            const file = join(getE2EAppDataPaths().appDataDir, "setting.json");
            const settings = JSON.parse(await readFile(file, "utf8"));
            await writeFile(
              file,
              JSON.stringify({
                ...settings,
                locale,
                localePreference: locale,
                providerFamilyDomain: family,
                providerFamilyDomainMigrated: true,
                providerFamilyConnectionSelections: {},
              }),
            );
          },
        });
        originalSize = await setCurrentElectronRendererContentSize(1280, 800);
        await browser.execute(
          (theme) => {
            const actions = (
              window as typeof window & { __testActions?: { setTheme?: (value: string) => void } }
            ).__testActions;
            if (!actions?.setTheme) throw new Error("missing setTheme action");
            actions.setTheme(theme);
          },
          locale === "zh-CN" ? "dark" : "light",
        );
        await clickTestIdByDom(TID_TASK_SETTINGS_BUTTON);

        const modelPicker = $(sel(TID_CHAT_MODEL_SELECT_TRIGGER));
        await modelPicker.waitForDisplayed({ timeout: 15000 });
        await modelPicker.click();
        await browser.waitUntil(
          async () => (await $("body").getText()).length > 0,
          { timeout: 10000, timeoutMsg: "模型选择菜单未打开" },
        );
        expect(await $("body").getText()).not.toMatch(/Z\.ai|BigModel|Coding Plan|Start Plan/i);
        await browser.keys("Escape");

        await clickTestIdByDom(testId(TID_SETTINGS_SECTION_NAV, "modelProvider"));
        const retiredProviderIds = [
          BUILTIN_MODEL_PROVIDER_IDS.zaiIndividualCodingPlan,
          BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan,
          BUILTIN_MODEL_PROVIDER_IDS.zaiStartPlan,
          BUILTIN_MODEL_PROVIDER_IDS.bigmodelIndividualCodingPlan,
          BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan,
          BUILTIN_MODEL_PROVIDER_IDS.bigmodelStartPlan,
        ];
        for (const providerId of retiredProviderIds) {
          for (const key of [
            `preset:${providerId}`,
            `coding-plan:${providerId}`,
            `team-plan:${providerId}`,
          ]) {
            expect(await $$(sel(testId(TID_MODEL_PROVIDER_NAV_ITEM, key)))).toHaveLength(0);
          }
        }

        await clickTestIdByDom(testId(TID_SETTINGS_SECTION_NAV, "usage"));
        const usageBody = await $("body").getText();
        expect(usageBody).toMatch(locale === "zh-CN" ? /时间范围/ : /Time range/);
        expect(usageBody).not.toMatch(/Z\.ai|BigModel|Coding Plan|Start Plan/i);
      });
    }
  }
});
