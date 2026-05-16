#!/usr/bin/env node

/**
 * SecMind UI Guidelines Compliance Checker
 * 
 * 独立的 UI 规范合规性检查脚本
 * 可用于：手动运行 / CI/CD / Git Hook
 * 
 * @usage:
 *   node scripts/check-ui-guidelines.js              # 检查所有 dashboard 页面
 *   node scripts/check-ui-guidelines.js --fix          # 显示修复建议
 *   node scripts/check-ui-guidelines.js --json         # 输出 JSON 格式结果
 * 
 * @see docs/admin-ui-guidelines-v1.md
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

const DASHBOARD_DIR = path.join(__dirname, '../src/app/(dashboard)');

const VIOLATION_PATTERNS = [
  {
    id: 'transparent-bg',
    name: '透明度背景',
    severity: 'error',
    pattern: /bg-white\/\[0\.0[246]\]/g,
    description: '禁止使用 bg-white/[0.02] 或 [0.04] (第19章禁用项)',
    fix: '替换为 "bg-white" 或 "bg-slate-50"',
  },
  {
    id: 'backdrop-blur',
    name: '毛玻璃效果',
    severity: 'error',
    pattern: /backdrop-blur-(xl|lg|md)/g,
    description: '禁止使用 backdrop-blur 毛玻璃效果 (第19章禁用项)',
    fix: '移除 backdrop-blur，使用实底背景',
  },
  {
    id: 'glow-shadow',
    name: '发光阴影',
    severity: 'error',
    pattern: /shadow-\[0_0_\d+px?/g,
    description: '禁止使用自定义发光阴影 shadow-[0_0_...] (第19章禁用项)',
    fix: '使用标准阴影 (shadow-sm/md/lg) 或移除',
  },
  {
    id: 'violet-primary',
    name: 'Violet 主色',
    severity: 'warn',
    pattern: /\b(text|bg|border)-violet-\d+/g,
    excludePattern: /mitre|MITRE|attack|technique/gi,
    description: '不建议使用 violet 作为主交互色（非 MITRE 场景）(第4/5章)',
    fix: '替换为 cyan 系列 (text-cyan-600, bg-cyan-500)',
  },
  {
    id: 'light-text',
    name: '浅色文本',
    severity: 'warn',
    pattern: /\b(text-(?:cyan|slate)-[34]00)\b/g,
    description: '不建议在浅色背景上使用过浅文本 (对比度不足) (第4章)',
    fix: '正文用 text-slate-600，辅助信息用 text-slate-500',
  },
  {
    id: 'decorative-gradient',
    name: '装饰渐变',
    severity: 'warn',
    pattern: /bg-gradient-to-(?:r|l|b|t|br|bl|tr|tl)\s+from-/g,
    description: '不建议使用高饱和度装饰性渐变 (第19章禁用项)',
    fix: '使用纯色 (bg-cyan-50, bg-slate-50) 或轻量边框',
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
      return; // 跳过无法读取的目录
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
      // 检查是否在排除列表中（如 MITRE 注释）
      if (rule.excludePattern) {
        const lineStart = content.lastIndexOf('\n', match.index);
        const lineEnd = content.indexOf('\n', match.index);
        const line = content.substring(lineStart + 1, lineEnd || lineStart + 200);
        
        if (rule.excludePattern.test(line)) {
          continue; // 跳过排除的匹配
        }
      }
      
      // 计算行号
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
  output += '║     🎯 SecMind UI Guidelines Compliance Check            ║\n';
  output += '║     基于 admin-ui-guidelines-v1.md 第19章                 ║\n';
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  // 按文件分组显示
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
  
  // 汇总统计
  output += '═'.repeat(60) + '\n';
  output += '📊 统计汇总\n\n';
  output += `   检查文件数: ${totalFiles}\n`;
  output += `   问题文件数: ${filesWithViolations}\n`;
  output += `   ❌ 错误 (Error): ${totalErrors}\n`;
  output += `   ⚠️  警告 (Warn): ${totalWarnings}\n\n`;
  
  // 最终结论
  if (totalErrors === 0 && totalWarnings === 0) {
    output += '🎉 所有检查项通过！UI 规范 100% 合规！\n\n';
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
  
  console.log('🔍 正在扫描 UI 规范违规...\n');
  
  // 查找所有页面文件
  const pageFiles = findPageFiles(DASHBOARD_DIR);
  console.log(`📂 发现 ${pageFiles.length} 个页面文件\n`);
  
  // 检查每个文件
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
  
  // 计算汇总
  for (const fileResult of results.files) {
    for (const violation of fileResult.violations) {
      if (violation.severity === 'error') results.summary.errors++;
      else results.summary.warnings++;
    }
  }
  
  // 输出结果
  const output = formatOutput(results, options);
  console.log(output);
  
  if (options.json) {
    const jsonPath = path.join(__dirname, 'ui-guidelines-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`📄 完整报告已保存至: ${jsonPath}\n`);
  }
  
  // 返回退出码
  if (results.summary.errors > 0) {
    process.exit(1); // 有错误，阻止提交
  } else {
    process.exit(0); // 通过
  }
}

main().catch(error => {
  console.error('❌ 检查过程中出错:', error.message);
  process.exit(2);
});
