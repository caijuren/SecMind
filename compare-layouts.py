from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("正在访问AI处置页面...")
    page.goto('http://localhost:3000/response', timeout=30000)
    page.wait_for_load_state('networkidle', timeout=30000)
    time.sleep(2)

    page.screenshot(path='/Users/grubby/Desktop/SecMind/response-layout.png', full_page=True)
    print("✓ AI处置页面截图已保存")

    print("\n正在访问调查页面...")
    page.goto('http://localhost:3000/investigate', timeout=30000)
    page.wait_for_load_state('networkidle', timeout=30000)
    time.sleep(2)

    page.screenshot(path='/Users/grubby/Desktop/SecMind/investigate-layout.png', full_page=True)
    print("✓ 调查页面截图已保存")

    browser.close()
