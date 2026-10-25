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
