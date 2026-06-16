import { ResearchCard } from '@/types/research-card';

export const orclResearchCard: ResearchCard = {
  slug: 'orcl-ai-cloud',
  ticker: 'ORCL',
  companyName: 'Oracle Corporation',
  title: 'ORCL｜AI 云收入兑现研究卡',
  subtitle: '当前更像：基本面验证 + 情绪分歧，而不是单纯情绪噪音',
  updatedAt: '2026-06-16',
  cardType: 'single-stock',
  isMock: false,
  isSnapshot: true,
  generatedAt: '2026-06-16',
  sourceNote: '数据来源：SEC EDGAR filings / 财报电话会议 / Yahoo Finance',
  summary: {
    oneLine: 'Oracle 正处于 AI 云叙事验证期，OCI 增长是核心观察线索，RPO 转收入节奏决定短期业绩弹性，capex 投入规模和数据中心交付节奏影响中期盈利能力。',
    currentState: '当前市场讨论从单纯 AI 云叙事，转向订单、收入确认、基础设施投入和交付节奏的基本面验证。',
    keyQuestion: 'RPO 能否按照可验证节奏转化为 OCI 收入，同时不让 capex 对现金流造成过大压力？'
  },
  sentiment: {
    heatLevel: 7.5,
    direction: 'high-disagreement',
    disagreement: 0.8,
    keyDebates: [
      '乐观叙事：OCI AI 云增长正在加速，客户订单转化率提升',
      '谨慎叙事：capex 投入过大，短期利润率承压',
      '分歧点：RPO 增量是否真实反映 AI 需求，还是传统业务置换',
      '分歧点：AI 云竞争格局中 Oracle 的长期份额'
    ]
  },
  fundamentals: {
    businessModel: '混合云+数据库+应用套件，AI 云服务成为新增长引擎',
    revenueDrivers: [
      'OCI（Oracle Cloud Infrastructure）AI 云服务',
      '数据库许可和支持',
      '企业应用套件（ERP、HCM）',
      '技术支持和咨询服务'
    ],
    keyMetrics: [
      {
        label: 'OCI 收入同比增速',
        description: '~40%（最近季度）',
        whyItMatters: '用于观察 AI 云需求是否正在转化为可见收入。'
      },
      {
        label: '总 RPO',
        description: '$85B+（剩余履约义务）',
        whyItMatters: '用于观察未来收入池规模和订单兑现节奏。'
      },
      {
        label: '季度 capex',
        description: '~$3.5B（数据中心投入）',
        whyItMatters: '用于观察基础设施投入是否对现金流形成压力。'
      },
      {
        label: '毛利率',
        description: '~60%（非 GAAP）',
        whyItMatters: '用于观察云基础设施扩张期间盈利能力是否稳定。'
      },
      {
        label: '经营现金流',
        description: '~$15B/年（TTM）',
        whyItMatters: '用于观察高投入阶段的资金承受能力。'
      }
    ],
    risks: [
      'AI 云竞争加剧导致市场份额压力',
      '高 capex 投入周期超预期',
      '传统业务置换效应大于增量',
      '宏观利率环境影响企业 IT 支出'
    ]
  },
  events: {
    items: [
      {
        type: 'product',
        title: 'OCI GenAI 服务多区域上线',
        description: 'OCI GenAI 服务扩展到更多区域，增强企业 AI 云部署能力。',
        impactQuestion: '区域扩展是否能提升 AI 云客户转化和收入确认速度？'
      },
      {
        type: 'product',
        title: 'Autonomous Database AI 增强功能发布',
        description: '数据库产品继续加入 AI 能力，强化传统数据库业务和云服务之间的连接。',
        impactQuestion: 'AI 功能增强是否能提升现有数据库客户迁移到 OCI 的动力？'
      },
      {
        type: 'macro',
        title: '美元汇率波动影响海外收入',
        description: '海外业务收入可能受到汇率变化影响，需要结合财报披露复盘。',
        impactQuestion: '汇率变化是否会影响收入增速和管理层指引？'
      },
      {
        type: 'macro',
        title: '企业 IT 支出预算周期观察',
        description: '企业云支出受到预算周期和宏观利率环境影响。',
        impactQuestion: '企业 IT 支出节奏是否支持 OCI 继续保持较高增长？'
      },
      {
        type: 'earnings',
        title: 'FY27 Q1 财报发布',
        description: '预计关注 OCI 增速、RPO 转收入节奏、capex 与现金流表现。',
        impactQuestion: '管理层是否给出更清晰的 AI 云订单兑现路径？'
      },
      {
        type: 'earnings',
        title: 'FY27 Q2 财报发布',
        description: '继续观察前一季度指引是否兑现。',
        impactQuestion: 'AI 云叙事是否能连续多个季度获得基本面验证？'
      }
    ]
  },
  technicalContext: {
    priceAction: '过去 6 个月波动较大，当前处于区间整理阶段',
    volume: '财报前后成交量显著放大，日均成交量处于历史较高水平',
    optionsIv: '财报前 IV 升高，反映市场对业绩的分歧预期',
    keyZones: [
      { type: '关键支撑', level: '130-135', note: '过去 3 个月多次测试区域' },
      { type: '关键阻力', level: '160-165', note: '历史成交密集区' }
    ],
    note: '价格走势主要围绕财报和 AI 云相关信息波动，技术面为背景参考，核心还是基本面验证。'
  },
  evidence: [
    {
      id: 'ev-001',
      sourceLabel: '财报电话会议',
      sourceType: 'earnings-call',
      timestamp: '2026-06-05',
      summary: '管理层提到 OCI AI 相关订单增长，数据中心建设按计划推进',
      confidence: 0.9
    },
    {
      id: 'ev-002',
      sourceLabel: '客户订单新闻',
      sourceType: 'press-release',
      timestamp: '2026-05-28',
      summary: '某大型企业与 Oracle 签订 OCI AI 服务框架协议',
      confidence: 0.8
    },
    {
      id: 'ev-003',
      sourceLabel: '行业报告',
      sourceType: 'industry-report',
      timestamp: '2026-05-20',
      summary: '第三方数据显示 OCI 市场份额环比提升',
      confidence: 0.7
    },
    {
      id: 'ev-004',
      sourceLabel: '数据中心追踪',
      sourceType: 'infra-data',
      timestamp: '2026-05-15',
      summary: '区域数据中心交付进度符合预期，新区域筹备中',
      confidence: 0.6
    }
  ],
  nextSteps: [
    {
      task: '核查 RPO 转收入节奏',
      whyItMatters: 'RPO 是未来收入的先行指标，其转化速度反映客户订单的实际执行情况',
      followUpDate: '2026-09-15'
    },
    {
      task: '观察 OCI 收入增速',
      whyItMatters: 'OCI 是 AI 叙事的核心载体，其增速决定市场对 AI 云故事的信任度',
      followUpDate: '2026-09-15'
    },
    {
      task: '对比 capex 和现金流压力',
      whyItMatters: '高 capex 投入是当前市场主要担忧点，需要验证其可持续性',
      followUpDate: '2026-09-15'
    },
    {
      task: '跟踪数据中心交付节奏',
      whyItMatters: '数据中心是 AI 云服务的基础设施，交付节奏影响产能扩张速度',
      followUpDate: '2026-08-01'
    },
    {
      task: '复盘下一次财报管理层指引',
      whyItMatters: '管理层对下一季度的展望是验证 AI 云叙事的关键证据',
      followUpDate: '2026-09-15'
    }
  ],
  disclaimer: '仅供信息整理、研究辅助和教育参考，不构成投资建议。'
};
