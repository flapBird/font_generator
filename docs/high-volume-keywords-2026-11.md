# 高搜索量关键词实施记录

日期：2026-11-01。搜索量来自用户截图，地区、语言及统计期间未提供；不将区间转换成精确搜索量或流量预测。

## 顺序与当前交付

1. Cute / Calligraphy：新增 `/cute-font-generator`、`/calligraphy-font-generator`。复用统一文本工作区，输入限 1,000 UTF-16 单位；按行可选装饰，保留原文、已检测链接与引用。各有 What / How to / FAQ、canonical、目录、相关链接和 sitemap。无图片或字体文件输出。
2. 现有高量级入口：首页补充 Fancy Text / Online Font Changer 的真实用途；Invisible Character 描述补充 Invisible Text Generator；完整目录搜索支持 Cursive Text、Font Keyboard、Instagram Bio 等别名。Cursive、Kaomoji、Old English、Keyboard 的现有 URL 和工作区不变。原本已有准确专题内容的页面不重复堆关键词。
3. 字体识别：后续用户选择浏览器本地方案，已实现实验性首版；见 [本地字体识别](font-identifier-local.md)。以下第三方 API 评估保留为备选，不是当前实现。
4. 1K–10K 留候选池；100–1K 不新增，已有 Neon 等不删除；截图没有搜索量的词不自动排期。

## 分类及兼容范围

Cute / Calligraphy 属于 Font Styles，追加到完整目录，默认不进常驻侧栏及手机列表。当前页临时 HERE 随路由出现和移除。新增帧选项仅在新页面显示；旧页面选项、样式 ID、转换规则和默认输入不变。

新增链接位于 Cursive / Preppy / Heart 的 More related tools 区域，不替换或重排原相关入口。首页只修改说明与 SEO 文案，保留标题、默认文本、样式集合和转换交互。不新增字体、依赖或全站 CSS。

以后真正开放图片字体识别时，在 `/tools` 中增加 Font Tools 分类，统一以 `/font-identifier` 承接 Font Identifier / Finder / Detector 的图片识别意图；不建立三个重复工具，不提前展示空分类或不可用页面。顶栏仍采用精选目录结构。

## 线上可达与收录检查

2026-11-01：网页读取工具可读取首页，但返回的导航内容较本地版本旧。Old English、Invisible Character、Cursive、Kaomoji、Keyboard 的读取分别失败或缓存未命中。直接 HTTP 请求也因连接/HTTP2 错误未获得状态码。不能据此认定页面 404、未部署或未收录。

本轮不发布、不 push。实际发布版本与 Google 收录状态仍待成功访问生产环境及 Search Console URL Inspection 验证；没有读取私有 Search Console 数据，也没有承诺收录或排名。

## 字体识别技术评估

以下是文档核实与方案判断，不是识别准确率实测。

| 方案 | 已核实信息 | 当前结论 |
| --- | --- | --- |
| WhatFontIs API | 官方 API 提供图片输入及候选字体；密钥必需，商业使用需联系供应商，要求来源链接 | 优先作为广覆盖候选；没有商业报价/授权和可用测试密钥，不假设个人免费额度可供本站使用 |
| Mixfont Lens 本地模型 | 仓库含 PyTorch、Tesseract 推理流程，针对开源字体；许可证限制非商业使用，商业用途需书面许可 | 不直接集成到商业站点；其商业 API 可作为开源字体匹配备选 |
| dy/gpu-font | 项目标注 MIT，并采用浏览器 WebGPU 方案 | 可进一步验证；不能仅据代码许可证就假设全部模型、字体目录和预览资源均可转售或分发；尚未实测精度、移动端兼容和下载体积 |

资料来源（2026-11-01 核对）：

- https://www.whatfontis.com/API-identify-fonts-from-image.html
- https://github.com/mixfont/lens/blob/main/README.md （含 License）
- https://www.mixfont.com/font-recognition-api
- https://github.com/dy/gpu-font

建议先测试有商业授权的 API，保留浏览器本地匹配作为备选。网页应用中只处理裁切、输入检查与结果展示，识别请求由独立服务端接口转发；不将密钥发到客户端。提供候选结果而非“百分之百识别”，不把识别结果当作字体下载授权。

### 实施前验证门槛

- 确认供应商商业使用条件、月费/按次费用、配额、超额规则、上传保存期限及数据处理方式。本轮未购买服务、未联系供应商、未上传用户图片。
- 使用具有已知字体来源的样本：清晰文本、缩放/JPEG/噪声、不同颜色、旋转、混合字体，以及库外字体/手绘 Logo/无文字图片。合成样本与真实截图分别报告；不能把同字体渲染回查当作真实准确率。
- 分别记录库内覆盖、Top-1 / Top-5、库外拒识、无文字误报、P50/P95 延迟及失败率。效果不合格则不开放通用识别承诺。
- 成本按“真实调用次数 × 合同单价 + 固定费 + 超额费用”核算，加入失败/重试计费规则；搜索量不等于调用次数。没有报价前不填成本数字。
- 对外首版需要裁切/选区、清晰的发送动作、取消/超时/重试、候选名称和来源、无结果处理、真实的 What / How to / FAQ；服务未配置时不能在 sitemap、llms.txt 或目录宣称已提供。

## 验证记录

- 实施前与实施后 `npm run test:generators` 均通过，包括旧 59 个转换、65 个旧页面定义与导航兼容检查。
- `npm run lint`、`npm run build` 通过；文本内容库 13 项单元检查全部通过（随新增页更新注册表数量断言）。
- 完整 Chromium 回归首次 73/75 通过；两处失败为新测试搜索框定位不唯一及旧目录数量仍为 96。明确使用 Search all tools，并将新增两页后的预期数量更新为 98；两项复验 2/2 通过。未修改业务代码来绕过失败。
- 覆盖新旧页面跳转、输入隔离、临时 HERE、复制/预览、空输入、特殊字符、旧图片导出、目录搜索、canonical、sitemap 和真实 HTTP `/llms.txt` 输出。新页 What / How to / FAQ 在初始 HTML 中可见。
- 新页 320/390/1440 宽度无横向溢出，并目视检查 Cute 手机、Calligraphy 桌面工作区截图。实体设备和 Safari 未覆盖。
- 已同步 llms.txt 的新增页面、输出类型与导航说明；未写入尚未实现的字体识别服务。
- 没有部署、推送、付费识别调用或真实搜索收录验证。
