# 账号加载与个人字体库排查

## 为什么已登录，账号接口仍然返回 503

页头通过 `/api/ai-font/auth/session` 读取经 Supabase 验证的登录身份。
`/api/ai-font/account` 还会读取资料、钱包、生成记录、订单、积分流水、订阅及账单限制。
旧实现遇到任意一项查询失败便返回 503，因此登录成功不代表业务表已准备好。

2026-10-25 对项目本地配置的 Supabase 执行只读、`limit=0` 的结构检查发现：

- 前三次账号迁移所建业务表可以访问。
- `ai_font_billing_holds` 返回 `PGRST205`，API schema cache 中找不到表。
- 查询 `ai_font_orders.billing_checked_at` 返回 `42703`，字段不存在。
- `ai_font_moderation_checks` 返回 `PGRST205`。
- `ai_font_analytics_outbox` 可以访问；只执行分析迁移不能替代更早的账单和审核迁移。

本次检查未输出用户记录、密钥或完整上游错误。未取得生产 Worker 的数据库配置，
因此上线修复前必须确认线上指向同一 Supabase 项目，不能只凭本地配置认定生产数据库状态。

## 数据库修复顺序

1. 核对 Worker 运行时 `NEXT_PUBLIC_SUPABASE_URL` 指向的项目；
   `SUPABASE_SERVICE_ROLE_KEY` 必须属于该项目，并配置在运行时机密中。
2. 在 Supabase SQL Editor 只读检查实际结构：

   ```sql
   select to_regclass('public.ai_font_billing_holds') as billing_holds,
          to_regclass('public.ai_font_moderation_checks') as moderation_checks,
          to_regclass('public.ai_font_analytics_outbox') as analytics_outbox;
   select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'ai_font_orders'
      and column_name = 'billing_checked_at';
   ```

3. 确认账单迁移尚未执行后，在暂停生成和对账的维护窗口应用
   `supabase/migrations/202610140001_billing_reconciliation_outbox.sql`，
   然后应用 `supabase/migrations/202610200001_font_moderation.sql`。
   两份迁移均包含事务；使用完整原文件，不要仅创建缺失的空表，也不要重复执行已完成的迁移。
   如果表实际上存在但 REST API 尚未识别，可执行 `notify pgrst, 'reload schema';`
   刷新 schema cache；刷新不能补建真正缺失的表或字段。
4. 部署匹配的应用，确认运行时配置齐全，再恢复生成和对账。
   无需创建虚假订单或发送真实 GA4 测试事件。

## 代码修复后的行为

- 账号各部分独立读取，单项失败通过 `unavailableSections` 标记；
  已验证的 Google 身份及成功读取的记录继续显示。
- 资料表暂时不可用时回退到 Google 资料，并暂停修改显示名。
- 钱包读取失败时余额为 `null`，页面显示暂不可用，不伪装为零余额。
- 必需账号检查失败时 `billingUnavailable=true`，关闭新生成和购买，
  GA4 的购买资格标记也为 false；没有移除服务端或数据库中的账单限制检查。
- 日志只包含部分名称与经过格式校验的错误代码，不记录完整错误正文。
- 菜单的 **My fonts & purchases** 进入独立 `/my-fonts` 页面。
  该页面复用字体库的刷新、预览、TTF 下载、PNG 编辑及订单查看功能，不展示生成表单。
  未登录时回到该页面的登录入口；页面为 noindex，不加入 sitemap。
- 旧的生成页字体库锚点继续保留，并在账号异步加载后定位。

## 验证

`tests/ai-font/account.test.ts` 使用模拟上游响应覆盖缺表、资料回退、未知余额、
缺少服务端凭据及正常读取。测试不访问真实支付、邮件、字体生成或分析服务。
相关界面回归在 `tests/ai-font/browser.spec.ts`，均使用本地模拟账号。

## 账户工作区与加载体验

`/account` 与 `/my-fonts` 共用工作区导航、版式、结构化骨架和请求状态。
进入页面立即展示与内容接近的布局；超过 3.5 秒说明仍在检查，客户端请求
最多等待 12 秒后给出重试入口，不会无限显示 Loading。

账户快照只在当前浏览器页面的 JavaScript 内存中短暂保留（15 秒），并合并并发请求。
在两页之间导航可直接复用最近的记录；手动刷新、生成后刷新仍向服务端读取。
登录变化、窗口重新聚焦或 BFCache 恢复时清空旧快照；晚到的旧身份响应不能回写。
快照不写入 localStorage、sessionStorage、CDN 或公共缓存；缓存余额不是服务端授权依据。
客户端的描述草稿功能仍使用原有 sessionStorage，不包含账户快照。

账号接口的身份读取设置 6 秒截止信号，各业务查询共用 5 秒截止信号。
查询失败后保留可用部分；鉴权服务暂时不可达时返回 503，不伪装成已退出登录。
这使等待有界，但不代表已消除用户到 Cloudflare 或 Supabase 的网络延迟。

字体库提供状态筛选及任务详情弹窗，支持键盘打开、Escape 关闭和焦点恢复。
详情包含描述、完整任务编号、创建／更新时间、失败原因（若有）、积分结果与后续建议。
失败任务可带原描述返回编辑器，用户再次明确点击生成才会创建新任务。
`needs_review` 仍显示积分预留，绝不声称已退款，也不自动重提未知结果的付费任务。
同时补全了界面系统字体变量，避免未定义变量导致界面意外回退为浏览器默认衬线字体。

## 失败原因迁移与兼容部署

在既有账单和审核迁移之后，执行新增的
`supabase/migrations/202610250001_job_failure_details.sql`，然后部署本轮代码。
迁移只新增受固定枚举约束的 `ai_font_jobs.failure_code` 和服务端专用的
`ai_font_finish_job_with_reason`。新函数沿用原有审核门禁、锁顺序和幂等积分返还函数，
在同一事务内保存最终原因与状态。重复结束不覆盖首次终态原因、不重复返还。

未迁移时仍可展示旧字体库；只在明确的缺列错误时回退到旧字段查询。
仅当新增 RPC 返回 `PGRST202`（缺失函数／schema cache）时回退旧的结束函数，
不会对其他未知提交结果盲目重试。未迁移阶段不会获得新失败原因，建议先执行 SQL。
历史失败任务保持“未记录详细原因”，不根据现在的 API 余额推断过去的失败。

例如，Mixfont 创建请求返回 402 时，新任务记录 `service_unavailable`，用户看到服务暂不可用
及积分已返还，运营日志记录固定原因码与 HTTP 状态。401／403、429、请求拒绝、
生成失败、文件校验失败与输出审核失败分别映射为固定公共分类；不存储或展示
上游原始错误正文、密钥或下载链接。用户不需要处理运营方的 API 充值。

本轮验证使用模拟 HTTP、PGlite 与本地页面，不执行远程迁移，不调用真实付费生成，
不发送真实 GA4、订单或邮件测试事件。数据库迁移与应用部署均需在生产环境另行完成。
