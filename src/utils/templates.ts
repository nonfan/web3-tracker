// 项目模板

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  defaultData: {
    tags: string[]
    priority: 'high' | 'medium' | 'low'
    tasks: string[]
  }
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'testnet',
    name: '测试网交互',
    description: '测试网项目的标准任务流程',
    icon: '🧪',
    defaultData: {
      tags: ['Testnet', '交互'],
      priority: 'medium',
      tasks: [
        '领取测试币',
        '连接钱包',
        '完成 Swap 交互',
        '添加流动性',
        '跨链桥测试',
        '填写反馈表单',
      ],
    },
  },
  {
    id: 'mainnet',
    name: '主网交互',
    description: '主网项目的标准任务流程',
    icon: '🌐',
    defaultData: {
      tags: ['Mainnet', '交互'],
      priority: 'high',
      tasks: [
        '准备 Gas 费',
        '完成首次交互',
        '保持周活跃',
        '参与治理投票',
        '关注官方公告',
      ],
    },
  },
  {
    id: 'nft',
    name: 'NFT 项目',
    description: 'NFT 铸造和交易项目',
    icon: '🎨',
    defaultData: {
      tags: ['NFT'],
      priority: 'medium',
      tasks: [
        '加入 Discord',
        '获取白名单',
        '准备 Mint 资金',
        'Mint NFT',
        '上架交易',
      ],
    },
  },
  {
    id: 'defi',
    name: 'DeFi 挖矿',
    description: 'DeFi 流动性挖矿项目',
    icon: '💰',
    defaultData: {
      tags: ['DeFi', '挖矿'],
      priority: 'high',
      tasks: [
        '研究项目安全性',
        '准备本金',
        '添加流动性',
        '质押 LP',
        '定期收割收益',
        '监控 APY 变化',
      ],
    },
  },
  {
    id: 'airdrop',
    name: '空投猎人',
    description: '潜在空投项目追踪',
    icon: '🪂',
    defaultData: {
      tags: ['Airdrop', '潜力'],
      priority: 'medium',
      tasks: [
        '关注官方 Twitter',
        '加入 Discord',
        '完成基础交互',
        '保持活跃度',
        '等待快照',
      ],
    },
  },
  {
    id: 'galxe',
    name: 'Galxe 任务',
    description: 'Galxe 平台任务',
    icon: '⭐',
    defaultData: {
      tags: ['Galxe', '任务'],
      priority: 'low',
      tasks: [
        '连接钱包',
        '完成社交任务',
        '完成链上任务',
        '领取 OAT/NFT',
      ],
    },
  },
  {
    id: 'layer2',
    name: 'Layer2 生态',
    description: 'Layer2 生态项目',
    icon: '🔗',
    defaultData: {
      tags: ['Layer2', '生态'],
      priority: 'high',
      tasks: [
        '跨链资产到 L2',
        '使用原生 DEX',
        '参与生态项目',
        '保持交易量',
        '关注官方活动',
      ],
    },
  },
  {
    id: 'custom',
    name: '自定义项目',
    description: '从空白开始创建',
    icon: '📝',
    defaultData: {
      tags: [],
      priority: 'medium',
      tasks: [],
    },
  },
]
