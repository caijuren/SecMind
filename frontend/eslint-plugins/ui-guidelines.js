/**
 * SecMind UI Guidelines ESLint Plugin
 * 
 * 基于 admin-ui-guidelines-v1.md 第19章禁用项的自动检测规则
 * 
 * @description 防止 UI 规范违规代码进入代码库
 * @version 1.0.0
 * @see ../../docs/admin-ui-guidelines-v1.md#第19章-当前版本的禁用项
 */

export const rules = {
  /**
   * Rule 1: 禁止透明度背景 bg-white/[0.xx]
   * 
   * ❌ 违规示例:
   * - bg-white/[0.02]
   * - bg-white/[0.04]
   * - bg-white/[0.06]
   * 
   * ✅ 正确用法:
   * - bg-white (实心白底)
   * - bg-slate-50 (浅灰底)
   */
  'no-transparent-bg': {
    meta: {
      type: 'problem',
      docs: {
        description: '禁止使用透明度背景 (违反 admin-ui-guidelines-v1 第19章)',
        category: 'UI Guidelines',
        recommended: 'error',
        url: 'https://github.com/your-repo/docs/admin-ui-guidelines-v1.md#19',
      },
      messages: {
        noTransparentBg: '❌ 禁止使用 "bg-white/[0.{{opacity}}" 透明度背景 (违反 admin-ui-guidelines-v1 第19章). 请使用 "bg-white" 或 "bg-slate-50"',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const transparentBgPattern = /bg-white\/\[0\.0[246]\]/;
            if (transparentBgPattern.test(node.value)) {
              context.report({
                node,
                messageId: 'noTransparentBg',
                data: { opacity: node.value.match(/0\.0[246]/)?.[0] },
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 2: 禁止 backdrop-blur 效果
   * 
   * ❌ 违规示例:
   * - backdrop-blur-xl
   * - backdrop-blur-lg
   * - backdrop-blur-md
   * 
   * ✅ 正确用法:
   * - 使用实底背景替代模糊效果
   */
  'no-backdrop-blur': {
    meta: {
      type: 'problem',
      docs: {
        description: '禁止使用 backdrop-blur 毛玻璃效果 (违反 admin-ui-guidelines-v1 第19章)',
        category: 'UI Guidelines',
        recommended: 'error',
      },
      messages: {
        noBackdropBlur: '❌ 禁止使用 "backdrop-{{size}}" 毛玻璃效果 (违反 admin-ui-guidelines-v1 第19章). 请使用实底背景',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const blurPattern = /backdrop-blur-(xl|lg|md|sm)/;
            const match = node.value.match(blurPattern);
            if (match) {
              context.report({
                node,
                messageId: 'noBackdropBlur',
                data: { size: match[1] },
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 3: 禁止 glow 发光阴影
   * 
   * ❌ 违规示例:
   * - shadow-[0_0_8px_rgba(...)]
   * - shadow-[0_0_12px_rgba(...)]
   * - shadow-[0_0_20px_rgba(...)]
   * - boxShadow: { ... glow ... }
   * 
   * ✅ 正确用法:
   * - shadow-sm / shadow-md / shadow-lg (Tailwind 标准阴影)
   * - 或完全移除阴影
   */
  'no-glow-shadow': {
    meta: {
      type: 'problem',
      docs: {
        description: '禁止使用 glow 发光阴影效果 (违反 admin-ui-guidelines-v1 第19章)',
        category: 'UI Guidelines',
        recommended: 'error',
      },
      messages: {
        noGlowShadow: '❌ 禁止使用自定义发光阴影 "shadow-[0_0_...]" (违反 admin-ui-guidelines-v1 第19章). 请使用标准阴影 (shadow-sm/md/lg) 或移除',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const glowPattern = /shadow-\[0_0_\d+px?/;
            if (glowPattern.test(node.value)) {
              context.report({
                node,
                messageId: 'noGlowShadow',
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 4: 禁止 violet/purple 作为主交互色（非 MITRE 场景）
   * 
   * ⚠️ 此规则较宽松，允许在 MITRE 攻击技术映射场景使用
   * 
   * ❌ 违规示例:
   * - text-violet-600 (作为主标题/按钮颜色)
   * - bg-violet-500 (作为主按钮背景)
   * - border-violet-400 (作为主要边框)
   * 
   * ✅ 允许的场景 (需在注释中说明):
   * - MITRE 攻击技术映射相关
   * - 辅助分析模块的非主路径使用
   * 
   * ✅ 替代方案:
   * - 使用 cyan 系列 (text-cyan-600, bg-cyan-500)
   * - 使用 indigo 系列 (用于 IOC 类型等辅助场景)
   */
  'no-violet-primary-color': {
    meta: {
      type: 'warn', // 使用 warn 而非 error，因为可能有合法场景
      docs: {
        description: '不建议使用 violet/purple 作为主交互色 (admin-ui-guidelines-v1 第4章/第5章)',
        category: 'UI Guidelines',
        recommended: 'warn',
      },
      messages: {
        noVioletPrimary: '⚠️ 不建议使用 "{{colorClass}}" 作为主交互色 (admin-ui-guidelines-v1). 品牌色应统一为 cyan 系列。如确为 MITRE 映射场景，请添加注释说明',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const violetPattern = /\b(text|bg|border)-violet-\d+/;
            const match = node.value.match(violetPattern);
            if (match) {
              context.report({
                node,
                messageId: 'noVioletPrimary',
                data: { colorClass: match[0] },
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 5: 禁止白底上的浅色文本
   * 
   * ❌ 违规示例:
   * - 在 bg-white 上使用 text-cyan-300/400
   * - 在 bg-white 上使用 text-slate-300/400 (作为正文)
   * 
   * ✅ 正确用法:
   * - 正文: text-slate-600
   * - 辅助信息: text-slate-500
   * - 强调文字: text-cyan-600/700
   */
  'no-light-text-on-light-bg': {
    meta: {
      type: 'warn',
      docs: {
        description: '禁止在浅色背景上使用过浅文本 (违反 admin-ui-guidelines-v1 第4章)',
        category: 'UI Guidelines',
        recommended: 'warn',
      },
      messages: {
        noLightText: '⚠️ 不建议使用 "{{textClass}}" 在浅色背景上 (对比度不足). 正文应使用 text-slate-600, 辅助信息使用 text-slate-500',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const lightTextPattern = /\b(text-(?:cyan|slate)-[34]00)\b/;
            const match = node.value.match(lightTextPattern);
            if (match) {
              context.report({
                node,
                messageId: 'noLightText',
                data: { textClass: match[0] },
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 6: 禁止高饱和渐变装饰
   * 
   * ❌ 违规示例:
   * - bg-gradient-to-r from-cyan-500 to-teal-500 (按钮/卡片)
   * - bg-gradient-to-b from-cyan-500/25 via-purple-500/15 (大面积背景)
   * 
   * ✅ 允许的场景:
   * - 极轻微的渐变 (如 AI 模块识别度，opacity < 0.1)
   * - 图表内部的渐变 (echarts 配置)
   * 
   * ✅ 替代方案:
   * - 使用纯色 bg-cyan-50, bg-slate-50
   * - 使用轻量边框 border-cyan-200
   */
  'no-decorative-gradient': {
    meta: {
      type: 'warn',
      docs: {
        description: '禁止使用高饱和度装饰性渐变 (违反 admin-ui-guidelines-v1 第19章)',
        category: 'UI Guidelines',
        recommended: 'warn',
      },
      messages: {
        noGradient: '⚠️ 不建议使用装饰性渐变 "{{gradient}}". B端产品应保持克制,使用纯色或极轻量底色',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const gradientPattern = /bg-gradient-to-(?:r|l|b|t|br|bl|tr|tl)\s+from-[\w\/]+(?:\s+to-[\w\/]+)?/;
            const match = node.value.match(gradientPattern);
            
            if (match) {
              const gradient = match[0].substring(0, 50) + (match[0].length > 50 ? '...' : '');
              
              context.report({
                node,
                messageId: 'noGradient',
                data: { gradient },
              });
            }
          }
        },
      };
    },
  },
};

export default {
  name: 'ui-guidelines',
  rules,
};
