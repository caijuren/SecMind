"""Reconnaissance: screenshot the site, understand login and page structure."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # 1. Check landing page
    page.goto('http://localhost:3000/')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/recon-01-landing.png', full_page=True)
    print("Landing page URL:", page.url)

    # 2. Check login page
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/recon-02-login.png', full_page=True)
    print("Login page URL:", page.url)

    # 3. Try to login with demo credentials
    inputs = page.locator('input').all()
    for inp in inputs:
        inp_type = inp.get_attribute('type') or ''
        inp_placeholder = inp.get_attribute('placeholder') or ''
        inp_name = inp.get_attribute('name') or ''
        print(f"  Input: type={inp_type}, name={inp_name}, placeholder={inp_placeholder}")

    email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="邮箱"], input[placeholder*="email"]').first
    password_input = page.locator('input[type="password"]').first

    if email_input.count() > 0:
        email_input.fill('admin@secmind.io')
        print("  Filled email")
    if password_input.count() > 0:
        password_input.fill('admin123')
        print("  Filled password")

    login_btn = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login"), button:has-text("Sign in")').first
    if login_btn.count() > 0:
        login_btn.click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        print("After login URL:", page.url)
        page.screenshot(path='/tmp/recon-03-after-login.png', full_page=True)
    else:
        print("No login button found")
        buttons = page.locator('button').all()
        for i, btn in enumerate(buttons):
            text = btn.inner_text()
            print(f"  Button {i}: {text}")

    # 4. Get sidebar navigation items
    sidebar_links = page.locator('nav a, aside a, [data-sidebar] a').all()
    print(f"\nSidebar links found: {len(sidebar_links)}")
    for link in sidebar_links:
        href = link.get_attribute('href') or ''
        text = link.inner_text().strip()
        print(f"  Nav: {text} -> {href}")

    all_links = page.locator('a[href^="/"]').all()
    unique_hrefs = set()
    for link in all_links:
        href = link.get_attribute('href') or ''
        if href and href.startswith('/') and not href.startswith('//'):
            unique_hrefs.add(href)

    print(f"\nAll unique internal links: {sorted(unique_hrefs)}")

    browser.close()
