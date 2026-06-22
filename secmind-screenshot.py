from playwright.sync_api import sync_playwright
import os

output_dir = "/tmp/secmind-screenshots"
os.makedirs(output_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    # Login
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path=f'{output_dir}/01-login.png')
    
    # Demo login
    demo_btn = page.locator('text=演示登录')
    if demo_btn.count() > 0:
        demo_btn.first.click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)
    
    pages = [
        ('dashboard', '/dashboard'),
        ('signals', '/signals'),
        ('investigate', '/investigate'),
        ('ai-analysis', '/ai-analysis'),
        ('ai-chat', '/ai-chat'),
        ('knowledge', '/knowledge'),
        ('assets', '/assets'),
        ('users', '/users'),
        ('system', '/system'),
        ('integrations', '/integrations'),
        ('learning', '/learning'),
        ('response', '/response'),
        ('hunting', '/hunting'),
    ]
    
    for name, path in pages:
        try:
            page.goto(f'http://localhost:3000{path}')
            page.wait_for_load_state('domcontentloaded')
            page.wait_for_timeout(2000)
            page.screenshot(path=f'{output_dir}/{name}.png', timeout=15000)
            print(f"Captured: {name}")
        except Exception as e:
            print(f"Failed: {name} - {e}")
    
    browser.close()
    print(f"Done. Screenshots in {output_dir}")
