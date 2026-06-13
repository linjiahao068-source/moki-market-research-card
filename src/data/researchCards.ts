import { ResearchCard } from '@/types/research-card';
import { orclResearchCard } from './orclResearchCard';

export const nvdaResearchCard: ResearchCard = {
  slug: 'nvda-sentiment-radar',
  ticker: 'NVDA',
  companyName: 'NVIDIA',
  title: 'NVDA｜X 情绪雷达研究卡',
  subtitle: '当前更像：高热度共识 + 兑现节奏分歧',
  cardType: 'sentiment_radar',
  updatedAt: '2026-06-13',
  isMock: true,
  summary: {
    oneLine: 'NVDA 当前研究问题集中在 AI 算力需求能否持续兑现，以及 Blackwell 交付、云厂商 capex、数据中心收入和毛利率之间的验证节奏。',
    currentState: '当前更像高热度共识和兑现节奏分歧：市场普遍认可 AI 算力需求，但对订单消化、交付节奏和盈利持续性存在明显讨论差异。',
    keyQuestion: '后续最需要研究的是 Blackwell 交付节奏能否支撑数据中心收入继续增长，同时毛利率和客户集中度风险是否可控。'
  },
  sentiment: {
    heatLevel: 9.2,
    direction: 'high-consensus-with-delivery-disagreement',
    disagreement: 0.72,
    keyDebates: [
      '乐观叙事：AI 算力需求仍然强劲，云厂商和企业客户对 GPU 集群的需求具有持续性',
      '谨慎叙事：市场对 Blackwell 交付节奏预期较高，任何延迟都可能放大情绪波动',
      '分歧点：云厂商 capex 是否会继续扩张，还是进入阶段性预算审视',
      '分歧点：数据中心收入增长能否继续覆盖产品切换期的不确定性',
      '分歧点：毛利率能否在新产品放量和供应链变化中保持稳定'
    ]
  },
  fundamentals: {
    businessModel: '以 GPU、加速计算平台、网络互连和软件生态为核心，数据中心业务成为主要增长驱动。',
    revenueDrivers: [
      '数据中心 GPU 与加速计算平台',
      'Blackwell 相关产品交付与放量',
      '云厂商 AI 基础设施 capex',
      '网络互连、系统级方案和软件生态',
      '企业 AI 推理和训练需求扩展'
    ],
    keyMetrics: [
      {
        label: '数据中心收入增速',
        description: 'sample/mock：高增长仍是市场关注核心',
        whyItMatters: '用于观察 AI 算力需求是否继续转化为实际收入。'
      },
      {
        label: 'Blackwell 交付节奏',
        description: 'sample/mock：处于市场高关注交付周期',
        whyItMatters: '用于验证新一代产品切换是否顺利，以及收入确认节奏是否稳定。'
      },
      {
        label: '云厂商 capex 指引',
        description: 'sample/mock：大型云平台支出节奏是关键外部变量',
        whyItMatters: '用于判断 AI 基础设施需求是否具备持续预算支持。'
      },
      {
        label: '毛利率持续性',
        description: 'sample/mock：产品结构和供应链变化可能影响利润率',
        whyItMatters: '用于观察高增长阶段的盈利质量是否稳定。'
      },
      {
        label: '客户集中度',
        description: 'sample/mock：大型云客户贡献度较高',
        whyItMatters: '用于评估单一客户或少数客户采购节奏变化对收入的影响。'
      }
    ],
    risks: [
      'Blackwell 交付节奏低于市场预期',
      '云厂商 capex 进入阶段性预算审视',
      '数据中心收入增长速度放缓',
      '毛利率受到产品切换、供应链或竞争影响',
      '客户集中度导致订单节奏波动放大'
    ]
  },
  events: {
    items: [
      {
        type: 'product',
        title: 'Blackwell 交付节奏观察',
        description: 'sample/mock：市场持续关注新一代 AI 加速平台的供给、交付和客户部署节奏。',
        impactQuestion: 'Blackwell 放量是否能平滑衔接上一代产品需求，并支撑数据中心收入延续增长？'
      },
      {
        type: 'customer',
        title: '云厂商 AI 基础设施预算',
        description: 'sample/mock：大型云平台 capex 指引是验证 AI 算力需求的重要外部线索。',
        impactQuestion: '云厂商是否继续提高 AI 基础设施投入，还是进入投入效率复盘阶段？'
      },
      {
        type: 'earnings',
        title: '下一次财报管理层指引',
        description: 'sample/mock：重点关注数据中心收入、毛利率、供给约束和客户需求描述。',
        impactQuestion: '管理层是否给出更清晰的交付、需求和盈利质量验证线索？'
      },
      {
        type: 'market-context',
        title: 'X 舆情热度变化',
        description: 'sample/mock：X 上围绕 AI 算力、产品交付和估值消化的讨论热度较高。',
        impactQuestion: '情绪热度是否来自基本面线索，还是主要来自短期叙事扩散？'
      }
    ]
  },
  technicalContext: {
    priceAction: 'sample/mock：价格波动受 AI 叙事、财报预期和大型科技股风险偏好影响。',
    volume: 'sample/mock：关键产品和财报信息窗口附近，成交量可能出现阶段性放大。',
    optionsIv: 'sample/mock：财报和产品交付节点前后，IV 可能反映市场对兑现节奏的分歧。',
    keyZones: [
      { type: '观察区间', level: 'sample range A', note: '仅作为背景信息，不构成操作建议' },
      { type: '观察区间', level: 'sample range B', note: '用于复盘波动来源和情绪变化' }
    ],
    note: '技术/交易面只作为背景信息，用于理解市场波动，不构成任何操作建议。'
  },
  evidence: [
    {
      id: 'nvda-ev-001',
      sourceLabel: 'Sample 财报电话会议',
      sourceType: 'mock-earnings-call',
      timestamp: '2026-06-10',
      summary: '[Mock] 管理层讨论数据中心需求、产品交付和客户部署节奏。',
      confidence: 0.9
    },
    {
      id: 'nvda-ev-002',
      sourceLabel: 'Sample 云厂商 capex 摘要',
      sourceType: 'mock-cloud-capex-note',
      timestamp: '2026-06-08',
      summary: '[Mock] 大型云平台继续讨论 AI 基础设施投入，但市场关注投入效率。',
      confidence: 0.78
    },
    {
      id: 'nvda-ev-003',
      sourceLabel: 'Sample X 舆情观察',
      sourceType: 'mock-social-sentiment',
      timestamp: '2026-06-07',
      summary: '[Mock] X 上乐观叙事集中于 AI 算力需求，谨慎叙事集中于交付和盈利节奏。',
      confidence: 0.72
    },
    {
      id: 'nvda-ev-004',
      sourceLabel: 'Sample 行业供应链追踪',
      sourceType: 'mock-supply-chain-note',
      timestamp: '2026-06-05',
      summary: '[Mock] 市场关注新产品供给、封装产能和系统交付节奏。',
      confidence: 0.68
    }
  ],
  nextSteps: [
    {
      task: '核查 Blackwell 交付节奏',
      whyItMatters: '验证新一代产品能否按市场预期进入客户部署阶段。',
      followUpDate: '2026-08-15'
    },
    {
      task: '观察数据中心收入增速',
      whyItMatters: '判断 AI 算力需求是否继续转化为收入增长。',
      followUpDate: '2026-08-15'
    },
    {
      task: '对比云厂商 capex 指引',
      whyItMatters: '确认大型客户是否继续支持 AI 基础设施扩张。',
      followUpDate: '2026-07-30'
    },
    {
      task: '复盘毛利率持续性',
      whyItMatters: '观察产品切换和供应链变化是否影响盈利质量。',
      followUpDate: '2026-08-15'
    },
    {
      task: '跟踪客户集中度变化',
      whyItMatters: '评估少数大型客户采购节奏变化对收入波动的影响。',
      followUpDate: '2026-08-15'
    }
  ],
  disclaimer: '仅供信息整理、研究辅助和教育参考，不构成投资建议。'
};

export const tslaResearchCard: ResearchCard = {
  slug: 'tsla-news-decode',
  ticker: 'TSLA',
  companyName: 'Tesla',
  title: 'TSLA｜新闻与情绪恐慌解读卡',
  subtitle: '当前更像：新闻驱动 + 情绪波动，而非单一基本面结论',
  cardType: 'news_decode',
  updatedAt: '2026-06-13',
  isMock: true,
  summary: {
    oneLine: 'TSLA 的信息噪音通常来自产品事件、交付数据、价格竞争、汽车毛利率、储能业务和 FSD / Robotaxi 叙事之间的快速切换。',
    currentState: '当前更像新闻驱动和情绪波动：单条新闻容易放大市场讨论，但仍需要回到交付、毛利率、储能和自动驾驶叙事的证据链中复盘。',
    keyQuestion: '用户最该继续研究的是：近期新闻是否真正改变交付、汽车毛利率、储能增长或 FSD / Robotaxi 兑现节奏。'
  },
  sentiment: {
    heatLevel: 8.6,
    direction: 'news-driven-high-volatility',
    disagreement: 0.85,
    keyDebates: [
      '乐观叙事：FSD / Robotaxi 叙事可能提升市场对长期业务边界的想象空间',
      '谨慎叙事：交付数据和价格竞争仍然影响汽车业务的短期验证节奏',
      '分歧点：储能业务增长能否缓冲汽车业务波动',
      '分歧点：汽车毛利率是否能够在竞争环境中保持稳定',
      '分歧点：KOL 对单条新闻的解读差异容易带来情绪快速摆动'
    ]
  },
  fundamentals: {
    businessModel: '以电动车销售为基础，同时扩展储能、软件服务、FSD / Robotaxi 叙事和能源生态。',
    revenueDrivers: [
      '电动车交付量和车型结构',
      '车辆定价和价格竞争环境',
      '储能业务部署和收入增长',
      'FSD 软件订阅与自动驾驶叙事',
      '服务、充电网络和其他生态收入'
    ],
    keyMetrics: [
      {
        label: '季度交付数据',
        description: 'sample/mock：交付节奏是市场情绪的重要触发点',
        whyItMatters: '用于观察需求、产能利用率和区域竞争压力是否发生变化。'
      },
      {
        label: '汽车毛利率',
        description: 'sample/mock：价格调整和产品结构可能影响利润率',
        whyItMatters: '用于判断价格竞争是否侵蚀核心汽车业务盈利质量。'
      },
      {
        label: '储能业务收入',
        description: 'sample/mock：储能被视为汽车业务之外的重要增长线索',
        whyItMatters: '用于观察收入结构是否更加多元。'
      },
      {
        label: 'FSD / Robotaxi 进展',
        description: 'sample/mock：叙事热度高，但需要验证落地节奏',
        whyItMatters: '用于区分长期想象空间和短期可验证进展。'
      },
      {
        label: '价格竞争强度',
        description: 'sample/mock：不同区域的竞争和促销可能影响单车经济性',
        whyItMatters: '用于观察销量增长与利润率之间的平衡。'
      }
    ],
    risks: [
      '交付数据低于市场情绪预期导致讨论快速降温',
      '价格竞争加剧影响汽车毛利率',
      'FSD / Robotaxi 叙事兑现节奏不确定',
      '储能业务增长无法完全抵消汽车业务波动',
      'KOL 分歧放大单条新闻带来的短期情绪波动'
    ]
  },
  events: {
    items: [
      {
        type: 'delivery',
        title: '季度交付数据观察',
        description: 'sample/mock：交付数据常常触发市场对需求、产能和区域竞争的重新讨论。',
        impactQuestion: '交付变化是否来自真实需求变化，还是短期排产、物流或区域节奏影响？'
      },
      {
        type: 'pricing',
        title: '价格竞争与促销信息',
        description: 'sample/mock：价格调整容易被市场快速解读，但需要结合毛利率和销量一起复盘。',
        impactQuestion: '价格变化是否改善需求，还是进一步压缩汽车业务盈利质量？'
      },
      {
        type: 'product',
        title: 'FSD / Robotaxi 叙事更新',
        description: 'sample/mock：自动驾驶相关进展容易引发高热度讨论，但落地节奏仍需证据验证。',
        impactQuestion: '相关进展是否能转化为可持续的软件收入或服务场景？'
      },
      {
        type: 'energy',
        title: '储能业务增长线索',
        description: 'sample/mock：储能业务被视为 Tesla 非汽车收入结构的重要观察方向。',
        impactQuestion: '储能增长是否具备持续性，并能改善整体业务波动？'
      },
      {
        type: 'sentiment',
        title: 'KOL 分歧与情绪波动',
        description: 'sample/mock：X 上不同 KOL 对同一新闻可能给出差异很大的解读。',
        impactQuestion: '情绪变化是否有基本面证据支撑，还是主要来自叙事扩散？'
      }
    ]
  },
  technicalContext: {
    priceAction: 'sample/mock：价格波动常受新闻事件、交付数据、自动驾驶叙事和市场风险偏好影响。',
    volume: 'sample/mock：产品事件、交付数据或 KOL 讨论升温时，成交量可能阶段性放大。',
    optionsIv: 'sample/mock：事件窗口附近 IV 可能反映市场对新闻和情绪波动的分歧。',
    keyZones: [
      { type: '观察区间', level: 'sample range A', note: '仅作为背景信息，不构成操作建议' },
      { type: '观察区间', level: 'sample range B', note: '用于复盘新闻驱动下的波动来源' }
    ],
    note: '技术/交易面只作为背景信息，用于理解新闻和情绪波动，不构成任何操作建议。'
  },
  evidence: [
    {
      id: 'tsla-ev-001',
      sourceLabel: 'Sample 交付数据摘要',
      sourceType: 'mock-delivery-report',
      timestamp: '2026-06-10',
      summary: '[Mock] 市场围绕季度交付节奏、区域需求和车型结构展开讨论。',
      confidence: 0.86
    },
    {
      id: 'tsla-ev-002',
      sourceLabel: 'Sample 价格竞争新闻',
      sourceType: 'mock-news-summary',
      timestamp: '2026-06-08',
      summary: '[Mock] 市场关注不同区域的价格调整和促销活动对汽车毛利率的影响。',
      confidence: 0.76
    },
    {
      id: 'tsla-ev-003',
      sourceLabel: 'Sample X KOL 讨论',
      sourceType: 'mock-social-sentiment',
      timestamp: '2026-06-07',
      summary: '[Mock] X 上围绕 FSD / Robotaxi 叙事存在乐观叙事与谨慎叙事分歧。',
      confidence: 0.72
    },
    {
      id: 'tsla-ev-004',
      sourceLabel: 'Sample 储能业务线索',
      sourceType: 'mock-business-update',
      timestamp: '2026-06-05',
      summary: '[Mock] 储能业务增长被视为非汽车收入结构的重要待核查信息。',
      confidence: 0.7
    }
  ],
  nextSteps: [
    {
      task: '核查季度交付数据变化来源',
      whyItMatters: '区分需求变化、生产节奏、物流安排和区域结构的影响。',
      followUpDate: '2026-07-15'
    },
    {
      task: '复盘汽车毛利率变化',
      whyItMatters: '判断价格竞争是否影响核心汽车业务盈利质量。',
      followUpDate: '2026-08-15'
    },
    {
      task: '跟踪储能业务收入增长',
      whyItMatters: '观察非汽车业务是否能改善整体收入结构。',
      followUpDate: '2026-08-15'
    },
    {
      task: '梳理 FSD / Robotaxi 叙事证据链',
      whyItMatters: '区分长期想象空间和短期可验证进展。',
      followUpDate: '2026-08-01'
    },
    {
      task: '复盘 KOL 分歧和情绪变化',
      whyItMatters: '判断单条新闻引发的波动是否有基本面证据支撑。',
      followUpDate: '2026-07-30'
    }
  ],
  disclaimer: '仅供信息整理、研究辅助和教育参考，不构成投资建议。'
};

export const researchCards: ResearchCard[] = [orclResearchCard, nvdaResearchCard, tslaResearchCard];

export function getResearchCardBySlug(slug: string) {
  return researchCards.find((card) => card.slug === slug);
}

export function getAllResearchCards() {
  return researchCards;
}
