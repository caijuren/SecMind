import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import uiGuidelinesPlugin from "./eslint-plugins/ui-guidelines.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  
  // ==================== SecMind UI Guidelines Plugin ====================
  // 基于 admin-ui-guidelines-v1.md 的自动化检测规则
  // 防止 UI 规范违规代码进入代码库
  {
    plugins: {
      'ui-guidelines': uiGuidelinesPlugin,
    },
    rules: {
      // 🔴 Error 级别（必须通过，否则无法提交）
      
      // 第19章禁用项 #1: 禁止透明度背景
      'ui-guidelines/no-transparent-bg': 'error',
      
      // 第19章禁用项 #2: 禁止毛玻璃效果
      'ui-guidelines/no-backdrop-blur': 'error',
      
      // 第19章禁用项 #3: 禁止发光阴影
      'ui-guidelines/no-glow-shadow': 'error',
      
      // 🟡 Warn 级别（警告但不阻断，允许特殊情况）
      
      // 第4/5章: 不建议使用 violet 作为主色
      'ui-guidelines/no-violet-primary-color': 'warn',
      
      // 第4章: 文本对比度不足
      'ui-guidelines/no-light-text-on-light-bg': 'warn',
      
      // 第19章禁用项: 装饰性渐变
      'ui-guidelines/no-decorative-gradient': 'warn',
    },
  },
  
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    
    // 忽略 ESLint 插件自身
    "eslint-plugins/**",
  ]),

  // Playbook Editor 使用暗黑主题，允许发光阴影和毛玻璃效果
  {
    files: ["src/components/playbook-editor.tsx"],
    rules: {
      "ui-guidelines/no-glow-shadow": "off",
      "ui-guidelines/no-backdrop-blur": "off",
      "ui-guidelines/no-light-text-on-light-bg": "off",
      "ui-guidelines/no-transparent-bg": "off",
    },
  },
]);

export default eslintConfig;
