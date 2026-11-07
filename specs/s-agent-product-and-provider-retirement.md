# S-Agent 品牌与 Provider 去集成规格

## 状态

- 阶段：计划获批，实施中
- 产品名：S-Agent
- 范围：仓库内产品身份与 Z.ai、智谱/BigModel 原生集成

## 背景

当前产品在桌面、Web、CLI、workspace package、构建和文档中使用 ZCode 品牌；模型设置还包含 Z.ai 和 BigModel/智谱专属 provider、账号授权、Coding Plan 与用量/购买体验。本次将项目品牌改为 S-Agent，并完全退役这两类原生服务集成。

## 产品规则

1. 面向用户的产品名称统一为 **S-Agent**。CLI 命令使用 `s-agent`；workspace 包 scope 使用 `@s-agent/*`。仓库目录名、GitHub slug、远程 Git URL、官网/下载服务和社区目标不在本规格范围内。
2. 移除 Z.ai 与智谱/BigModel 专属原生 Provider 定义、登录/账号连接、凭据和 entitlement、Coding Plan 订阅与购买、Quota/usage API、专属 UI、默认入口、服务 URL 和当前产品文档/测试。Off-Peak 任务依赖 BigModel 专属资格、票据及模型服务，也停止新建、调度、同步和 UI 入口。
3. 保留通用 Provider registry/config/execution、用户创建的 custom Provider、endpoint/API key、OpenAI-compatible/Anthropic-compatible 接入和普通模型配置。不得因为模型字符串包含 GLM 或历史 Provider ID 而误删通用能力。
4. 保留非目标 Provider 的行为；移除目标集成不得改变其他 Provider 的可见性、认证、额度或设置状态。
5. 清理仓库产品介绍中的旧品牌和来源营销文案；保留 `LICENSE`、`NOTICE.md` 与第三方许可证要求的版权/归属信息。不得伪造新的支持、反馈、下载或服务 URL。
6. 持久化和兼容性逐项决策。迁移方案必须明确旧安装是否仍能更新、旧设置/凭据如何处置、旧数据目录如何读取、失败如何报错/回滚；不得通过静默切换路径造成空白 profile 或数据丢失。协议字段和历史数据 schema 不因品牌文案重命名而改变。

## 兼容性决策清单

在改相应值之前记录现状、消费者、是否为公开身份、迁移/兼容方案、验证证据：

| 标识 | 初始处置约束 |
|---|---|
| CLI `zcode` 命令及文档/自动补全 | 发布 `s-agent`；评估旧命令 alias 与包升级兼容 |
| `@zcode/*` workspace package names | 迁移到 `@s-agent/*` 并更新所有 manifest/import/filter/lock 引用 |
| Electron `appId`、更新渠道与签名身份 | 不直接替换；只有发行渠道及升级链路证明安全后才改 |
| Electron `userData`、CLI profile、`.zcode` 数据路径 | 优先保持原数据可读；若改路径，提供可重复、原子、可验证且失败显式的迁移 |
| `ZCODE_*` 环境变量和配置 key | 分别识别外部调用方；保留兼容读取或提供迁移，不作无证据批量替换 |
| IPC/RPC/stdio 协议字段及历史存储 schema | 非用户展示身份，不改名；若确需改变，需单独版本化迁移规格 |
| Z.ai/BigModel 凭据与专属配置 | 旧账号配置保持可读取但不进入运行时 Provider Registry；不迁移到通用 Provider，不读取或发送旧凭据。暂不清理旧加密凭据，避免不可逆修改用户 profile |
| Off-Peak 任务 | 保留本地任务记录和 schema，不迁移或删除；升级后不再读取/同步远端状态、不再调度或创建任务，也不发送远端取消请求 |
| Web OAuth 缓存与分享登录 | 首次启动清除浏览器中的旧 OAuth token/profile/pending-login 缓存；移除账号登录入口且不新增替代服务。匿名公开分享继续可读，依赖账号身份的私有分享不能再通过 Web 登录 |
| 官方反馈/下载 URL | 删除仓库内 Zhipu/Z.ai 专属反馈地址和下载跳转；没有新目标时不提供替代外链 |

## 状态所有者与边界

- `packages/provider` 的 registry/config/resolver 拥有 Provider 定义与候选解析。
- `packages/services` 下的账号、Coding Plan 和 usage 服务拥有远端集成及请求行为；UI 不拥有账户/额度事实。
- Desktop packaging 与 CLI entry/release 决定发行产品身份；用户数据仍由现有 runtime/config owners 持有。
- 改品牌不改变 Agent/session 协议、workspace identity、远端 owner/lease 或本地数据权威来源。

## 验收场景

1. 干净安装后的 Provider 设置、欢迎页和模型选择中不提供 Z.ai/BigModel 原生账户与计划入口；没有这些服务的请求、token 获取或购买跳转。
2. 其他 Provider 的配置、登录、用量/购买展示和模型选择保持既有行为。
3. 用户仍能创建和运行自定义兼容 Provider；自定义 GLM 模型 ID 可按用户配置正常使用，不出现 Z.ai/BigModel 内置 entitlement 或凭据耦合。
4. Composer Provider 菜单只列出目标 Host 当前 ModelSelectionView 中可执行的通用 Provider；切换 Provider 继续通过同一连接切换 owner、等待目标目录展示回执，并且不再读取或写入套餐连接选择。
5. Composer 上下文面板只展示会话自身的 token/context-window 用量；不再查询 Coding Plan/Start Plan 权益或提供套餐额度、重置、升级入口。
6. 会话发送遥测不再读取或上报 Coding Plan/Start Plan 身份；普通模型/provider 遥测保持不变。
7. 只验证已退役套餐入口/额度提醒及 Z.ai/BigModel 原生账号登录、套餐模型目录的 E2E 与浏览器 fixture 不再作为当前验收；通用 Provider 身份 E2E 保留。
8. 旧 ZCode 安装升级/启动后，规格中声明保留的用户数据、设置和会话可读取；迁移失败时明确报错，不覆盖源数据。
9. 新 desktop、Web、CLI 发行入口展示 S-Agent；CLI `s-agent`、workspace 构建与打包成功。旧入口按兼容性清单验证。
10. 当前活跃产品文档/配置/发布脚本不再把 Z.ai/BigModel 当作内置可用服务；法律归属、历史证据和通用模型文档符合规格。
11. 旧 Z.ai/BigModel 账号配置和凭据不会进入新 Provider Registry、不会触发请求，也不会迁移为自定义 Provider 的 API Key；用户仍可手动创建使用 GLM 模型 ID 的通用 Provider。
12. Off-Peak 入口和后台调度停止；启动时不请求其灰度、资格、额度、票据或模型配置 API，本地历史任务数据保持不变。

## 验证

- `pnpm typecheck`
- `pnpm lint`
- `pnpm architecture:check --changed`
- 相关 CLI 与 Desktop 构建、现有 Provider 设置/认证/模型执行 E2E 或浏览器验收
- 针对 Provider 配置、旧数据读取/迁移和新发行身份的可重复运行验证
