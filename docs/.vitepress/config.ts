import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'SecMind 文档',
  description: 'AI 驱动的智能安全运营平台文档',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '产品介绍', link: '/product-introduction' },
      { text: '指南', link: '/guide/getting-started' },
      { text: '功能', link: '/features/ai-analysis' },
      { text: 'API', link: '/api/overview' }
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    },
    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装部署', link: '/guide/installation' },
            { text: '配置说明', link: '/guide/configuration' },
            { text: '架构说明', link: '/guide/architecture' }
          ]
        },
        {
          text: '操作手册',
          items: [
            { text: '产品使用说明', link: '/guide/user-guide' },
            { text: 'UI 设计规范', link: '/guide/ui-guidelines' }
          ]
        },
        {
          text: '运维指南',
          items: [
            { text: 'AI 模型配置', link: '/guide/ai-model-config' },
            { text: '多租户部署', link: '/guide/multi-tenant-deploy' },
            { text: '性能调优', link: '/guide/performance-tuning' },
            { text: '升级指南', link: '/guide/upgrade-guide' },
            { text: '安全最佳实践', link: '/guide/security-best-practices' }
          ]
        },
        {
          text: '开发指南',
          items: [
            { text: '发版规范', link: '/guide/release-guide' }
          ]
        }
      ],
      '/features/': [
        {
          text: '功能介绍',
          items: [
            { text: 'AI 智能分析', link: '/features/ai-analysis' },
            { text: '威胁狩猎', link: '/features/threat-hunting' },
            { text: '事件响应', link: '/features/incident-response' },
            { text: '剧本自动化', link: '/features/playbooks' },
            { text: '合规管理', link: '/features/compliance' },
            { text: '报告中心', link: '/features/reports' },
            { text: 'AI 对话助手', link: '/features/ai-chat' },
            { text: '态势大屏', link: '/features/situation-room' },
            { text: '策略自演化', link: '/features/strategy-evolution' },
            { text: '多租户管理', link: '/features/multi-tenant' },
            { text: '账单与订阅', link: '/features/billing' },
            { text: '权限管理', link: '/features/rbac' },
            { text: '实时更新', link: '/features/realtime' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/overview' },
            { text: '认证鉴权', link: '/api/authentication' },
            { text: '告警管理', link: '/api/alerts' },
            { text: '事件响应', link: '/api/response' },
            { text: '威胁狩猎', link: '/api/hunting' },
            { text: '威胁情报', link: '/api/ioc' },
            { text: '报告生成', link: '/api/reports' },
            { text: 'AI 分析', link: '/api/ai-analysis' },
            { text: 'AI 对话', link: '/api/ai-chat' },
            { text: 'AI 模型路由', link: '/api/ai-models' },
            { text: '策略演化', link: '/api/strategy-evolution' },
            { text: '合规管理', link: '/api/compliance' },
            { text: '租户与账单', link: '/api/tenants-billing' },
            { text: '权限管理', link: '/api/rbac' },
            { text: 'DAG 与执行', link: '/api/dag-execution' },
            { text: 'WebSocket', link: '/api/websocket' },
            { text: '系统监控', link: '/api/system-monitor' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/secmind' }
    ],
    footer: {
      message: '基于 MIT 许可发布',
      copyright: '© 2024-present SecMind'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    outline: {
      label: '页面导航',
      level: [2, 3]
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
