import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import uiGuidelinesPlugin from "./eslint-plugins/ui-guidelines.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ==================== SecMind UI Guidelines Plugin v2 ====================
  // 基于 admin-ui-guidelines-v2.md 第19章禁用项的自动化检测（深色主题版）
  // 防止浅色主题残留代码进入代码库
  {
    plugins: {
      "ui-guidelines": uiGuidelinesPlugin,
    },
    rules: {
      // 🔴 Error 级别（必须通过，否则无法提交）
      
      // 第19章禁用项: 禁止浅色页面背景 bg-white/bg-slate-50
      "ui-guidelines/no-light-page-bg": "error",
      
      // 🟡 Warn 级别（警告但不阻断，允许特殊情况）
      
      // 第4章: 禁止深色背景下使用 slate 深色文本（对比度不足）
      "ui-guidelines/no-slate-text-on-dark": "warn",
      
      // 第8章: 禁止浅色输入框边框
      "ui-guidelines/no-light-input-border": "warn",
      
      // 第4章: 深色背景下建议使用 zinc 替代 slate
      "ui-guidelines/prefer-zinc-over-slate": "warn",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "eslint-plugins/**",
  ]),

  // Playbook Editor 使用暗黑主题，豁免浅色背景检测规则
  {
    files: ["src/components/playbook-editor.tsx"],
    rules: {
      "ui-guidelines/no-light-page-bg": "off",
      "ui-guidelines/no-slate-text-on-dark": "off",
    },
  },
]);

export default eslintConfig;