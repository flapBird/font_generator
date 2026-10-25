# 字体生成、描述审核与重试

## 浏览器提交 jobs 是否正常

正常。用户点击生成后，浏览器向本站 `POST /api/ai-font/jobs` 提交请求 ID 和描述。
该接口先验证登录、资格和描述安全审核，审核通过后才原子预留 100 个生成积分、
创建字体任务并交给 Mixfont。出现 jobs 请求本身不能证明已生成字体或扣除积分。

提示词审核使用 `ai_font_moderation_checks`；实际生成记录使用 `ai_font_jobs`。
任务创建后，`PATCH /api/ai-font/jobs` 用于刷新已有任务，不是再提交一份字体生成。
用户可用积分以账本为准；SeeAPI 的审核费用与本站的字体生成积分不同。

## 两种提示代表不同状态

- **Safety checks are temporarily unavailable**：审核调用、响应校验或审核状态保存失败。
  这不是内容被判违规；不能仅凭此提示判断是中文描述、密钥或余额问题。
- **Checking your description**：仅在已有审核任务或正在提交／查询审核时显示。
  尚未进入字体生成阶段，不应同时显示 Ready to create your font。
- **Safety checks are waiting to retry**：上一次失败后仍在服务端退避窗口内。
  前端显示剩余等待时间、暂时禁用同一描述的提交，不每 3.5 秒重复请求。

2026-10-25 的只读排查发现，最近三条描述审核均为 pending、各尝试一次、
尚未保存上游任务 ID，并设置了 60 秒的下一次检查时间。
这证明重试等待存在；它不能单独确定首次失败的 HTTP 状态或响应格式。
本地密钥的 `GET /v1/credits` 返回 200，只证明该密钥通过只读鉴权，
不能证明生产 Worker 使用相同密钥或有权限调用特定审核端点。

## 修复后的恢复规则

- pending 响应携带 `retryAfterSeconds`、`waitingToRetry` 和 `Retry-After`。
  正常短轮询遵守间隔；长退避停止短轮询并显示倒计时，之后由用户手动继续。
- 超时、断网、格式不明、409 或已接受任务查询失败时保留原请求 ID 和幂等键；
  上游结果不确定时不换键重新付费提交。
- 对创建审核任务时明确返回的 400、401、402、403、404、422，记录失败而非自动重试；
  修复配置或输入后，用户手动重试可创建新审核意图。已明确结束的失败审核亦可手动重试。
- 审核失败或未完成时不会调用字体生成预留函数，不放行对应新任务的字体生成、预览或下载，既有已交付字体不受影响。
  字体生成开始后的恢复继续沿用原有账本与输出审核流程。

## 生产排查入口

在 Cloudflare Worker 日志查找 `[ai-font] Prompt review unavailable`。
日志仅记录固定分类代码和 HTTP 状态，不记录密钥、提示词、上游正文或用户数据：

| 日志分类 | 检查方向 |
| --- | --- |
| `HTTP_ERROR`，401 | Worker 运行时是否配置完整、有效的 `SEEAPI_API_KEY`，没有多余引号或 Bearer 前缀 |
| `HTTP_ERROR`，402 | SeeAPI 可用余额、欠费或 key 的额度设置 |
| `HTTP_ERROR`，403 | key 对模型和审核端点的权限 |
| `HTTP_ERROR`，429 / 5xx | 上游限流或临时故障，遵守退避时间 |
| `INVALID_RESPONSE` | 任务标识、模型／端点、审核分类、阈值或返回结构不符合约定；不能绕过校验 |
| `TRANSPORT_ERROR` | 请求参数的运行时兼容性、超时、网络或读取响应失败；保留原幂等键 |
| 数据库错误代码 | 审核迁移、RPC 函数签名、权限与 schema cache |

本轮仅执行只读状态／鉴权检查和模拟回归，不新建真实审核、字体生成、订单或 GA4 事件。
界面与日志修复需要部署后生效；没有据此宣称线上审核已通过完整验证。

## Cloudflare Workers 请求兼容性修复

2026-10-25 20:43 的生产日志显示 `Prompt review unavailable`，分类为 `TRANSPORT_ERROR`。
本地使用项目 Wrangler 配套的 workerd 和相同兼容日期／标志复现了确定的代码缺陷：
`redirect: 'error'` 在构造请求时即抛出 `TypeError: Invalid redirect value`，尚未发送审核请求。
这解释了正常描述也无法进入审核的现象，不能将它视为内容违规或据此判断余额不足。
[Cloudflare Request 文档](https://developers.cloudflare.com/workers/runtime-apis/request/) 明确说明 Workers 仅支持 `follow` 和 `manual`。

审核提交／查询改为 `redirect: 'manual'`，由原有状态码校验拒绝所有 3xx，不跟随到其他地址。
字体文件下载、GA4 服务端投递和事务邮件中的同类参数亦已修复；保留原有成功状态校验、
幂等键、未知结果处理与重试规则。此次无需新增环境变量或数据库迁移。

`npm run test:cloudflare` 包含真实 Workers 运行时的审核／邮件客户端回归，所有外部请求
均由本地模拟服务截获，覆盖审核通过、拦截、任务查询、邮件回执和 301／302／303／307／308 拒绝。
字体下载和 GA4 重定向通过各自的模拟流程回归；不发送真实 GA4 事件或付费审核／生成请求。
修复需要重新构建并部署 Worker 后生效；本地验证不等于已验证生产端完整生成链路。
