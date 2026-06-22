from playwright.sync_api import sync_playwright
import os

SCREENSHOTS_DIR = "/Users/grubby/Desktop/SecMind/dogfood-output/screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})

    # ===== 1. Landing Page =====
    page = context.new_page()
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=15000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/landing-full.png", full_page=True)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/landing-top.png")
    print("✓ Landing page captured")

    # Check console errors
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

    # ===== 2. Login Page =====
    page.goto("http://localhost:3000/login", wait_until="networkidle", timeout=15000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/login.png", full_page=True)
    print("✓ Login page captured")

    # ===== 3. Login and enter dashboard =====
    page.fill('input[placeholder="请输入邮箱地址"]', "admin@secmind.com")
    page.fill('input[placeholder="请输入密码"]', "admin123")
    page.click('button:has-text("登 录")')
    page.wait_for_load_state("networkidle", timeout=10000)
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{SCREENSHOTS_DIR}/after-login.png")
    print(f"✓ After login: {page.url}")

    # Close onboarding if present
    try:
        close_btn = page.locator('button:has-text("关闭引导")')
        if close_btn.is_visible(timeout=2000):
            close_btn.click()
            page.wait_for_timeout(500)
    except:
        pass

    # ===== 4. Dashboard =====
    try:
        page.goto("http://localhost:3000/dashboard", timeout=15000)
        page.wait_for_timeout(5000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/dashboard.png", timeout=60000)
        print("✓ Dashboard captured")
    except Exception as e:
        print(f"⚠ Dashboard screenshot failed: {e}")

    # ===== 5. Signals =====
    try:
        page.goto("http://localhost:3000/signals", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/signals.png", timeout=60000)
        print("✓ Signals captured")
    except Exception as e:
        print(f"⚠ Signals screenshot failed: {e}")

    # ===== 6. Response =====
    try:
        page.goto("http://localhost:3000/response", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/response.png", timeout=60000)
        print("✓ Response captured")
    except Exception as e:
        print(f"⚠ Response screenshot failed: {e}")

    # ===== 7. AI Analysis =====
    try:
        page.goto("http://localhost:3000/ai-analysis", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/ai-analysis.png", timeout=60000)
        print("✓ AI Analysis captured")
    except Exception as e:
        print(f"⚠ AI Analysis screenshot failed: {e}")

    # ===== 8. Hunting =====
    try:
        page.goto("http://localhost:3000/hunting", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/hunting.png", timeout=60000)
        print("✓ Hunting captured")
    except Exception as e:
        print(f"⚠ Hunting screenshot failed: {e}")

    # ===== 9. Knowledge =====
    try:
        page.goto("http://localhost:3000/knowledge", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/knowledge.png", timeout=60000)
        print("✓ Knowledge captured")
    except Exception as e:
        print(f"⚠ Knowledge screenshot failed: {e}")

    # ===== 10. System Settings =====
    try:
        page.goto("http://localhost:3000/system", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOTS_DIR}/system.png", timeout=60000)
        print("✓ System captured")
    except Exception as e:
        print(f"⚠ System screenshot failed: {e}")

    # ===== 11. Pricing Page =====
    page2 = context.new_page()
    page2.goto("http://localhost:3000/pricing", wait_until="networkidle", timeout=10000)
    page2.screenshot(path=f"{SCREENSHOTS_DIR}/pricing.png", full_page=True)
    print("✓ Pricing captured")

    # ===== 12. Solutions Page =====
    page2.goto("http://localhost:3000/solutions", wait_until="networkidle", timeout=10000)
    page2.screenshot(path=f"{SCREENSHOTS_DIR}/solutions.png", full_page=True)
    print("✓ Solutions captured")

    # ===== 13. Docs Page =====
    page2.goto("http://localhost:3000/docs", wait_until="networkidle", timeout=10000)
    page2.screenshot(path=f"{SCREENSHOTS_DIR}/docs.png", full_page=True)
    print("✓ Docs captured")

    # ===== 14. Mobile View =====
    mobile_context = browser.new_context(viewport={"width": 375, "height": 812})
    mobile_page = mobile_context.new_page()
    mobile_page.goto("http://localhost:3000", wait_until="networkidle", timeout=10000)
    mobile_page.screenshot(path=f"{SCREENSHOTS_DIR}/landing-mobile.png", full_page=True)
    print("✓ Mobile landing captured")

    mobile_page.goto("http://localhost:3000/login", wait_until="networkidle", timeout=10000)
    mobile_page.screenshot(path=f"{SCREENSHOTS_DIR}/login-mobile.png", full_page=True)
    print("✓ Mobile login captured")

    # Console errors summary
    if errors:
        print(f"\n⚠ Console errors found ({len(errors)}):")
        for e in errors[:10]:
            print(f"  - {e[:120]}")
    else:
        print("\n✓ No console errors detected")

    browser.close()
    print("\n✓ All screenshots captured successfully")
