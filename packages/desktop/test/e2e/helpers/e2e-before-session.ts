export interface E2EBeforeSessionSetupOptions {
  cid: string;
  specs: string[];
  configureAgentServerEnv: () => void;
  resetCodingPlanTeamMockStateForSpecs: (specs: string[]) => Promise<void>;
  recordBeforeSession: (cid: string, specs: string[]) => void;
  resetHome: (specs: string[]) => Promise<void>;
  startCodingPlanTeamMockIfNeeded: (specs: string[]) => Promise<void>;
  startCodingPlanDataPlaneProxyIfNeeded: (specs: string[]) => Promise<void>;
  startCodingPlanUpgradeMockIfNeeded: (specs: string[]) => Promise<void>;
  startUpstreamHttpIfNeeded: (specs: string[]) => Promise<void>;
  startPluginCdnZipFixtureIfNeeded: (specs: string[]) => Promise<void>;
  startOffPeakMockIfNeeded: (specs: string[]) => Promise<void>;
}

export async function runE2EBeforeSessionSetup(options: E2EBeforeSessionSetupOptions) {
  options.recordBeforeSession(options.cid, options.specs);
  // 修复原因：并行 worker 的日志目录在 recordBeforeSession 内按 cid 设置；随后再配置
  // agent server，子进程才能继承 worker 专属的 ZCODE_LOG_DIR，而不会写到共享日志文件。
  options.configureAgentServerEnv();
  await options.startCodingPlanTeamMockIfNeeded(options.specs);
  // Coding Plan mock 在一次 WDIO run 内共享；每个 worker 启动 Electron 前都要重置，
  // 避免前一个 case 的套餐场景、额度和请求记录污染当前 case。
  await options.resetCodingPlanTeamMockStateForSpecs(options.specs);
  await options.startUpstreamHttpIfNeeded(options.specs);
  // 混合批次的 ToolSearch 不能关闭其他 worker 的账号数据面回放；代理在当前
  // worker 的上游网络配置完成后启动，避免被通用 replay 初始化恢复成直连。
  await options.startCodingPlanDataPlaneProxyIfNeeded(options.specs);
  await options.startCodingPlanUpgradeMockIfNeeded(options.specs);
  await options.startPluginCdnZipFixtureIfNeeded(options.specs);
  await options.startOffPeakMockIfNeeded(options.specs);
  // 修复原因：HOME 删除、重建和 fixture seed 是 Electron session 启动的前置事务；
  // 这里必须等待 reset 完成，否则 Windows 文件锁重试期间会用旧 HOME 启动新 Electron。
  await options.resetHome(options.specs);
}
