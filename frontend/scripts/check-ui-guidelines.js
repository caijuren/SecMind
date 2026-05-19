#!/usr/bin/env node

/**
 * SecMind UI Guidelines Compliance Checker v2
 * 
 * 独立的 UI 规范合规性检查脚本（深色主题版）
 * 可用于：手动运行 / CI/CD / Git Hook
 * 
 * @usage:
 *   node scripts/check-ui-guidelines.js              # 检查所有 dashboard 页面
 *   node scripts/check-ui-guidelines.js --fix          # 显示修复建议
 *   node scripts/check-ui-guidelines.js --json         # 输出 JSON 格式结果
 * 
 * @see docs/admin-ui-guidelines-v2.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ==================== 配置 ====================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_DIR = path.join(__dirname, '../src/app/(dashboard)');

const VIOLATION_PATTERNS = [
  {
    id: 'light-bg-page',
    name: '浅色背景残留',
    severity: 'error',
    pattern: /\b(bg-white(?!\/)|bg-slate-50|bg-gray-50|bg-neutral-50)\b/g,
    description: '禁止使用浅色背景 (v2规范第19章)，bg-white/ 透明变体除外',
    fix: '替换为 "bg-[#09090b]" (页面) 或 "bg-[#131316]" (卡片)',
  },
  {
    id: 'slate-text',
    name: 'Slate 文本颜色',
    severity: 'error',
    pattern: /\btext-slate-[789]\d{2}\b/g,
    description: '禁止在深色背景使用 slate 文本 (对比度不足) (v2规范第4章)',
    fix: '替换为 zinc 系列: text-zinc-100/200/300',
  },
  {
    id: 'light-input',
    name: '浅色输入框',
    severity: 'warn',
    pattern: /\bborder-slate-200\b/g,
    description: '禁止使用浅色输入框边框 (v2规范第8章)',
    fix: '替换为 "border-white/8"',
  },
  {
    id: 'missing-dark-bg',
    name: 'Slate 中色文本',
    severity: 'warn',
    pattern: /\btext-slate-[56]\d{2}\b/g,
    description: 'slate-500/600 在深色背景上对比度可能不足 (v2规范第4章)',
    fix: '替换为 "text-zinc-400" 或 "text-zinc-500"',
  },
  {
    id: 'light-border',
    name: '浅色边框',
    severity: 'warn',
    pattern: /\bborder-slate-[12]\d{2}\b/g,
    description: '不建议使用浅色边框在深色背景下 (v2规范第6章)',
    fix: '替换为 "border-white/6" 或 "border-white/4"',
  },
];

// ==================== 核心逻辑 ====================

function findPageFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name === 'page.tsx') {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(DASHBOARD_DIR, filePath);
  const violations = [];
  
  for (const rule of VIOLATION_PATTERNS) {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    
    while ((match = regex.exec(content)) !== null) {
      if (rule.excludePattern) {
        const lineStart = content.lastIndexOf('\n', match.index);
        const lineEnd = content.indexOf('\n', match.index);
        const line = content.substring(lineStart + 1, lineEnd || lineStart + 200);
        
        if (rule.excludePattern.test(line)) {
          continue;
        }
      }
      
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        file: relativePath,
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index),
        matchedText: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        description: rule.description,
        fix: rule.fix,
      });
    }
  }
  
  return violations;
}

function formatOutput(results, options = {}) {
  const { json = false } = options;
  
  if (json) {
    return JSON.stringify(results, null, 2);
  }
  
  let output = '';
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalFiles = results.files.length;
  let filesWithViolations = 0;
  
  output += '\n';
  output += '╔══════════════════════════════════════════════════════════╗\n';
  output += '║     🎯 SecMind UI Guidelines Compliance Check v2         ║\n';
  output += '║     基于 admin-ui-guidelines-v2.md (深色主题)            ║\n';
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  for (const fileResult of results.files) {
    if (fileResult.violations.length === 0) continue;
    
    filesWithViolations++;
    output += `📄 ${fileResult.file}\n`;
    output += '─'.repeat(60) + '\n';
    
    for (const violation of fileResult.violations) {
      const icon = violation.severity === 'error' ? '❌' : '⚠️';
      const sevLabel = violation.severity === 'error' ? 'ERROR' : 'WARN';
      
      output += `  ${icon} [${sevLabel}] Line ${violation.line}: ${violation.ruleName}\n`;
      output += `     找到: "${violation.matchedText}"\n`;
      output += `     说明: ${violation.description}\n`;
      if (options.showFix) {
        output += `     🔧 修复: ${violation.fix}\n`;
      }
      output += '\n';
      
      if (violation.severity === 'error') totalErrors++;
      else totalWarnings++;
    }
  }
  
  output += '═'.repeat(60) + '\n';
  output += '📊 统计汇总\n\n';
  output += `   检查文件数: ${totalFiles}\n`;
  output += `   问题文件数: ${filesWithViolations}\n`;
  output += `   ❌ 错误 (Error): ${totalErrors}\n`;
  output += `   ⚠️  警告 (Warn): ${totalWarnings}\n\n`;
  
  if (totalErrors === 0 && totalWarnings === 0) {
    output += '🎉 所有检查项通过！深色主题 UI 规范 100% 合规！\n\n';
  } else if (totalErrors === 0) {
    output += `✅ 无错误，但有 ${totalWarnings} 个警告（可提交但建议修复）\n\n`;
  } else {
    output += `❌ 发现 ${totalErrors} 个错误，${totalWarnings} 个警告（必须修复后才能提交）\n\n`;
  }
  
  return output;
}

// ==================== 主程序 ====================

async function main() {
  const args = process.argv.slice(2);
  const options = {
    json: args.includes('--json'),
    showFix: args.includes('--fix') || args.includes('--suggest'),
  };
  
  console.log('🔍 正在扫描深色主题 UI 规范违规...\n');
  
  const pageFiles = findPageFiles(DASHBOARD_DIR);
  console.log(`📂 发现 ${pageFiles.length} 个页面文件\n`);
  
  const results = {
    timestamp: new Date().toISOString(),
    files: pageFiles.map(filePath => ({
      file: path.relative(DASHBOARD_DIR, filePath),
      violations: checkFile(filePath),
    })),
    summary: {
      totalFiles: pageFiles.length,
      errors: 0,
      warnings: 0,
    },
  };
  
  for (const fileResult of results.files) {
    for (const violation of fileResult.violations) {
      if (violation.severity === 'error') results.summary.errors++;
      else results.summary.warnings++;
    }
  }
  
  const output = formatOutput(results, options);
  console.log(output);
  
  if (options.json) {
    const jsonPath = path.join(__dirname, 'ui-guidelines-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`📄 完整报告已保存至: ${jsonPath}\n`);
  }
  
  if (results.summary.errors > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ 检查过程中出错:', error.message);
  process.exit(2);
});
