#!/usr/bin/env python3
"""SecMind 浅色主题审查脚本 - 逐页截图并检测暗色模式残留"""

import os
import json
import time
from playwright.sync_api import sync_playwright

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

def analyze_dark_remnants(page, path):
    """分析页面中的暗色模式残留元素"""
    issues = []

    # 1. 检测暗色背景元素
    dark_bg_elements = page.evaluate("""() => {
        const issues = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            const color = style.color;
            const borderColor = style.borderColor;

            const parseRGB = (str) => {
                const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
                if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
                return null;
            };

            const bgRGB = parseRGB(bg);
            const colorRGB = parseRGB(color);
            const borderRGB = parseRGB(borderColor);

            // 检测暗色背景 (RGB 值都低于 60)
            if (bgRGB && bgRGB.r < 50 && bgRGB.g < 50 && bgRGB.b < 50) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 20 && rect.height > 20) {
                    const tag = el.tagName.toLowerCase();
                    const cls = el.className ? (typeof el.className === 'string' ? el.className : '') : '';
                    const id = el.id || '';
                    issues.push({
                        type: 'dark_background',
                        tag: tag,
                        classes: cls.substring(0, 200),
                        id: id,
                        bgColor: bg,
                        textColor: color,
                        size: Math.round(rect.width) + 'x' + Math.round(rect.height),
                        position: Math.round(rect.x) + ',' + Math.round(rect.y)
                    });
                }
            }

            // 检测白色文字在浅色背景上
            if (bgRGB && colorRGB) {
                const bgBrightness = (bgRGB.r * 299 + bgRGB.g * 587 + bgRGB.b * 114) / 1000;
                const colorBrightness = (colorRGB.r * 299 + colorRGB.g * 587 + colorRGB.b * 114) / 1000;
                if (bgBrightness > 200 && colorBrightness > 200) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 20 && rect.height > 10) {
                        const tag = el.tagName.toLowerCase();
                        const cls = el.className ? (typeof el.className === 'string' ? el.className : '') : '';
                        issues.push({
                            type: 'white_text_on_light_bg',
                            tag: tag,
                            classes: cls.substring(0, 200),
                            bgColor: bg,
                            textColor: color,
                            size: Math.round(rect.width) + 'x' + Math.round(rect.height),
                            position: Math.round(rect.x) + ',' + Math.round(rect.y)
                        });
                    }
                }
            }
        }
        return issues;
    }""")

    # 2. 检测暗色主题 CSS 变量
    dark_vars = page.evaluate("""() => {
        const root = document.documentElement;
        const style = window.getComputedStyle(root);
        const darkVars = [];
        const cssVars = [
            '--background', '--foreground', '--card', '--card-foreground',
            '--popover', '--popover-foreground', '--primary', '--primary-foreground',
            '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
            '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
            '--border', '--input', '--ring', '--sidebar-background',
            '--sidebar-foreground', '--sidebar-primary', '--sidebar-primary-foreground',
            '--sidebar-accent', '--sidebar-accent-foreground', '--sidebar-border',
            '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'
        ];
        for (const v of cssVars) {
            const val = style.getPropertyValue(v).trim();
            if (val) {
                darkVars.push({ variable: v, value: val });
            }
        }
        return darkVars;
    }""")

    # 3. 检测暗色 class 残留
    dark_classes = page.evaluate("""() => {
        const darkClassElements = [];
        const allElements = document.querySelectorAll('[class*="dark"], [class*="Dark"], [data-theme="dark"]');
        for (const el of allElements) {
            const rect = el.getBoundingClientRect();
            darkClassElements.push({
                tag: el.tagName.toLowerCase(),
                classes: (typeof el.className === 'string' ? el.className : '').substring(0, 300),
                dataTheme: el.getAttribute('data-theme') || '',
                size: Math.round(rect.width) + 'x' + Math.round(rect.height)
            });
        }
        return darkClassElements;
    }""")

    # 4. 检测 SVG/Canvas 图表暗色残留
    chart_issues = page.evaluate("""() => {
        const issues = [];
        const canvases = document.querySelectorAll('canvas');
        for (const c of canvases) {
            const rect = c.getBoundingClientRect();
            if (rect.width > 50 && rect.height > 50) {
                try {
                    const ctx = c.getContext('2d');
                    const imageData = ctx.getImageData(0, 0, Math.min(c.width, 100), Math.min(c.height, 100));
                    const data = imageData.data;
                    let darkPixels = 0;
                    let totalPixels = 0;
                    for (let i = 0; i < data.length; i += 16) {
                        totalPixels++;
                        if (data[i] < 50 && data[i+1] < 50 && data[i+2] < 50) {
                            darkPixels++;
                        }
                    }
                    if (totalPixels > 0 && darkPixels / totalPixels > 0.3) {
                        issues.push({
                            type: 'dark_canvas',
                            size: Math.round(rect.width) + 'x' + Math.round(rect.height),
                            darkRatio: Math.round(darkPixels / totalPixels * 100) + '%'
                        });
                    }
                } catch(e) {}
            }
        }
        return issues;
    }""")

    return {
        "dark_bg_elements": dark_bg_elements[:50],
        "dark_css_vars": dark_vars,
        "dark_classes": dark_classes[:30],
        "chart_issues": chart_issues,
    }


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = context.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append("[" + msg.type + "] " + msg.text))

        # ===== 登录 =====
        print("=" * 60)
        print("步骤 1: 登录系统")
        print("=" * 60)

        page.goto("http://localhost:3000/login", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "login.png"), full_page=True)
        print("✓ 登录页截图完成")

        # 查找并点击 demo 登录按钮
        try:
            demo_btn = None
            selectors_to_try = [
                "text=Demo",
                "text=demo",
                "text=演示",
                "text=体验",
                "text=访客",
                "text=Guest",
                "button:has-text('Demo')",
                "button:has-text('demo')",
                "[data-testid='demo-login']",
                "text=快速体验",
                "text=免密登录",
            ]
            for sel in selectors_to_try:
                try:
                    demo_btn = page.locator(sel).first
                    if demo_btn.is_visible(timeout=2000):
                        print("  找到 Demo 按钮: " + sel)
                        break
                except:
                    continue

            if demo_btn:
                demo_btn.click()
            else:
                print("  未找到 Demo 按钮，尝试填写登录表单...")
                email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="email"]').first
                pwd_input = page.locator('input[type="password"]').first
                if email_input.is_visible(timeout=3000):
                    email_input.fill("demo@secmind.io")
                    pwd_input.fill("demo123456")
                    page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first.click()
                else:
                    print("  无法找到登录表单，尝试直接访问...")
        except Exception as e:
            print("  登录过程出错: " + str(e))

        page.wait_for_timeout(5000)
        page.screenshot(path=os.path.join(OUTPUT_DIR, "after-login.png"), full_page=True)
        print("✓ 登录后截图完成")
        print("  当前 URL: " + page.url)

        # ===== 逐页审查 =====
        all_results = {}

        for page_path in PAGES:
            print("\n" + "=" * 60)
            print("审查页面: " + page_path)
            print("=" * 60)

            url = "http://localhost:3000" + page_path
            safe_name = page_path.strip("/").replace("/", "-") or "home"

            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)

                screenshot_path = os.path.join(OUTPUT_DIR, safe_name + ".png")
                page.screenshot(path=screenshot_path, full_page=True)
                print("  ✓ 截图完成: " + screenshot_path)

                viewport_path = os.path.join(OUTPUT_DIR, safe_name + "-viewport.png")
                page.screenshot(path=viewport_path, full_page=False)
                print("  ✓ 视口截图完成: " + viewport_path)

                analysis = analyze_dark_remnants(page, page_path)

                page_console = [log for log in console_logs if "error" in log.lower() or "warn" in log.lower()]
                console_logs.clear()

                result = {
                    "path": page_path,
                    "url": url,
                    "screenshot": screenshot_path,
                    "viewport_screenshot": viewport_path,
                    "analysis": analysis,
                    "console_errors": page_console[:20],
                    "page_title": page.title(),
                }

                all_results[page_path] = result

                dark_bg_count = len(analysis["dark_bg_elements"])
                dark_class_count = len(analysis["dark_classes"])
                chart_issue_count = len(analysis["chart_issues"])
                print("  暗色背景元素: " + str(dark_bg_count))
                print("  暗色 class 残留: " + str(dark_class_count))
                print("  图表暗色问题: " + str(chart_issue_count))

                if dark_bg_count > 0:
                    print("  ⚠ 暗色背景元素详情:")
                    for elem in analysis["dark_bg_elements"][:5]:
                        print("    - <" + elem['tag'] + "> class='" + elem['classes'][:80] + "' bg=" + elem['bgColor'] + " text=" + elem['textColor'] + " size=" + elem['size'])

                if dark_class_count > 0:
                    print("  ⚠ 暗色 class 残留详情:")
                    for elem in analysis["dark_classes"][:5]:
                        print("    - <" + elem['tag'] + "> class='" + elem['classes'][:80] + "'")

            except Exception as e:
                print("  ✗ 页面访问失败: " + str(e))
                all_results[page_path] = {
                    "path": page_path,
                    "url": url,
                    "error": str(e),
                }

        # 保存完整分析结果
        results_path = os.path.join(OUTPUT_DIR, "analysis-results.json")
        with open(results_path, "w", encoding="utf-8") as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2, default=str)
        print("\n✓ 完整分析结果已保存: " + results_path)

        browser.close()

    return all_results


if __name__ == "__main__":
    results = main()
    print("\n" + "=" * 60)
    print("审查完成！")
    print("=" * 60)
