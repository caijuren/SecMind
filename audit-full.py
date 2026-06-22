#!/usr/bin/env python3
"""SecMind 浅色主题审查 - 完整版"""
import os
import json

OUTPUT_DIR = "/tmp/secmind-qa"
os.makedirs(OUTPUT_DIR, exist_ok=True)

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

def log(msg):
    print(msg, flush=True)

def analyze_page(page, path):
    """分析页面中的暗色模式残留"""
    result = page.evaluate("""() => {
        const output = {
            dark_bg: [],
            white_on_light: [],
            dark_classes: [],
            css_vars: {},
            dark_modals: [],
            dark_dropdowns: [],
            dark_inputs: [],
            dark_cards: [],
            dark_sidebars: [],
            dark_tables: []
        };

        const parseRGB = (str) => {
            if (!str) return null;
            const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
            if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
            return null;
        };

        const brightness = (rgb) => (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

        // 获取 CSS 变量
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
            if (val) output.css_vars[v] = val;
        }

        // 遍历所有元素
        const allElements = document.querySelectorAll('*');
        const seen = new Set();

        for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            const color = style.color;
            const bgRGB = parseRGB(bg);
            const colorRGB = parseRGB(color);
            const rect = el.getBoundingClientRect();
            const tag = el.tagName.toLowerCase();
            const cls = typeof el.className === 'string' ? el.className : '';

            if (rect.width < 10 || rect.height < 10) continue;

            // 暗色背景元素 (RGB < 50)
            if (bgRGB && bgRGB.r < 50 && bgRGB.g < 50 && bgRGB.b < 50) {
                const key = tag + '|' + cls.substring(0, 50) + '|' + bg;
                if (!seen.has(key)) {
                    seen.add(key);
                    const entry = {
                        tag: tag,
                        classes: cls.substring(0, 200),
                        id: el.id || '',
                        bgColor: bg,
                        textColor: color,
                        size: Math.round(rect.width) + 'x' + Math.round(rect.height),
                        pos: Math.round(rect.x) + ',' + Math.round(rect.y)
                    };

                    // 分类
                    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                        output.dark_inputs.push(entry);
                    } else if (cls.includes('card') || cls.includes('Card')) {
                        output.dark_cards.push(entry);
                    } else if (cls.includes('sidebar') || cls.includes('Sidebar') || cls.includes('side-bar')) {
                        output.dark_sidebars.push(entry);
                    } else if (cls.includes('modal') || cls.includes('Modal') || cls.includes('dialog') || cls.includes('Dialog')) {
                        output.dark_modals.push(entry);
                    } else if (cls.includes('dropdown') || cls.includes('Dropdown') || cls.includes('popover') || cls.includes('Popover') || cls.includes('select-content')) {
                        output.dark_dropdowns.push(entry);
                    } else if (cls.includes('table') || cls.includes('Table')) {
                        output.dark_tables.push(entry);
                    } else {
                        output.dark_bg.push(entry);
                    }
                }
            }

            // 白色文字在浅色背景上
            if (bgRGB && colorRGB && brightness(bgRGB) > 200 && brightness(colorRGB) > 200) {
                const key = 'wt|' + tag + '|' + cls.substring(0, 50);
                if (!seen.has(key)) {
                    seen.add(key);
                    output.white_on_light.push({
                        tag: tag,
                        classes: cls.substring(0, 200),
                        bgColor: bg,
                        textColor: color,
                        size: Math.round(rect.width) + 'x' + Math.round(rect.height),
                        pos: Math.round(rect.x) + ',' + Math.round(rect.y)
                    });
                }
            }
        }

        // 检测 dark class 残留
        const darkEls = document.querySelectorAll('[class*="dark:"]');
        for (const el of darkEls) {
            output.dark_classes.push({
                tag: el.tagName.toLowerCase(),
                classes: (typeof el.className === 'string' ? el.className : '').substring(0, 300),
                darkClassCount: (typeof el.className === 'string' ? el.className.match(/dark:/g) : null)?.length || 0
            });
        }

        // 检查 html/body 的 class
        output.htmlClasses = document.documentElement.className;
        output.bodyClasses = document.body.className;
        output.dataTheme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || '';

        return output;
    }""");

    return result;


def main():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = context.new_page()

        # ===== 登录 =====
        log("=" * 60)
        log("步骤 1: 登录系统")
        log("=" * 60)

        page.goto("http://localhost:3000/login", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "login.png"), full_page=True)
        log("✓ 登录页截图完成")

        # 点击"免费体验"按钮
        try:
            trial_btn = page.locator("text=免费体验").first
            if trial_btn.is_visible(timeout=3000):
                log("  找到'免费体验'按钮，点击登录")
                trial_btn.click()
                page.wait_for_timeout(5000)
            else:
                raise Exception("免费体验按钮不可见")
        except Exception as e:
            log("  免费体验按钮未找到: " + str(e) + "，尝试填写表单")
            try:
                page.locator('input[name="email"]').fill("demo@secmind.io")
                page.locator('input[name="password"]').fill("demo123456")
                page.locator('button[type="submit"]:has-text("登")').click()
                page.wait_for_timeout(5000)
            except Exception as e2:
                log("  表单登录失败: " + str(e2))

        page.screenshot(path=os.path.join(OUTPUT_DIR, "after-login.png"), full_page=True)
        log("✓ 登录后截图完成, URL: " + page.url)

        # ===== 逐页审查 =====
        all_results = {}

        for page_path in PAGES:
            log("\n" + "=" * 60)
            log("审查页面: " + page_path)
            log("=" * 60)

            url = "http://localhost:3000" + page_path
            safe_name = page_path.strip("/").replace("/", "-") or "home"

            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)

                # 全页截图
                screenshot_path = os.path.join(OUTPUT_DIR, safe_name + ".png")
                page.screenshot(path=screenshot_path, full_page=True)
                log("  ✓ 截图: " + screenshot_path)

                # 视口截图
                viewport_path = os.path.join(OUTPUT_DIR, safe_name + "-viewport.png")
                page.screenshot(path=viewport_path, full_page=False)

                # 分析
                analysis = analyze_page(page, page_path)

                result = {
                    "path": page_path,
                    "url": url,
                    "screenshot": screenshot_path,
                    "analysis": analysis,
                    "page_title": page.title(),
                }
                all_results[page_path] = result

                # 打印摘要
                dark_bg = len(analysis.get("dark_bg", []))
                dark_inputs = len(analysis.get("dark_inputs", []))
                dark_cards = len(analysis.get("dark_cards", []))
                dark_sidebars = len(analysis.get("dark_sidebars", []))
                dark_modals = len(analysis.get("dark_modals", []))
                dark_dropdowns = len(analysis.get("dark_dropdowns", []))
                dark_tables = len(analysis.get("dark_tables", []))
                white_on_light = len(analysis.get("white_on_light", []))
                dark_classes = len(analysis.get("dark_classes", []))

                log("  暗色背景: " + str(dark_bg) + " | 暗色输入框: " + str(dark_inputs) + " | 暗色卡片: " + str(dark_cards))
                log("  暗色侧边栏: " + str(dark_sidebars) + " | 暗色模态框: " + str(dark_modals) + " | 暗色下拉: " + str(dark_dropdowns))
                log("  暗色表格: " + str(dark_tables) + " | 浅底白字: " + str(white_on_light) + " | dark:类: " + str(dark_classes))
                log("  HTML class: " + str(analysis.get("htmlClasses", "")))
                log("  data-theme: " + str(analysis.get("dataTheme", "")))

                # 打印关键 CSS 变量
                css_vars = analysis.get("css_vars", {})
                important_vars = ['--background', '--foreground', '--card', '--card-foreground', '--sidebar-background', '--sidebar-foreground', '--muted', '--muted-foreground', '--border', '--input']
                var_summary = {k: css_vars.get(k, 'N/A') for k in important_vars}
                log("  关键CSS变量: " + json.dumps(var_summary, ensure_ascii=False))

                # 打印暗色背景元素详情
                for elem in analysis.get("dark_bg", [])[:3]:
                    log("    ⚠ 暗色背景: <" + elem['tag'] + "> class='" + elem['classes'][:80] + "' bg=" + elem['bgColor'] + " size=" + elem['size'])
                for elem in analysis.get("dark_inputs", [])[:3]:
                    log("    ⚠ 暗色输入框: <" + elem['tag'] + "> class='" + elem['classes'][:80] + "' bg=" + elem['bgColor'])
                for elem in analysis.get("dark_cards", [])[:3]:
                    log("    ⚠ 暗色卡片: <" + elem['tag'] + "> class='" + elem['classes'][:80] + "' bg=" + elem['bgColor'])
                for elem in analysis.get("dark_sidebars", [])[:3]:
                    log("    ⚠ 暗色侧边栏: <" + elem['tag'] + "> class='" + elem['classes'][:80] + "' bg=" + elem['bgColor'])
                for elem in analysis.get("white_on_light", [])[:3]:
                    log("    ⚠ 浅底白字: <" + elem['tag'] + "> class='" + elem['classes'][:80] + "' bg=" + elem['bgColor'] + " text=" + elem['textColor'])

            except Exception as e:
                log("  ✗ 页面访问失败: " + str(e))
                all_results[page_path] = {"path": page_path, "error": str(e)}

        # 保存结果
        results_path = os.path.join(OUTPUT_DIR, "analysis-results.json")
        with open(results_path, "w", encoding="utf-8") as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2, default=str)
        log("\n✓ 完整分析结果已保存: " + results_path)

        browser.close()

    log("\n" + "=" * 60)
    log("审查完成！")
    log("=" * 60)

if __name__ == "__main__":
    main()
