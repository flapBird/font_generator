# AI Font 转化分析接入说明（GA4）

当前产品是**一次性购买的积分包**。线上已有 GA4 网站数据流，测量 ID 为
`G-P3P9SJKZEG`。浏览器事件仅在 `font-generators.org` 和
`www.font-generators.org` 上报，本地开发和预览环境不发送。
请沿用现有 Google 代码，避免重复添加，或通过 GTM 再次触发相同事件。

## 配置进度（2026-10-24）

- 已在 GA4 后台核对账号 `308210524`、媒体资源 `546971242`、网站数据流
  `15316923834`、网站 `https://font-generators.org` 和测量 ID `G-P3P9SJKZEG`。
- 已保存下文列出的 7 个事件级自定义维度。
- 已保存增强型衡量设置：关闭基于浏览器历史记录的页面变化事件，关闭自动表单互动事件。
  已确认 `purchase` 是关键事件；核对时尚无该事件的数据流数据。
- **待完成：**保存两条漏斗探索和排除内部用户的细分。浏览器控制连接持续超时，
  尚未进入漏斗编辑器完成保存。下文提供具体配置步骤，不能据此认定漏斗已创建。
- **待部署：**执行新数据库迁移、配置真实的运行时 MP 密钥并部署应用。
  尚未创建或配置 MP 密钥，也未发送真实付款、邮件或 GA 事件进行验证。

## 部署与环境变量

1. 在现有账号、账单迁移之后，执行
   `supabase/migrations/202610230001_analytics_funnel.sql`。
   该迁移增加可选的订单归因信息、持久化事件时间，以及仅供服务角色访问的发送队列。
   历史购买记录不会自动补报。
2. 打开 GA4「管理 → 数据流」（Admin → Data streams），核对上述网站和测量 ID。
   获取**该数据流**的 Measurement Protocol API 密钥，并将其配置为服务端运行时密钥
   `GA4_MEASUREMENT_PROTOCOL_SECRET`。不得使用 `NEXT_PUBLIC_` 前缀，
   不得将密钥提交到 Git、放入浏览器代码，或把包含密钥的 MP 请求 URL 写入日志。
3. 可选运行时变量 `GA4_INTERNAL_EMAILS` 用于填写内部测试账号邮箱，以逗号或换行分隔。
   `AI_FONT_CHECKOUT_ALLOWLIST` 中的账号也会被标记为内部用户，即使已经设置
   `AI_FONT_CHECKOUT_MODE=public` 仍然如此。内部测试账号应保留在其中一个名单中。
4. 复用现有 `AI_FONT_APP_URL`（线上 HTTPS 源站地址）、Supabase 服务角色配置、
   `AI_FONT_CRON_SECRET`，以及每 5 分钟运行一次的 Worker Cron 定时任务。
   分析事件通过已有、经过鉴权的对账路由独立发送。未配置分析服务时会停用事件发送，
   不影响付款功能。
5. 完成迁移后部署代码，再按下文配置 GA4 报告。这两个 GA4 环境变量属于运行时配置，
   修改后无需重新构建前端；托管平台仍可能要求部署新的 Worker 配置或版本，使设置生效。

本文和 `.env.example` 中均不得填写真实 GA4 密钥。

## 数据存储与查看入口

| 数据 | 存储位置 | 查看入口 |
| --- | --- | --- |
| 访问、登录、定价页查看、购买点击 | GA4 | GA4「报告」和「探索」 |
| 服务端结账、付款事件及发送状态 | Supabase 的 `ai_font_analytics_outbox` | Supabase「Table Editor」，用于排查漏报和发送异常 |
| 真实订单、付款状态、积分记录 | 项目业务数据库 | Supabase 和支付平台后台 |

日常转化分析主要在 [Font 的 GA4](https://analytics.google.com/analytics/web/#/a308210524p546971242/reports/intelligenthome)
中查看：实时报告用于检查最近是否收到事件，漏斗探索用于分析各阶段人数、转化率和流失率。
数据库负责订单关联、可靠发送和去重，不会保存每一次浏览器点击。
当前没有新增网站内的运营数据看板。

## 事件定义

| 事件名 | 触发位置与含义 |
| --- | --- |
| `ai_font_view` | 浏览器访问 AI Font Generator 页面。 |
| `login_start` | 本地登录配置检查通过后，用户发起 Google 登录。 |
| `login` | OAuth 授权码交换成功，返回网站后消费服务端设置的短期标记。普通会话刷新不会算作新登录。 |
| `login_return` | OAuth 返回后，网站页头成功取得已登录会话，用于衡量是否顺利返回网站。 |
| `view_item` | 定价页加载账号及服务可用性信息后，展示入门积分包。 |
| `checkout_click` | 已登录、具备购买资格且同意条款的用户点击购买。 |
| `checkout_error` | 创建结账时发生 HTTP 或网络错误，仅携带限定格式的错误码。 |
| `begin_checkout` | 服务端已保存支付平台返回的结账 URL，不代表外部付款页面已加载。 |
| `purchase` | 支付平台校验通过后，服务端订单状态变为已付款。仅访问成功页面不会触发。 |

相关事件携带以下参数：

- `audience_type`：`anonymous`（匿名）、`customer`（普通用户）、`internal`（内部用户）。
- `checkout_eligible`：`true` 或 `false`，表示当前是否具备购买资格。
- `checkout_mode`：`private`（白名单开放）或 `public`（全量开放）。
- `payment_provider`：`waffo`、`paypal`，配置尚未加载时为未知值。
- `payment_environment`：`test`（测试）、`live`（正式）或未知值。

登录事件还携带 `method` 和 `login_destination`。`user_id` 是通过 SHA-256
派生的稳定账号标识，不使用邮箱或邮箱哈希；退出登录时会清除该标识。

内部账号或测试、沙盒付款使用 **`test_begin_checkout` 和 `test_purchase`**
服务端事件，便于测试且不增加标准购买收入。不要将测试事件标记为关键事件。
前端事件继续使用原事件名，并携带受众、支付环境标记。
匿名访问只有在登录后才能识别是否为内部测试用户，因此登录漏斗需要使用用户排除细分，详见下文。

浏览器仅提供已有的 GA `client_id` 和 `session_id`。用户身份、商品、价格、支付环境和
购买资格由服务端或业务账本确定。电商事件金额取积分包小计（`amount_minor / 100`），
不包含税费；`transaction_id` 使用本地订单 UUID。
自定义事件不发送邮箱、显示名称、字体提示词、银行卡信息、鉴权令牌或任意请求内容。
手动上报的页面地址会移除查询参数和片段，仅保留经过格式、长度校验的 UTM 字段；
请勿在 UTM 值中放入个人信息。来源页面仅保留源站地址。

## GA4 媒体资源设置

以下属于 **GA4 后台设置**，部署本仓库不会自动应用。
修改前应核对媒体资源和数据流，本地测试不能证明这些后台设置已经生效。

- 「管理 → 自定义定义 → 创建自定义维度」
  （Admin → Custom definitions → Create custom dimension）：创建事件级维度
  `audience_type`、`checkout_eligible`、`checkout_mode`、`payment_provider`、
  `payment_environment`、`login_destination` 和 `error_code`。
  显示名称可与参数名相同。不要将 `user_id`、`client_id`、交易 ID 或登录事件 ID
  注册为自定义维度，以免产生大量不同值。
- 「管理 → 事件 / 关键事件」（Admin → Events / Key events）：确认 `purchase`
  是关键事件。登录用于分析漏斗阶段，是否作为业务转化应另行判断；不要根据页面 URL 推断购买成功。
- 「数据流 → 增强型衡量 → 网页浏览 → 高级设置」
  （Data stream → Enhanced measurement → Page views → Advanced settings）：关闭
  **Page changes based on browser history events**（根据浏览器历史记录变化触发页面浏览），
  避免与 Next.js 路由的手动页面浏览事件重复。手动初始化同时设置 `send_page_view:false`。
  关闭字体输入表单的自动表单互动采集，避免将其误判为结账或获客事件。
- 保留现有报告身份和隐私设置，除非有明确的调整需求。
  自定义定义依赖新采集的数据，创建维度不会补回历史事件中缺失的参数。

## 漏斗探索配置（待在后台保存）

创建两条封闭漏斗探索，步骤关系使用 **indirectly followed by**（间接跟随），
按去重用户统计，显示经过时间，日期范围使用滚动的最近 28 天。
这些漏斗衡量用户转化，不用于逐笔核对订单尝试。
可按内置维度 `Device category`（设备类别）、`Session source / medium`（会话来源 / 媒介）
或 `Country`（国家 / 地区）拆分；流量较小时应减少过细的拆分。

### AI Font — 登录完成率

1. `Event name`（事件名称）完全匹配 `login_start`。
2. `Event name` 完全匹配 `login`，发生在上一步之后 **30 分钟内**。
3. `Event name` 完全匹配 `login_return`，发生在上一步之后 **5 分钟内**。

创建用户细分，排除探索期间出现过任意 `audience_type=internal` 事件的用户。
将该细分应用于漏斗，可同时移除测试账号登录前的匿名 `login_start` 和登录后的事件。
不要为每一步都添加 `audience_type=customer` 筛选，因为第一步通常来自匿名用户。
该登录漏斗无需限制购买资格，免费工具也支持账号登录。

### AI Font — 有购买资格用户的购买转化率

1. `Event name` 完全匹配 `view_item`，同时满足 `checkout_eligible=true`、
   `checkout_mode=public` 和 `payment_environment=live`。
2. `Event name` 完全匹配 `checkout_click`，发生在上一步之后 **7 天内**。
3. `Event name` 完全匹配 `begin_checkout`，发生在上一步之后 **30 分钟内**。
4. `Event name` 完全匹配 `purchase`，发生在上一步之后 **7 天内**。

应用同一个内部用户排除细分。上述时间限制是**相邻步骤之间的窗口**，
不是从第一步到最后一步总共 7 天。已经登录的用户从 `view_item` 进入漏斗，
无需重新登录才能计入。

白名单开放期间，正式购买漏斗预期没有数据。
测试时可复制一份漏斗，使用白名单、测试环境资格及带 `test_` 前缀的服务端事件，
并移除内部用户排除条件。测试漏斗数据不得混入正式业务指标。

建议关注：登录完成率、有购买资格用户的查看套餐 → 点击购买、点击购买 → 创建结账、
创建结账 → 付款成功，以及查看套餐 → 付款成功的整体转化率，再按来源 / 媒介和设备比较。
收入、退款、争议和积分权益应以业务数据库及支付平台报告为准。
本轮不发送 `refund` 或订阅续费事件，因此 GA4 购买收入不代表扣除退款后的净收入，
也不用于财务对账。

## 可靠性、隐私与限制

- 已确认的结账、付款事件时间与订单一同提交。Cron 从这些持久化事实派生事件，
  队列写入及 Google 网络请求位于支付回调、积分事务之外。
  附加可选归因信息的请求设有超时限制。
- 唯一事件键可避免重复支付回调或对账再次排入同一购买事件，GA4 同时收到交易 ID。
  处理租约过期、网络异常和 `5xx` 响应会标记为 `needs_review`，供人工核对，不盲目重发。
  明确的 `429` 响应按退避策略处理，最多尝试 8 次。
- Google 返回 `2xx` 仅表示 HTTP 请求已接收，**不证明事件格式校验通过或已经出现在报告中**。
  队列状态 `sent` 也只有这一含义。超过 72 小时的事件会暂存等待处理。
  正常情况下，事件在下一次每 5 分钟执行的 Cron 中发送；浏览器、会话归因仍可能不完整，
  尤其是付款延迟较长时。
- 没有有效浏览器 GA 标识时不会发送分析事件。浏览器停用标记
  `ga-disable-G-P3P9SJKZEG` 和 `fontAnalyticsConsent=denied` 会抑制自定义事件，
  并阻止为新订单附加归因信息。`setAnalyticsConsent()` 是同意管理平台（CMP）的
  分析存储同意回调入口；新增或更换 CMP 时，应在初始化之前和同意状态变化时接入。
  仅凭残留的 `_ga` Cookie 不能证明用户已同意。本轮没有新增同意弹窗，
  也未宣称第三方 CMP 已经接好该回调。
- 订单会保留结账时捕获的归因信息。用户之后仅在浏览器中停用分析，无法影响已排队的服务端事件。
  处理删除或撤回同意请求时，需要清除该用户待发送事件的归因信息，并按需执行 GA 数据删除流程。
  不得在服务端将分析同意状态强行设为允许，或在浏览器拦截采集时自行生成替代 ID。
- 广告拦截、同意选择、Cookie 缺失、登录返回时关闭浏览器、网络异常及 GA 处理均可能导致数据缺口，
  不能承诺完整追踪所有行为。

运维排查可使用以下查询，仅限服务角色访问，避免查询、输出事件上下文：

```sql
select event_name, status, last_error, count(*)
from public.ai_font_analytics_outbox
 group by event_name, status, last_error;
```

手动补发前必须核对 `needs_review` 事件，不要批量重置发送结果不确定的记录。
事件上下文不得进入日志，并应限制该表的运维访问权限。

## 验证方法

Mock 测试覆盖标识校验、脱敏、登录去重、退出登录、Cookie / 同意状态及域名限制、
正式与测试事件名、响应状态、超时、队列幂等、鉴权、退避和过期租约。
测试不会发送真实邮件、付款或 GA 事件。
部署后可使用已有测试账号和测试漏斗核对线上接入。
只有真实、经过支付平台确认的订单才应产生服务端购买事件，不要向生产库插入虚假已付款订单。

如需在外部校验 MP 请求内容，应在受控服务端环境使用正确的数据流密钥，调用 Google 的
`/debug/mp/collect` 校验接口。该接口不会向正式报告写入数据。
不要将 URL 或密钥写入日志、粘贴到聊天中。
校验之后，还需单独确认事件采集和报告可见性；代码测试或 HTTP 响应成功，
均不能单独证明线上完整链路已验证。

## 官方参考资料

- [Measurement Protocol 发送事件](https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events)
- [事件校验](https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events)
- [User-ID](https://developers.google.com/analytics/devguides/collection/ga4/user-id)
- [漏斗探索](https://support.google.com/analytics/answer/9327974?hl=en)
