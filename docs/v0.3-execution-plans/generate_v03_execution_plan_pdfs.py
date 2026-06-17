from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = Path(__file__).resolve().parent
GENERATED_ON = "2026-06-17"


def register_fonts() -> tuple[str, str]:
    regular = r"C:\Windows\Fonts\msyh.ttc"
    bold = r"C:\Windows\Fonts\msyhbd.ttc"
    try:
        pdfmetrics.registerFont(TTFont("MSYH", regular))
        pdfmetrics.registerFont(TTFont("MSYH-Bold", bold))
        return "MSYH", "MSYH-Bold"
    except Exception:
        pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
        return "STSong-Light", "STSong-Light"


FONT, FONT_BOLD = register_fonts()


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "Title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName=FONT_BOLD,
            fontSize=22,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#2b1a05"),
            spaceAfter=18,
            wordWrap="CJK",
        ),
        "Subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=11,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#76520c"),
            spaceAfter=16,
            wordWrap="CJK",
        ),
        "H1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName=FONT_BOLD,
            fontSize=15,
            leading=22,
            textColor=colors.HexColor("#4d2e00"),
            spaceBefore=12,
            spaceAfter=8,
            wordWrap="CJK",
        ),
        "H2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12.5,
            leading=18,
            textColor=colors.HexColor("#5f3b05"),
            spaceBefore=8,
            spaceAfter=5,
            wordWrap="CJK",
        ),
        "Body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.7,
            leading=15,
            textColor=colors.HexColor("#24170a"),
            spaceAfter=6,
            wordWrap="CJK",
        ),
        "Small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#5d5144"),
            spaceAfter=4,
            wordWrap="CJK",
        ),
        "Bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.3,
            leading=14,
            leftIndent=0,
            firstLineIndent=0,
            textColor=colors.HexColor("#24170a"),
            wordWrap="CJK",
        ),
        "Code": ParagraphStyle(
            "Code",
            parent=base["Code"],
            fontName="Courier",
            fontSize=8.2,
            leading=11,
            textColor=colors.HexColor("#1f1f1f"),
            backColor=colors.HexColor("#f8f4ec"),
            borderColor=colors.HexColor("#e5d5b5"),
            borderPadding=6,
            spaceBefore=4,
            spaceAfter=8,
        ),
    }


STYLES = make_styles()


@dataclass(frozen=True)
class Section:
    title: str
    paragraphs: tuple[str, ...] = ()
    bullets: tuple[str, ...] = ()
    code: str | None = None


@dataclass(frozen=True)
class Plan:
    version: str
    title: str
    file_name: str
    position: str
    effort: str
    branch: str
    milestone: str
    sections: tuple[Section, ...]


COMMON_PREFLIGHT = (
    "进入项目目录并确认当前分支、远端、工作区差异。不要覆盖用户未提交的改动；若已有改动与本版本相关，先阅读再合并。",
    "先阅读 CLAUDE.md、README.md、docs/REAL_DATA_INTEGRATION_PLAN.md，以及本版本涉及的 src/lib、src/components、src/types 文件。",
    "每次修改完成后优先运行 npm.cmd run lint 和 npm.cmd run build；Windows PowerShell 下优先使用 npm.cmd。",
    "所有外部数据源失败时必须返回可解释的缺失状态，不能让页面直接 500。",
    "研究内容必须带 evidenceRef 或 sourceUrl；没有证据时只能显示缺失原因，不能补写事实。",
)


COMMON_LOCAL = """cd "C:\\Users\\老大哥柚子\\Desktop\\moki-research-card"
npm.cmd install
npm.cmd run lint
npm.cmd run build
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
# 浏览器打开 http://localhost:3000/ 做页面验收"""


COMMON_GIT = """git status -sb
git checkout -b codex/v0.3.x-short-name
git add -A
git commit -m "feat: v0.3.x short release title"
git push origin codex/v0.3.x-short-name

# 用户确认合并到 main 后：
git checkout main
git pull --ff-only origin main
git merge --ff-only codex/v0.3.x-short-name
git push origin main"""


COMMON_VERCEL = (
    "如果 Vercel 项目已连接 GitHub，推送到 main 后会触发生产部署；预览分支会生成 Preview Deployment。",
    "在 Vercel Project Settings - Environment Variables 中配置本版本需要的变量，并同时勾选 Production、Preview、Development。",
    "部署后检查 Vercel Build Logs、Function Logs、页面首屏、NVDA 样例、无数据 ticker 样例和移动端布局。",
    "生产环境不要暴露任何 API Key 到 NEXT_PUBLIC_ 变量；所有抓取和 LLM 请求必须在服务端执行。",
)


COMMON_REFERENCES = (
    "SEC EDGAR APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces",
    "DeepSeek API Docs: https://api-docs.deepseek.com/",
    "Vercel Deployments: https://vercel.com/docs/deployments",
    "Vercel Environment Variables: https://vercel.com/docs/environment-variables",
)


def common_sections(version: str) -> tuple[Section, ...]:
    return (
        Section("通用执行前检查", bullets=COMMON_PREFLIGHT),
        Section("本地发布流程", paragraphs=("每个小版本完成后都要先在本地跑通，再决定是否推送。",), code=COMMON_LOCAL),
        Section("GitHub 推送流程", paragraphs=("建议每个小版本单独分支和单独 commit，用户确认后再进入 main。",), code=COMMON_GIT.replace("v0.3.x", version)),
        Section("Vercel 部署流程", bullets=COMMON_VERCEL),
        Section("通用回滚流程", bullets=(
            "若本地 lint 或 build 失败，先修复，不进入 GitHub 推送。",
            "若 Vercel 部署失败，保留失败部署日志，回退到上一个成功 main commit，或重新推送修复 commit。",
            "若外部数据源临时失败，页面必须保留上一版可用的缺失态和数据源说明。",
            "若 LLM 输出未通过 schema 校验，回退到确定性摘要，不渲染未经校验的文本。",
        )),
        Section("参考链接", bullets=COMMON_REFERENCES),
    )


PLANS: tuple[Plan, ...] = (
    Plan(
        version="v0.3.0",
        title="SEC Exhibit 公司指引抽取",
        file_name="Moki-v0.3.0-SEC-Exhibit-Guidance-Plan.pdf",
        position="修复 NVDA 等公司指引显示为无信息的问题，先把 SEC 新闻稿和 Exhibit 文档稳定抓到证据层。",
        effort="1-2 个 Codex 工作轮次，优先保证 NVDA 样例通过。",
        branch="codex/v0.3.0-sec-exhibit-guidance",
        milestone="公司指引不再只依赖 XBRL 或摘要接口，而是能识别 8-K / 10-Q 附件里的文字指引。",
        sections=(
            Section("版本目标", bullets=(
                "用 NVDA SEC 链接作为固定验收样例：https://www.sec.gov/Archives/edgar/data/1045810/000104581026000051/q1fy27pr.htm。",
                "补齐 SEC filing discovery：从 CIK submissions 找到最新 8-K、10-Q、10-K，并遍历 EX-99.1、新闻稿 HTML、主文档链接。",
                "将 HTML 清洗成纯文本块，定位 Financial Outlook、Outlook、Guidance、Q2、FY 等标题附近的段落。",
                "抽取 revenue、gross margin、operating expenses、tax rate、capex、share count 等可结构化字段。",
                "每个字段必须保存 sourceUrl、filingAccession、documentType、snippet、confidence。",
            )),
            Section("主要改动文件", bullets=(
                "src/lib/earnings/secGuidanceExtractor.ts：从单文档解析升级为 filing + exhibit 多文档解析。",
                "src/lib/earnings/guidanceDataProvider.ts：统一 SEC / FMP / Yahoo 优先级和错误收集。",
                "src/types/earnings.ts：补齐 GuidanceEvidence、GuidanceMetric、GuidancePeriod 类型。",
                "src/app/api/earnings-snapshot/route.ts：确保 guidanceData 在 API 返回体中稳定存在。",
                "新增 tests 或 fixtures：保存 NVDA q1fy27pr 的最小 HTML fixture，避免后续回归。",
            )),
            Section("详细开发步骤", bullets=(
                "先复现当前 NVDA 页面：确认 UI 显示无信息时 API 返回的 guidanceData、warnings、sourceErrors。",
                "实现 getLatestSecFilingDocuments(ticker)：ticker 到 CIK，读取 SEC submissions JSON，筛选最近 8-K、10-Q、10-K。",
                "实现 findGuidanceCandidateDocuments：优先 EX-99.1、press release、earnings release、q1fy 等命名文档。",
                "实现 extractGuidanceTextBlocks：HTML 去脚本样式、表格保留行列文本、压缩空白、保留原始段落序号。",
                "实现 parseGuidanceMetrics：使用规则提取数值、区间、单位、期间、是否 Non-GAAP。",
                "把无法结构化但明显是指引的段落保存为 qualitativeGuidance，不让页面误判为完全无数据。",
                "把 SEC 请求封装超时、重试、User-Agent、速率限制；错误进入 warnings，不中断整张卡。",
            )),
            Section("DeepSeek / 大模型接入位置", bullets=(
                "本版本不直接接入大模型，原因是先修复确定性数据抓取链路。",
                "预留 evidence.textBlockId、metric.normalizedValue、rawSnippet 字段，供 v0.3.3 以后作为 LLM 输入。",
                "若规则抽取拿不到结构化数值但有文本证据，先展示 qualitativeGuidance，后续再交给 LLM 归纳。",
            )),
            Section("验收标准", bullets=(
                "NVDA 样例在公司指引模块能显示至少 3 条 SEC 来源的指引证据。",
                "每条证据点击后能打开 SEC 原始页面或附件页面。",
                "无指引股票仍显示友好缺失态，并解释已检查的数据源。",
                "npm.cmd run lint 和 npm.cmd run build 通过。",
                "API 不因 SEC 单个附件解析失败而 500。",
            )),
            Section("Codex 首轮执行 Prompt", paragraphs=(
                "请继续 v0.3.0：读取 docs/v0.3-execution-plans/Moki-v0.3.0-SEC-Exhibit-Guidance-Plan.pdf，对齐现有 src/lib/earnings 和 src/types，实现 SEC Exhibit 公司指引抽取，优先让 NVDA q1fy27pr.htm 样例通过。完成后运行 npm.cmd run lint、npm.cmd run build，并在本地 http://localhost:3000/ 验收。",
            )),
        )
        + common_sections("v0.3.0"),
    ),
    Plan(
        version="v0.3.1",
        title="Guidance UI 与证据展示",
        file_name="Moki-v0.3.1-Guidance-UI-Evidence-Plan.pdf",
        position="把 v0.3.0 抽到的指引数据清楚展示出来，降低误报和无信息状态的困惑。",
        effort="1 个 Codex 工作轮次，重点是组件状态和证据可读性。",
        branch="codex/v0.3.1-guidance-ui-evidence",
        milestone="公司指引模块从空态提示升级为证据驱动的信息面板。",
        sections=(
            Section("版本目标", bullets=(
                "明确区分四种状态：有结构化指引、有文本证据但未结构化、已检查但无公开指引、数据源请求失败。",
                "把 15 个提醒式 warnings 合并成可展开的数据源诊断，避免首屏被噪音占据。",
                "每条指引旁展示来源、期间、置信度、提取方式和原文片段。",
                "保留轻量但完整的证据追溯，不在 UI 中展示内部调试字段。",
                "移动端不出现文字重叠、按钮溢出、表格横向撑破页面。",
            )),
            Section("主要改动文件", bullets=(
                "src/components/earnings/EnhancedGuidanceComparePanel.tsx：重构公司指引展示。",
                "src/components/earnings/GuidanceComparePanel.tsx：若仍存在旧组件，统一入口或删除重复展示。",
                "src/types/earnings.ts：补充 UI 需要的 GuidancePanelState 类型。",
                "src/app/globals.css：只使用已有金色/风险色语义 token，避免新建一套色板。",
                "必要时新增 src/components/common/EvidenceSourceList.tsx，用于复用证据列表。",
            )),
            Section("详细开发步骤", bullets=(
                "先阅读当前 Guidance panel 的 props 和 API 返回结构，列出重复字段和未使用字段。",
                "实现 GuidanceStatusHeader：显示数据来源、覆盖度、更新时间、提醒数量。",
                "实现 GuidanceMetricsTable：展示 metric、period、value/range、unit、confidence、source。",
                "实现 QualitativeGuidanceBlock：当只有文字证据时展示原文摘要与 SEC 链接。",
                "实现 SourceDiagnosticsAccordion：收纳 SEC、FMP、Yahoo 的错误和缺失说明。",
                "删除或隐藏旧 Mock 式文案，空态只说清楚本次检查过什么和为什么缺失。",
                "做 NVDA、有缺失的 ticker、完全无数据 ticker 三组 UI 检查。",
            )),
            Section("DeepSeek / 大模型接入位置", bullets=(
                "本版本仍不直接接入大模型，避免 UI 改造和生成逻辑混在一起。",
                "UI 组件接口按 evidence / facts 结构设计，后续 LLM 输出也通过同一种证据列表展示。",
                "在界面上预留 generatedSummary 区域，但默认不渲染，等 v0.3.3 开启。",
            )),
            Section("验收标准", bullets=(
                "NVDA 公司指引模块显示 SEC 证据和可点击来源，不再显示笼统无信息。",
                "warnings 默认收起，用户能查看但不会打断核心内容阅读。",
                "不同数据状态的空态文案准确且不夸大。",
                "桌面和移动端视觉布局稳定。",
                "npm.cmd run lint 和 npm.cmd run build 通过。",
            )),
            Section("Codex 首轮执行 Prompt", paragraphs=(
                "请继续 v0.3.1：读取本 PDF，对当前 Guidance 相关组件做 UI 与证据展示重构。不要新增 LLM 生成逻辑，只消费现有 guidanceData / evidence 字段。完成后本地发布到 http://localhost:3000/，用 NVDA 和一个无指引样例做视觉验收。",
            )),
        )
        + common_sections("v0.3.1"),
    ),
    Plan(
        version="v0.3.2",
        title="Evidence / Facts 统一数据层",
        file_name="Moki-v0.3.2-Evidence-Facts-Layer-Plan.pdf",
        position="把多数据源抓取结果清洗成统一 evidence / facts，为 LLM 和 Serenity 结构化分析打地基。",
        effort="2-3 个 Codex 工作轮次，属于后续版本的核心地基。",
        branch="codex/v0.3.2-evidence-facts-layer",
        milestone="前端不再直接理解各 provider 的临时字段，而是消费统一的研究事实层。",
        sections=(
            Section("版本目标", bullets=(
                "建立 EvidenceRecord：记录来源页面、抓取时间、原文片段、数据源、解析方法和置信度。",
                "建立 FactRecord：把财报、指引、估值、事件、情景输入统一成可验证事实。",
                "把 SEC、Yahoo、FMP、东方财富等 provider 输出转换成 facts，而不是直接拼到 UI。",
                "新增 dataQuality 汇总：coverage、freshness、sourceDiversity、warnings。",
                "为 LLM 输入增加 token 控制：只传事实和短证据，不传整篇原始网页。",
            )),
            Section("主要改动文件", bullets=(
                "新增 src/types/evidence.ts：EvidenceRecord、FactRecord、SourceDescriptor、DataQualityReport。",
                "新增 src/lib/research/evidenceStore.ts：临时内存存储或纯对象聚合，后续可替换为数据库。",
                "新增 src/lib/research/factBuilder.ts：provider 输出到 facts 的转换。",
                "新增 src/lib/research/factValidation.ts：单位、期间、数值区间、来源完整性校验。",
                "更新 src/lib/generateResearchCard/mockGenerateResearchCard.ts：从 facts 组装 card。",
                "更新 src/components/generate/GeneratedCardPreview.tsx：读取统一 dataQuality 和 evidence。",
            )),
            Section("详细开发步骤", bullets=(
                "盘点当前 API 返回的 enhancedEarnings、guidanceData、advancedScenarios、serenityAnalysis 字段，标记重复和无法追溯的字段。",
                "定义 FactRecord.kind：financial_metric、guidance_metric、valuation_metric、event、scenario_input、qualitative_claim。",
                "为每个 fact 绑定 evidenceIds，要求前端任何展示型结论都能追到证据。",
                "实现 buildFactsFromEarnings、buildFactsFromGuidance、buildFactsFromScenario、buildFactsFromSerenityInput。",
                "实现 normalizeUnits：USD、percent、shares、perShare、ratio 等单位统一。",
                "实现 quality report：缺失源、过期源、低置信度、冲突字段。",
                "把旧字段继续保留一版作为兼容输出，但新 UI 优先读取 facts。",
            )),
            Section("DeepSeek / 大模型接入位置", bullets=(
                "本版本不调用 DeepSeek，但定义 LLMResearchInput 类型。",
                "LLMResearchInput 只允许包含 facts、evidence summaries、moduleRequest、language、complianceRules。",
                "所有 fact 必须经过 schema 校验后才能进入 LLM 输入，避免把网页噪声直接喂给模型。",
            )),
            Section("验收标准", bullets=(
                "NVDA 生成研究卡时 API 返回 facts 和 evidence 两个顶层字段。",
                "公司指引、财报快照、情景输入至少各有一类 FactRecord。",
                "每个 FactRecord 至少有一个 evidenceId 或明确 missingReason。",
                "旧页面仍能运行，兼容字段没有被突然删除。",
                "npm.cmd run lint 和 npm.cmd run build 通过。",
            )),
            Section("Codex 首轮执行 Prompt", paragraphs=(
                "请继续 v0.3.2：基于本 PDF 新增 Evidence / Facts 统一数据层，先做类型和转换器，再逐步接入研究卡生成 API。保持旧字段兼容，完成后运行 lint/build，并在 localhost:3000 检查 NVDA 卡片。",
            )),
        )
        + common_sections("v0.3.2"),
    ),
    Plan(
        version="v0.3.3",
        title="LLM Research Brief MVP",
        file_name="Moki-v0.3.3-LLM-Research-Brief-Plan.pdf",
        position="接入 DeepSeek 或兼容 provider，让模型基于 facts/evidence 生成结构化研究快照。",
        effort="2 个 Codex 工作轮次，需重点处理密钥、schema 校验和 fallback。",
        branch="codex/v0.3.3-llm-research-brief",
        milestone="页面开始展示由证据驱动的大模型研究摘要，但所有输出都必须结构化和可追溯。",
        sections=(
            Section("版本目标", bullets=(
                "新增 LLM provider 抽象，首个 provider 支持 DeepSeek 的 OpenAI-compatible Chat Completions 格式。",
                "生成财报快照、公司指引、买方情景推演三个模块的结构化 brief。",
                "LLM 输出必须是 JSON，经过 schema 校验后才进入前端。",
                "没有 API Key、超时、模型输出不合规时，回退到确定性 brief。",
                "所有段落必须包含 evidenceRefs，不允许模型生成无法追溯的事实。",
            )),
            Section("主要改动文件", bullets=(
                "新增 src/lib/llm/client.ts：统一 generateJson 接口。",
                "新增 src/lib/llm/providers/deepseek.ts：DeepSeek provider，读取服务端环境变量。",
                "新增 src/lib/llm/prompts/researchBrief.ts：系统提示词、模块提示词、合规规则。",
                "新增 src/lib/llm/schemas/researchBrief.ts：输出 JSON schema 或 TypeScript validator。",
                "更新 src/app/api/generate-research-card/route.ts 或对应生成入口：按开关调用 LLM。",
                "更新 .env.example：LLM_PROVIDER、DEEPSEEK_API_KEY、DEEPSEEK_BASE_URL、DEEPSEEK_MODEL。",
            )),
            Section("DeepSeek 接入设计", bullets=(
                "环境变量：LLM_PROVIDER=deepseek，DEEPSEEK_API_KEY=你的密钥，DEEPSEEK_BASE_URL=https://api.deepseek.com。",
                "模型建议：优先 deepseek-v4-pro 做复杂研究归纳，成本敏感时使用 deepseek-v4-flash。",
                "注意官方文档显示 deepseek-chat 和 deepseek-reasoner 将在 2026-07-24 15:59 UTC 停用，不建议新功能依赖这两个旧名称。",
                "服务端调用，不把密钥下发到浏览器。",
                "请求参数默认 stream=false，先保证 JSON 稳定；后续再考虑流式渲染。",
            )),
            Section("详细开发步骤", bullets=(
                "先安装或复用 openai SDK；若不增加依赖，也可用 fetch 调 DeepSeek Chat Completions。",
                "实现 provider factory：根据 LLM_PROVIDER 选择 deepseek、openai、disabled。",
                "设计 ResearchBriefSchema：headline、snapshotBullets、guidanceReadthrough、scenarioImplications、uncertainties、evidenceRefs。",
                "写系统提示词：只基于输入 facts/evidence，缺失就说缺失，禁止生成未给出的数值和来源。",
                "写模块提示词：财报快照重视同比/环比和质量，指引重视区间和期间，情景推演重视变量变化。",
                "实现 response repair 的最小策略：JSON parse 失败时重试一次，仍失败则 fallback。",
                "新增 mocked LLM 测试，避免本地和 CI 必须消耗真实 API。",
            )),
            Section("本地环境变量示例", code="""LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro
RESEARCH_GENERATION_ENABLED=true
LLM_TIMEOUT_MS=30000"""),
            Section("验收标准", bullets=(
                "有 DeepSeek Key 时，NVDA 页面能展示三个结构化 brief 模块。",
                "无 DeepSeek Key 时，页面仍可正常生成 deterministic brief，并提示生成方式。",
                "LLM 输出没有 evidenceRefs 的条目不会渲染。",
                "Vercel 环境变量配置后，生产部署可以生成同样结构。",
                "npm.cmd run lint 和 npm.cmd run build 通过。",
            )),
            Section("Codex 首轮执行 Prompt", paragraphs=(
                "请继续 v0.3.3：按本 PDF 接入 DeepSeek-compatible LLM provider，使用 v0.3.2 的 facts/evidence 作为唯一输入，生成 Research Brief JSON。必须加 schema 校验、fallback、.env.example 示例和本地/Vercel 配置说明。",
            )),
        )
        + common_sections("v0.3.3"),
    ),
    Plan(
        version="v0.3.4",
        title="Serenity Skill Memo 生成",
        file_name="Moki-v0.3.4-Serenity-Skill-Memo-Plan.pdf",
        position="参考朋友页面的结构化效果，把 Serenity Skills 从数据罗列升级为证据驱动的框架化 memo。",
        effort="2-3 个 Codex 工作轮次，重点是 schema、prompt 和 UI 模块映射。",
        branch="codex/v0.3.4-serenity-skill-memo",
        milestone="Serenity Alpha、Bayesian、GF-DMA、TAM-Adj-PEG、研究备忘录都能稳定展示结构化分析。",
        sections=(
            Section("版本目标", bullets=(
                "把 Serenity Skills 改为由 facts/evidence + LLM 共同生成的结构化 memo，而不是展示空白或错误数据。",
                "每个 Skill 有固定输出骨架：核心观察、证据、变量、分歧点、后续观察项。",
                "保留确定性计算结果，例如估值倍数、增长率、健康指数，LLM 只负责归纳和解释。",
                "所有模块输出必须带 evidenceRefs 和 calculationRefs。",
                "如果某模块数据不足，展示缺失原因和下一步需要的数据，而不是空白卡片。",
            )),
            Section("主要改动文件", bullets=(
                "新增 src/lib/serenity/llmSerenityMemo.ts：统一 Serenity memo 生成入口。",
                "新增 src/lib/llm/prompts/serenitySkills.ts：各 skill 的 prompt 模板。",
                "新增 src/lib/llm/schemas/serenityMemo.ts：SkillMemo、MemoSection、EvidenceLink schema。",
                "更新 src/lib/serenity/index.ts：把 real-data bundle 和 LLM memo 合并输出。",
                "更新 src/components/serenity/*Panel.tsx：按 memo schema 渲染。",
                "更新 GeneratedCardPreview 中 Serenity 区块：标签、空态、证据列表和免责声明统一。",
            )),
            Section("详细开发步骤", bullets=(
                "先抓当前 Serenity 展示错误：记录哪些字段为空、哪些字段类型不匹配、哪些模块只接到 mock fallback。",
                "定义 SerenityMemoSchema：overview、skillCards、crossSkillTensions、watchItems、dataLimitations。",
                "为 Serenity Alpha 设计输入：新闻事件如果未接入，就仅使用财报、指引、价格和估值 facts，不生成新闻结论。",
                "为 Bayesian 设计输入：基准假设、上调/下调变量、证据权重，保留计算过程。",
                "为 GF-DMA 设计输入：增长、盈利质量、资产负债、价格波动、指引变化等可量化 facts。",
                "为 TAM-Adj-PEG 设计输入：增长率、估值倍数、市场空间证据；缺少 TAM 时必须标记为数据不足。",
                "将 LLM 输出渲染成固定 UI，不直接渲染模型长文本。",
            )),
            Section("DeepSeek / 大模型接入位置", bullets=(
                "复用 v0.3.3 的 LLM provider，不再新增一套调用逻辑。",
                "Serenity prompt 必须比 Research Brief 更严格：每个结论都需要 evidenceRefs。",
                "模型参数建议使用 deepseek-v4-pro；若响应时间影响体验，后台生成并缓存结果。",
                "对输出做长度限制，避免 Serenity 面板变成长篇报告。",
            )),
            Section("验收标准", bullets=(
                "Serenity Skills 不再显示全部错误或无法查询。",
                "至少四个 Skill tab 有结构化内容或清晰缺失态。",
                "研究备忘录不再显示暂无数据，除非 facts/evidence 确实为空。",
                "每个 Skill 至少有一条证据来源或一条明确缺失原因。",
                "npm.cmd run lint 和 npm.cmd run build 通过。",
            )),
            Section("Codex 首轮执行 Prompt", paragraphs=(
                "请继续 v0.3.4：按本 PDF 实现 Serenity Skill Memo 生成，复用 v0.3.3 LLM provider 和 v0.3.2 facts/evidence。目标是让 Serenity Skills 以固定结构展示分析，而不是空白或错误数据。完成后本地验收并准备推送。",
            )),
        )
        + common_sections("v0.3.4"),
    ),
    Plan(
        version="v0.3.5",
        title="信息卡 UI 精简与 Vercel 生产化",
        file_name="Moki-v0.3.5-Card-UI-Vercel-Production-Plan.pdf",
        position="收束多轮迭代产生的冗余信息，把真实数据、LLM 内容和部署流程整理成稳定生产版。",
        effort="2 个 Codex 工作轮次，最后一个版本需要完整回归。",
        branch="codex/v0.3.5-card-ui-vercel-production",
        milestone="页面第一屏信息更清晰，模块更少但证据更强，并能通过 GitHub main 自动部署到 Vercel。",
        sections=(
            Section("版本目标", bullets=(
                "清理重复面板、旧 mock 文案、调试型字段、过多 warnings 和低价值说明。",
                "统一四个核心模块：财报快照、公司指引、买方情景推演、Serenity Skill 框架。",
                "每个模块都显示数据来源、生成方式、更新时间和证据追溯入口。",
                "生产环境配置缓存、超时、错误边界和缺失态。",
                "建立 main 分支到 Vercel 的最终发布流程，作为后续常规发布模板。",
            )),
            Section("主要改动文件", bullets=(
                "src/components/generate/GeneratedCardPreview.tsx：重排核心模块和信息层级。",
                "src/components/earnings/*：合并重复财报和指引 UI。",
                "src/components/scenarios/*：精简情景卡片，强调变量和证据。",
                "src/components/serenity/*：统一 Skill tab、memo、空态。",
                "src/app/api/*：统一缓存策略、错误响应、LLM 生成开关。",
                "docs/REAL_DATA_INTEGRATION_PLAN.md 或新建 release notes：记录 v0.3 系列最终状态。",
            )),
            Section("UI 优化清单", bullets=(
                "删除重复的真实数据徽章，只保留模块级数据质量条。",
                "把大段数据说明收进可展开区域，首屏优先展示结论、关键变量和证据入口。",
                "warnings 从逐条醒目提示改为诊断抽屉，只有阻断生成的问题才显示在模块正文。",
                "同类指标只保留一套格式：数值、期间、来源、置信度。",
                "按钮使用 lucide 图标和简短标签；避免过长中文挤压按钮。",
                "移动端采用单列模块，表格改为分组列表。",
            )),
            Section("生产化开发步骤", bullets=(
                "做代码盘点：列出 GeneratedCardPreview 下所有模块、每个模块的数据来源和重复字段。",
                "按四模块重排页面：财报快照、公司指引、买方情景推演、Serenity Skill 框架。",
                "实现统一 ModuleHeader：sourceCount、confidence、generatedBy、updatedAt、diagnostics。",
                "为所有 API 增加 timeout、try/catch、typed error response、cache/revalidate 策略。",
                "给 LLM 输出加缓存 key：ticker + facts hash + model + prompt version。",
                "更新 .env.example 和部署文档，明确本地、Preview、Production 变量。",
                "完整回归 NVDA、ORCL、TSLA、无数据 ticker 和移动端。",
            )),
            Section("Vercel 环境变量清单", code="""SEC_USER_AGENT=MokiResearchCard contact@example.com
FMP_API_KEY=...
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro
RESEARCH_GENERATION_ENABLED=true
LLM_TIMEOUT_MS=30000
NEXT_TELEMETRY_DISABLED=1"""),
            Section("GitHub main 发布流程", bullets=(
                "确认本地 lint/build 通过后，把 v0.3.5 分支推送到 GitHub。",
                "用户确认后，使用 fast-forward merge 到 main；不要 force push。",
                "推送 main 后等待 Vercel 自动构建，记录 Production Deployment URL。",
                "若 Vercel 构建失败，先在日志中定位缺失变量、Node/Next 构建错误或网络请求错误。",
                "部署成功后在 Vercel 生成的网页验收 NVDA 公司指引和 Serenity Skills。",
            )),
            Section("DeepSeek / 大模型生产策略", bullets=(
                "默认打开 RESEARCH_GENERATION_ENABLED，但保留一键关闭。",
                "LLM 失败不影响数据卡主体渲染，只影响生成式分析区域。",
                "缓存成功结果，避免刷新页面重复消耗 token。",
                "记录 promptVersion 和 model，方便后续复现输出差异。",
            )),
            Section("验收标准", bullets=(
                "页面四个核心模块都有清楚内容或明确缺失原因。",
                "NVDA 的公司指引和 Serenity Skills 在本地与 Vercel 页面均可查看。",
                "首屏没有大面积重复说明或无效提醒。",
                "Production 环境变量齐全，密钥未出现在前端 bundle。",
                "npm.cmd run lint、npm.cmd run build、本地 http://localhost:3000/、Vercel Production 全部通过。",
            )),
            Section("Codex 首轮执行 Prompt", paragraphs=(
                "请继续 v0.3.5：读取本 PDF，做信息卡 UI 精简和 Vercel 生产化。请先盘点冗余模块，再实施四核心模块布局、缓存/错误边界、环境变量文档和 main 发布流程。完成后本地发布到 http://localhost:3000/，通过后推送 GitHub 并等待 Vercel 生产部署。",
            )),
        )
        + common_sections("v0.3.5"),
    ),
)


def para(text: str, style: str = "Body") -> Paragraph:
    safe = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )
    return Paragraph(safe, STYLES[style])


def bullets(items: Iterable[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(para(item, "Bullet"), bulletColor=colors.HexColor("#8a5a00")) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=14,
        bulletFontName=FONT,
        bulletFontSize=6,
        bulletOffsetY=2,
    )


def code_block(text: str) -> Preformatted:
    return Preformatted(text.strip(), STYLES["Code"])


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT, 8)
    canvas.setFillColor(colors.HexColor("#7a6a58"))
    footer = f"Moki v0.3 execution plan - generated {GENERATED_ON} - page {doc.page}"
    canvas.drawCentredString(A4[0] / 2, 1.0 * cm, footer)
    canvas.restoreState()


def build_meta_table(plan: Plan) -> Table:
    data = [
        [para("版本", "Small"), para(plan.version, "Small")],
        [para("定位", "Small"), para(plan.position, "Small")],
        [para("预计工作量", "Small"), para(plan.effort, "Small")],
        [para("建议分支", "Small"), para(plan.branch, "Small")],
        [para("完成标志", "Small"), para(plan.milestone, "Small")],
    ]
    table = Table(data, colWidths=[3.0 * cm, 13.2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fff5dd")),
                ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#f8edda")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e1c895")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def build_pdf(plan: Plan) -> Path:
    out_path = OUTPUT_DIR / plan.file_name
    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        rightMargin=1.7 * cm,
        leftMargin=1.7 * cm,
        topMargin=1.6 * cm,
        bottomMargin=1.6 * cm,
        title=f"{plan.version} {plan.title}",
        author="Codex",
        subject="Moki research card v0.3 execution plan",
    )
    story = [
        para("Moki Research Card", "Subtitle"),
        para(f"{plan.version} {plan.title}", "Title"),
        para("Codex 分批执行计划书。本文只定义开发、模型接入、本地发布、GitHub 推送和 Vercel 部署流程，不直接执行产品开发。", "Subtitle"),
        build_meta_table(plan),
        Spacer(1, 0.5 * cm),
        para("总体链路", "H1"),
        para("多数据源抓取 -> 清洗成 evidence / facts -> 结构化数据类型 -> 喂给大模型 -> 生成模块化分析内容 -> 前端渲染成网页内容。", "Body"),
        para("计划书中的输出均要求证据可追溯、缺失可解释、模型可关闭、部署可回滚。", "Body"),
        PageBreak(),
    ]
    for section in plan.sections:
        block = [para(section.title, "H1")]
        for item in section.paragraphs:
            block.append(para(item, "Body"))
        if section.bullets:
            block.append(bullets(section.bullets))
            block.append(Spacer(1, 0.12 * cm))
        if section.code:
            block.append(code_block(section.code))
        story.append(KeepTogether(block))
    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    return out_path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    paths = [build_pdf(plan) for plan in PLANS]
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
