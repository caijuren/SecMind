/**
 * SecMind UI Guidelines ESLint Plugin v2
 * 
 * 基于 admin-ui-guidelines-v2.md 第19章禁用项的自动检测规则（深色主题版）
 * 
 * @description 防止浅色主题残留代码进入代码库
 * @version 2.0.0
 * @see ../../docs/admin-ui-guidelines-v2.md#第19章-当前版本的禁用项
 */

export const rules = {
  /**
   * Rule 1: 禁止浅色页面背景 bg-white / bg-slate-50
   * 
   * ❌ 违规示例:
   * - bg-white (作为页面/卡片背景)
   * - bg-slate-50
   * - bg-gray-50
   * 
   * ✅ 正确用法:
   * - bg-[#09090b] (页面背景)
   * - bg-[#131316] (卡片背景)
   */
  'no-light-page-bg': {
    meta: {
      type: 'problem',
      docs: {
        description: '禁止使用浅色页面背景 (违反 admin-ui-guidelines-v2 第19章)',
        category: 'UI Guidelines',
        recommended: 'error',
      },
      messages: {
        noLightBg: '❌ 禁止使用 "{{bgClass}}" 浅色背景 (违反 admin-ui-guidelines-v2 第19章). 深色主题请使用 "bg-[#09090b]" (页面) 或 "bg-[#131316]" (卡片)',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const lightBgPattern = /\b(bg-white|bg-slate-50|bg-gray-50|bg-neutral-50)\b/;
            const match = node.value.match(lightBgPattern);
            if (match && !node.value.includes('text-white') && !node.value.includes('bg-white/')) {
              context.report({
                node,
                messageId: 'noLightBg',
                data: { bgClass: match[0] },
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 2: 禁止 slate 深色文本（深色背景下对比度不足）
   * 
   * ❌ 违规示例:
   * - text-slate-900
   * - text-slate-800
   * - text-slate-700
   * 
   * ✅ 正确用法:
   * - text-zinc-100 (一级标题)
   * - text-zinc-200 (二级标题)
   * - text-zinc-300/400 (正文)
   */
  'no-slate-text-on-dark': {
    meta: {
      type: 'problem',
      docs: {
        description: '禁止在深色背景使用 slate 深色文本 (违反 admin-ui-guidelines-v2 第4章)',
        category: 'UI Guidelines',
        recommended: 'error',
      },
      messages: {
        noSlateText: '❌ 禁止使用 "{{textClass}}" 在深色背景上 (对比度不足). 请使用 zinc 系列 (text-zinc-100/200/300)',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const slateTextPattern = /\b(text-slate-[789]\d{2})\b/;
            const match = node.value.match(slateTextPattern);
            if (match) {
              context.report({
                node,
                messageId: 'noSlateText',
                data: { textClass: match[0] },
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 3: 禁止浅色输入框边框
   * 
   * ❌ 违规示例:
   * - border-slate-200
   * - border-slate-300
   * 
   * ✅ 正确用法:
   * - border-white/8 (深色输入框)
   * - border-white/6 (深色卡片边框)
   */
  'no-light-input-border': {
    meta: {
      type: 'warn',
      docs: {
        description: '禁止使用浅色输入框边框 (违反 admin-ui-guidelines-v2 第8章)',
        category: 'UI Guidelines',
        recommended: 'warn',
      },
      messages: {
        noLightBorder: '⚠️ 不建议使用 "{{borderClass}}" 浅色边框. 深色主题请使用 "border-white/8"',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const lightBorderPattern = /\b(border-slate-[12]\d{2})\b/;
            const match = node.value.match(lightBorderPattern);
            if (match) {
              context.report({
                node,
                messageId: 'noLightBorder',
                data: { borderClass: match[0] },
              });
            }
          }
        },
      };
    },
  },

  /**
   * Rule 4: 建议替换 slate-500/600 为 zinc（对比度警告）
   * 
   * ⚠️ 浅色模式下的 slate-500 在深色背景下对比度不足
   * 
   * ❌ 建议替换:
   * - text-slate-500 → text-zinc-400
   * - text-slate-600 → text-zinc-500
   */
  'prefer-zinc-over-slate': {
    meta: {
      type: 'warn',
      docs: {
        description: '深色背景下建议使用 zinc 替代 slate (admin-ui-guidelines-v2 第4章)',
        category: 'UI Guidelines',
        recommended: 'warn',
      },
      messages: {
        preferZinc: '⚠️ 深色背景下建议将 "{{slateClass}}" 替换为 zinc 系列以获得更好对比度',
      },
      schema: [],
    },
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            const slatePattern = /\b(text-slate-[56]\d{2})\b/;
            const match = node.value.match(slatePattern);
            if (match) {
              context.report({
                node,
                messageId: 'preferZinc',
                data: { slateClass: match[0] },
              });
            }
          }
        },
      };
    },
  },
};

export default {
  name: 'ui-guidelines-v2',
  rules,
};