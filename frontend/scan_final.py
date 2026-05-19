"""
SecMind Final Deep Scan v2 - Focus on confirmed issues.
"""
import json
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
NAV_TIMEOUT = 30000


def safe_goto(page, url):
    try:
        response = page.goto(url, timeout=NAV_TIMEOUT, wait_until="domcontentloaded")
        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except:
            pass
        time.sleep(1.5)
        return response
    except Exception as e:
        return e


def main():
    print("=" * 60)
    print("SecMind Final Issue Scan")
    print("=" * 60)

    issues = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append({"type": msg.type, "text": msg.text[:300], "url": page.url}) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append({"type": "pageerror", "text": str(err)[:300], "url": page.url}))

        # ====== ISSUE 1: Marketing Nav click behavior ======
        print("\n--- [ISSUE 1] Marketing Nav Click Behavior ---")
        safe_goto(page, BASE_URL + "/")

        for item_name, expected_path in [("解决方案", "/solutions"), ("文档", "/docs"), ("定价", "/pricing")]:
            link = page.locator(f"nav a:has-text('{item_name}')").first
            if link.count() > 0:
                href = link.get_attribute("href")
                before_url = page.url
                link.click()
                time.sleep(2)
                after_url = page.url
                
                is_correct = expected_path in after_url
                status = "OK" if is_correct else f"BUG: expected {expected_path}, got {after_url}"
                
                if not is_correct:
                    issues.append({
                        "id": "MARKET-001",
                        "severity": "HIGH",
                        "category": "Navigation",
                        "title": f"营销导航 '{item_name}' 点击后跳转到错误页面",
                        "detail": f"点击 href={href} 的链接，期望跳转 {expected_path}，实际停留在 {after_url}",
                        "before_click": before_url,
                        "after_click": after_url,
                    })
                    print(f"  BUG: '{item_name}' href={href}, before={before_url}, after={after_url}")
                else:
                    print(f"  OK: '{item_name}' -> {after_url}")

        # ====== ISSUE 2: Sidebar rendering ======
        print("\n--- [ISSUE 2] Dashboard Sidebar Rendering ---")
        safe_goto(page, BASE_URL + "/dashboard")

        aside = page.locator("aside").first
        aside_html = ""
        try:
            aside_html = aside.inner_html()[:2000]
        except:
            pass
        
        # Check for specific nav item text in aside
        expected_items = ["运营看板", "告警事件", "智能研判", "AI处置中心", "知识库", "威胁狩猎"]
        missing_in_sidebar = []
        for item in expected_items:
            # Try multiple selectors
            found_as_link = page.locator(f"aside a:has-text('{item}')").count() > 0
            found_as_button = page.locator(f"aside button:has-text('{item}')").count() > 0
            found_as_text = page.locator(f"aside :text-is('{item}')").count() > 0
            
            if not (found_as_link or found_as_button or found_as_text):
                missing_in_sidebar.append(item)
        
        if missing_in_sidebar:
            issues.append({
                "id": "DASH-001",
                "severity": "HIGH",
                "category": "Sidebar",
                "title": "Dashboard 侧边栏导航项未渲染",
                "detail": f"以下菜单项在侧边栏中未找到: {', '.join(missing_in_sidebar)}。侧边栏仅显示 '系统设置' 按钮和折叠按钮，其他所有导航项缺失。",
                "missing_items": missing_in_sidebar,
                "aside_html_preview": aside_html[:500],
            })
            print(f"  BUG: Sidebar missing items: {missing_in_sidebar}")
        else:
            print(f"  OK: All sidebar items present")

        # ====== ISSUE 3: Dashboard page content check ======
        print("\n--- [ISSUE 3] Dashboard Page Content ---")
        dashboard_pages = [
            ("/dashboard", "运营看板"),
            ("/signals", "告警事件"),
            ("/investigate", "智能研判"),
            ("/response", "AI处置中心"),
            ("/ai-analysis", "AI工作台"),
            ("/ai-chat", "AI会话助手"),
            ("/knowledge", "知识库"),
            ("/learning", "学习中心"),
            ("/hunting", "威胁狩猎"),
            ("/workflows", "工作流"),
            ("/cases", "案件管理"),
            ("/notifications", "通知"),
            ("/datasource", "数据源"),
            ("/assets", "资产管理"),
            ("/users", "用户管理"),
            ("/system/rbac", "权限管理"),
            ("/system/tenants", "租户管理"),
            ("/system/billing", "账单订阅"),
            ("/system/compliance", "合规管理"),
            ("/integrations", "集成管理"),
            ("/reports", "报告"),
            ("/audit", "审计日志"),
            ("/system", "系统设置"),
        ]
        
        blank_or_minimal_pages = []
        for path, name in dashboard_pages:
            resp = safe_goto(page, BASE_URL + path)
            if isinstance(resp, Exception):
                blank_or_minimal_pages.append((name, path, "navigation_failed", str(resp)[:100]))
                continue
            
            try:
                body_text = page.inner_text("body").strip()
                body_len = len(body_text)
            except:
                body_len = 0
            
            if body_len < 100:
                blank_or_minimal_pages.append((name, path, f"blank_{body_len}", body_text[:80]))
            
            status = "OK" if body_len >= 100 else f"MINIMAL({body_len})"
            print(f"  {status}: {name} ({path}) - {body_len} chars")
        
        if blank_or_minimal_pages:
            issues.append({
                "id": "DASH-002",
                "severity": "MEDIUM",
                "category": "Page Content",
                "title": "多个 Dashboard 页面内容过少或为空",
                "detail": f"{len(blank_or_minimal_pages)} 个页面正文内容不足 100 字符，可能因未登录导致页面空白或渲染异常。",
                "pages": [{"name": n, "path": p, "reason": r, "preview": preview} for n, p, r, preview in blank_or_minimal_pages],
            })

        # ====== ISSUE 4: Login/Register form interaction ======
        print("\n--- [ISSUE 4] Login Form Interaction ---")
        safe_goto(page, BASE_URL + "/login")
        
        # Check login form fields
        email_input = page.locator("input[type='email'], input[name='email'], input[placeholder*='邮箱']").first
        password_input = page.locator("input[type='password'], input[name='password']").first
        submit_btn = page.locator("button[type='submit']").first
        
        login_form_ok = email_input.count() > 0 and password_input.count() > 0 and submit_btn.count() > 0
        print(f"  Login form: email={email_input.count()>0}, pwd={password_input.count()>0}, submit={submit_btn.count()>0}")
        
        if not login_form_ok:
            issues.append({
                "id": "AUTH-001",
                "severity": "MEDIUM",
                "category": "Auth Forms",
                "title": "登录页面表单元素可能不完整",
                "detail": f"email={email_input.count()}, password={password_input.count()}, submit={submit_btn.count()}",
            })

        # Test empty form submission
        if submit_btn.count() > 0:
            try:
                submit_btn.click()
                time.sleep(1)
                # Check for validation messages
                validation_msg = page.locator("[role='alert'], .error-message, [data-invalid]").count()
                print(f"  Empty submit: validation msgs shown={validation_msg}")
            except Exception as e:
                print(f"  Empty submit failed: {e}")

        # Register page
        safe_goto(page, BASE_URL + "/register")
        reg_submit = page.locator("button[type='submit']").first
        reg_fields = page.locator("input").all()
        print(f"  Register form: {len(reg_fields)} inputs, submit={reg_submit.count()>0}")

        # ====== ISSUE 5: Footer link click test ======
        print("\n--- [ISSUE 5] Footer Link Click Test ---")
        safe_goto(page, BASE_URL + "/")
        
        footer_tests = [
            ("隐私政策", "/privacy"),
            ("服务条款", "/terms"),
            ("Cookie设置", "/cookies"),
            ("联系我们", "mailto:"),
        ]
        
        for text, expected_contains in footer_tests:
            flink = page.locator(f"footer a:has-text('{text}')").first
            if flink.count() > 0:
                href = flink.get_attribute("href") or ""
                try:
                    flink.click()
                    time.sleep(1)
                    actual = page.url
                    match = expected_contains in actual or expected_contains in href
                    if not match:
                        issues.append({
                            "id": "FOOTER-001",
                            "severity": "LOW",
                            "category": "Footer",
                            "title": f"页脚链接 '{text}' 跳转异常",
                            "detail": f"expected contains {expected_contains}, got url={actual}, href={href}",
                        })
                        print(f"  BUG: Footer '{text}' href={href} -> {actual}")
                    else:
                        print(f"  OK: Footer '{text}' -> {actual}")
                except Exception as e:
                    print(f"  ERR: Footer '{text}' click failed: {e}")
            else:
                print(f"  MISSING: Footer '{text}' not found")

        # ====== ISSUE 6: System settings submenu interaction ======
        print("\n--- [ISSUE 6] System Settings Submenu ---")
        safe_goto(page, BASE_URL + "/dashboard")
        
        settings_btn = page.locator("aside button:has-text('系统设置')").first
        if settings_btn.count() > 0:
            settings_btn.click()
            time.sleep(1)
            
            # After expanding, look for submenu items
            sub_items_to_check = [
                ("权限管理", "/system/rbac"),
                ("租户管理", "/system/tenants"),
                ("账单订阅", "/system/billing"),
                ("合规管理", "/system/compliance"),
            ]
            
            for label, expected_path in sub_items_to_check:
                sublink = page.locator(f"a[href='{expected_path}']").first
                if sublink.count() > 0:
                    sublink.click()
                    time.sleep(1)
                    actual = page.url
                    if expected_path in actual:
                        print(f"  OK: Submenu '{label}' -> {actual}")
                    else:
                        issues.append({
                            "id": "SETTINGS-001",
                            "severity": "MEDIUM",
                            "category": "Settings Menu",
                            "title": f"系统设置子菜单 '{label}' 跳转异常",
                            "detail": f"Expected {expected_path}, got {actual}",
                        })
                        print(f"  BUG: Submenu '{label}' -> {actual}")
                    
                    # Re-expand
                    safe_goto(page, BASE_URL + "/dashboard")
                    settings_btn = page.locator("aside button:has-text('系统设置')").first
                    if settings_btn.count() > 0:
                        settings_btn.click()
                        time.sleep(0.5)
                else:
                    print(f"  MISSING: Submenu '{label}' not found after expand")

        # Collect console errors
        seen = set()
        unique_errors = []
        for err in console_errors:
            key = (err["type"], err["text"][:150])
            if key not in seen:
                seen.add(key)
                unique_errors.append(err)

        browser.close()

    # ====== FINAL REPORT ======
    print("\n" + "=" * 60)
    print("SECMIND FINAL SCAN REPORT")
    print("=" * 60)

    print(f"\nTotal Issues Found: {len(issues)}")
    
    severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for iss in issues:
        severity_counts[iss["severity"]] += 1
    
    print(f"  HIGH:   {severity_counts['HIGH']}")
    print(f"  MEDIUM: {severity_counts['MEDIUM']}")
    print(f"  LOW:    {severity_counts['LOW']}")
    
    if issues:
        print("\n" + "-" * 60)
        print("DETAILED ISSUES:")
        print("-" * 60)
        for i, iss in enumerate(issues, 1):
            print(f"\n[{i}] [{iss['severity']}] {iss['id']}: {iss['title']}")
            print(f"    Category: {iss['category']}")
            print(f"    Detail: {iss.get('detail', '')}")

    if unique_errors:
        print("\n" + "-" * 60)
        print("CONSOLE ERRORS:")
        print("-" * 60)
        for ce in unique_errors[:15]:
            print(f"  [{ce['type']}] {ce['text']}")

    report = {
        "summary": {
            "total_issues": len(issues),
            "by_severity": severity_counts,
            "total_console_errors": len(unique_errors),
        },
        "issues": issues,
        "console_errors": unique_errors,
    }
    
    with open("scan_final_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\nFinal report saved to scan_final_report.json")


if __name__ == "__main__":
    main()