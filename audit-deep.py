#!/usr/bin/env python3
"""SecMind 浅色主题审查 - 深度分析版（排除透明背景，聚焦真实暗色残留）"""
import os
import json

OUTPUT_DIR = "/tmp/secmind-qa"

from playwright.sync_api import sync_playwright

def log(msg):
    print(msg, flush=True)

def deep_analyze(page, path):
    """深度分析页面暗色残留，排除透明背景"""
    return page.evaluate("""() => {
        const output = {
            real_dark_elements: [],
            sidebar_analysis: {},
            login_page_issues: [],
            dark_class_usage: [],
            css_var_issues: [],
            color_contrast_issues: [],
            specific_component_issues: []
        };

        const parseRGB = (str) => {
            if (!str) return null;
            const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
            if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: 1 };
            return null;
        };

        const parseRGBA = (str) => {
            if (!str) return null;
            const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+),?\\s*([\\d.]*)\\)/);
            if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: m[4] ? parseFloat(m[4]) : 1 };
            return null;
        };

        const brightness = (rgb) => (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        const isDark = (rgb) => rgb && rgb.a > 0.1 && brightness(rgb) < 80;
        const isLight = (rgb) => rgb && rgb.a > 0.1 && brightness(rgb) > 200;
        const isTransparent = (rgb) => !rgb || rgb.a < 0.05;

        // 1. 分析侧边栏
        const sidebar = document.querySelector('[data-sidebar], [class*="sidebar"], aside, nav[class*="sidebar"]');
        if (sidebar) {
            const sidebarStyle = window.getComputedStyle(sidebar);
            const sidebarBg = parseRGBA(sidebarStyle.backgroundColor);
            output.sidebar_analysis = {
                found: true,
                tag: sidebar.tagName,
                classes: (typeof sidebar.className === 'string' ? sidebar.className : '').substring(0, 300),
                bgColor: sidebarStyle.backgroundColor,
                isDark: isDark(sidebarBg),
                isLight: isLight(sidebarBg),
                textColor: sidebarStyle.color,
                width: sidebar.getBoundingClientRect().width
            };
        }

        // 2. 检查所有有实际暗色背景的元素（排除透明）
        const allElements = document.querySelectorAll('*');
        const seen = new Set();

        for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const bgRGBA = parseRGBA(style.backgroundColor);
            const rect = el.getBoundingClientRect();

            if (rect.width < 15 || rect.height < 15) continue;

            // 跳过透明背景
            if (isTransparent(bgRGBA)) continue;

            // 真实暗色背景
            if (isDark(bgRGBA)) {
                const tag = el.tagName.toLowerCase();
                const cls = typeof el.className === 'string' ? el.className : '';
                const key = tag + '|' + cls.substring(0, 50) + '|' + style.backgroundColor;
                if (!seen.has(key) && seen.size < 80) {
                    seen.add(key);
                    output.real_dark_elements.push({
                        tag: tag,
                        classes: cls.substring(0, 250),
                        id: el.id || '',
                        bgColor: style.backgroundColor,
                        textColor: style.color,
                        size: Math.round(rect.width) + 'x' + Math.round(rect.height),
                        pos: Math.round(rect.x) + ',' + Math.round(rect.y),
                        role: el.getAttribute('role') || '',
                        ariaLabel: el.getAttribute('aria-label') || ''
                    });
                }
            }

            // 颜色对比度问题：浅色背景上的浅色文字
            const colorRGBA = parseRGBA(style.color);
            if (bgRGBA && colorRGBA && bgRGBA.a > 0.1 && colorRGBA.a > 0.1) {
                const bgB = brightness(bgRGBA);
                const txtB = brightness(colorRGBA);
                if (bgB > 200 && txtB > 180) {
                    const tag = el.tagName.toLowerCase();
                    const cls = typeof el.className === 'string' ? el.className : '';
                    const key = 'cc|' + tag + '|' + cls.substring(0, 50);
                    if (!seen.has(key) && seen.size < 100) {
                        seen.add(key);
                        output.color_contrast_issues.push({
                            tag: tag,
                            classes: cls.substring(0, 200),
                            bgColor: style.backgroundColor,
                            textColor: style.color,
                            text: el.textContent.trim().substring(0, 50),
                            size: Math.round(rect.width) + 'x' + Math.round(rect.height)
                        });
                    }
                }
            }
        }

        // 3. 检查 dark: class 使用（Tailwind 暗色模式类）
        const darkClassEls = document.querySelectorAll('[class*="dark:"]');
        const darkClassSummary = {};
        for (const el of darkClassEls) {
            const cls = typeof el.className === 'string' ? el.className : '';
            const darkMatches = cls.match(/dark:[a-zA-Z0-9-]+/g) || [];
            for (const m of darkMatches) {
                darkClassSummary[m] = (darkClassSummary[m] || 0) + 1;
            }
        }
        output.dark_class_usage = Object.entries(darkClassSummary)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([k, v]) => k + ': ' + v);

        // 4. 检查 CSS 变量中的暗色值
        const rootStyle = window.getComputedStyle(document.documentElement);
        const varNames = [
            '--background', '--foreground', '--card', '--card-foreground',
            '--popover', '--popover-foreground', '--primary', '--primary-foreground',
            '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
            '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
            '--border', '--input', '--ring', '--sidebar-background',
            '--sidebar-foreground', '--sidebar-primary', '--sidebar-primary-foreground',
            '--sidebar-accent', '--sidebar-accent-foreground', '--sidebar-border',
            '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'
        ];
        for (const v of varNames) {
            const val = rootStyle.getPropertyValue(v).trim();
            if (val) {
                const rgb = parseRGBA(val);
                if (rgb && isDark(rgb)) {
                    output.css_var_issues.push({ variable: v, value: val, issue: '暗色值在浅色主题中' });
                }
            }
        }

        // 5. 特定组件问题检测
        // 检查输入框
        const inputs = document.querySelectorAll('input, textarea, select');
        for (const inp of inputs) {
            const style = window.getComputedStyle(inp);
            const bg = parseRGBA(style.backgroundColor);
            if (bg && isDark(bg)) {
                output.specific_component_issues.push({
                    type: 'dark_input',
                    tag: inp.tagName.toLowerCase(),
                    classes: (typeof inp.className === 'string' ? inp.className : '').substring(0, 200),
                    bgColor: style.backgroundColor,
                    placeholder: inp.placeholder || ''
                });
            }
        }

        // 检查按钮
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            const style = window.getComputedStyle(btn);
            const bg = parseRGBA(style.backgroundColor);
            const color = parseRGBA(style.color);
            if (bg && isDark(bg) && !style.backgroundColor.includes('gradient')) {
                output.specific_component_issues.push({
                    type: 'dark_button',
                    text: btn.textContent.trim().substring(0, 50),
                    classes: (typeof btn.className === 'string' ? btn.className : '').substring(0, 200),
                    bgColor: style.backgroundColor,
                    textColor: style.color
                });
            }
        }

        // 检查表格
        const tables = document.querySelectorAll('table, [role="table"]');
        for (const table of tables) {
            const style = window.getComputedStyle(table);
            const bg = parseRGBA(style.backgroundColor);
            if (bg && isDark(bg)) {
                output.specific_component_issues.push({
                    type: 'dark_table',
                    classes: (typeof table.className === 'string' ? table.className : '').substring(0, 200),
                    bgColor: style.backgroundColor
                });
            }
            // 检查表头
            const headers = table.querySelectorAll('th, [role="columnheader"]');
            for (const h of headers) {
                const hStyle = window.getComputedStyle(h);
                const hBg = parseRGBA(hStyle.backgroundColor);
                if (hBg && isDark(hBg)) {
                    output.specific_component_issues.push({
                        type: 'dark_table_header',
                        text: h.textContent.trim().substring(0, 30),
                        bgColor: hStyle.backgroundColor,
                        textColor: hStyle.color
                    });
                }
            }
        }

        // 检查卡片
        const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
        for (const card of cards) {
            const style = window.getComputedStyle(card);
            const bg = parseRGBA(style.backgroundColor);
            if (bg && isDark(bg)) {
                output.specific_component_issues.push({
                    type: 'dark_card',
                    classes: (typeof card.className === 'string' ? card.className : '').substring(0, 200),
                    bgColor: style.backgroundColor,
                    size: Math.round(card.getBoundingClientRect().width) + 'x' + Math.round(card.getBoundingClientRect().height)
                });
            }
        }

        // 检查下拉菜单/弹出框
        const dropdowns = document.querySelectorAll('[role="listbox"], [role="menu"], [role="dialog"], [data-radix-popper-content-wrapper]');
        for (const dd of dropdowns) {
            const style = window.getComputedStyle(dd);
            const bg = parseRGBA(style.backgroundColor);
            if (bg && isDark(bg)) {
                output.specific_component_issues.push({
                    type: 'dark_dropdown',
                    role: dd.getAttribute('role') || '',
                    classes: (typeof dd.className === 'string' ? dd.className : '').substring(0, 200),
                    bgColor: style.backgroundColor
                });
            }
        }

        // 检查 body 背景
        const bodyStyle = window.getComputedStyle(document.body);
        output.bodyBg = bodyStyle.backgroundColor;
        output.htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;

        // 检查是否缺少 data-theme 或 class="light"
        output.htmlClasses = document.documentElement.className;
        output.bodyClasses = document.body.className;
        output.dataTheme = document.documentElement.getAttribute('data-theme') || '';
        output.colorScheme = rootStyle.getPropertyValue('color-scheme').trim();

        return output;
    }""")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = context.new_page()

        # 登录
        log("登录中...")
        page.goto("http://localhost:3000/login", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)

        # 先分析登录页
        login_analysis = deep_analyze(page, "/login")
        log("=== 登录页分析 ===")
        log("真实暗色元素: " + str(len(login_analysis.get("real_dark_elements", []))))
        for elem in login_analysis.get("real_dark_elements", [])[:10]:
            log("  <" + elem['tag'] + "> class='" + elem['classes'][:100] + "' bg=" + elem['bgColor'] + " text=" + elem['textColor'] + " size=" + elem['size'])
        log("暗色组件: " + str(len(login_analysis.get("specific_component_issues", []))))
        for issue in login_analysis.get("specific_component_issues", [])[:10]:
            log("  " + issue['type'] + ": " + str(issue))
        log("dark:类使用: " + str(login_analysis.get("dark_class_usage", [])[:10]))
        log("CSS变量问题: " + str(login_analysis.get("css_var_issues", [])))
        log("body背景: " + str(login_analysis.get("bodyBg", "")))
        log("html背景: " + str(login_analysis.get("htmlBg", "")))
        log("color-scheme: " + str(login_analysis.get("colorScheme", "")))

        # 点击免费体验
        try:
            trial_btn = page.locator("text=免费体验").first
            if trial_btn.is_visible(timeout=3000):
                trial_btn.click()
                page.wait_for_timeout(5000)
                log("登录成功, URL: " + page.url)
        except Exception as e:
            log("登录失败: " + str(e))

        # 逐页深度分析
        PAGES = [
            "/dashboard",
            "/signals",
            "/investigate",
            "/ai-analysis",
            "/ai-chat",
            "/knowledge",
            "/learning",
            "/hunting",
            "/assets",
            "/users",
            "/system",
            "/system/billing",
            "/system/rbac",
            "/notifications",
        ]

        all_deep_results = {}

        for page_path in PAGES:
            log("\n" + "=" * 60)
            log("深度分析: " + page_path)
            log("=" * 60)

            url = "http://localhost:3000" + page_path
            safe_name = page_path.strip("/").replace("/", "-") or "home"

            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)

                # 尝试截图
                try:
                    page.screenshot(path=os.path.join(OUTPUT_DIR, safe_name + "-deep.png"), full_page=False, timeout=15000)
                except:
                    page.screenshot(path=os.path.join(OUTPUT_DIR, safe_name + "-deep.png"), full_page=False, timeout=30000)

                analysis = deep_analyze(page, page_path)
                all_deep_results[page_path] = analysis

                real_dark = len(analysis.get("real_dark_elements", []))
                dark_components = len(analysis.get("specific_component_issues", []))
                contrast_issues = len(analysis.get("color_contrast_issues", []))
                dark_classes = analysis.get("dark_class_usage", [])
                css_var_issues = analysis.get("css_var_issues", [])

                log("  真实暗色元素: " + str(real_dark))
                log("  暗色组件: " + str(dark_components))
                log("  对比度问题: " + str(contrast_issues))
                log("  CSS变量问题: " + str(len(css_var_issues)))
                log("  dark:类 top10: " + str(dark_classes[:10]))

                # 打印真实暗色元素
                for elem in analysis.get("real_dark_elements", [])[:8]:
                    log("    ⚠ 暗色: <" + elem['tag'] + "> bg=" + elem['bgColor'] + " text=" + elem['textColor'] + " cls='" + elem['classes'][:80] + "' size=" + elem['size'] + " pos=" + elem['pos'])

                # 打印暗色组件
                for issue in analysis.get("specific_component_issues", [])[:8]:
                    log("    ⚠ 组件: " + issue['type'] + " " + json.dumps(issue, ensure_ascii=False)[:200])

                # 打印对比度问题
                for issue in analysis.get("color_contrast_issues", [])[:5]:
                    log("    ⚠ 对比度: <" + issue['tag'] + "> bg=" + issue['bgColor'] + " text=" + issue['textColor'] + " '" + issue.get('text', '')[:30] + "'")

                # 打印CSS变量问题
                for issue in css_var_issues:
                    log("    ⚠ CSS变量: " + issue['variable'] + " = " + issue['value'] + " (" + issue['issue'] + ")")

                # 侧边栏分析
                sidebar = analysis.get("sidebar_analysis", {})
                if sidebar.get("found"):
                    log("  侧边栏: bg=" + str(sidebar.get("bgColor", "")) + " isDark=" + str(sidebar.get("isDark", "")) + " isLight=" + str(sidebar.get("isLight", "")))

            except Exception as e:
                log("  ✗ 失败: " + str(e))
                all_deep_results[page_path] = {"error": str(e)}

        # 保存深度分析结果
        results_path = os.path.join(OUTPUT_DIR, "deep-analysis-results.json")
        with open(results_path, "w", encoding="utf-8") as f:
            json.dump(all_deep_results, f, ensure_ascii=False, indent=2, default=str)
        log("\n✓ 深度分析结果已保存: " + results_path)

        # 也保存登录页分析
        login_path = os.path.join(OUTPUT_DIR, "login-analysis.json")
        with open(login_path, "w", encoding="utf-8") as f:
            json.dump(login_analysis, f, ensure_ascii=False, indent=2, default=str)

        browser.close()

if __name__ == "__main__":
    main()
