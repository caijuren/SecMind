from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    all_errors = []
    page.on("pageerror", lambda err: all_errors.append(str(err)[:300]))
    page.on("console", lambda msg: all_errors.append(f"[{msg.type}] {msg.text[:300]}") if msg.type in ["error", "warning"] else None)

    # Direct navigation to signals
    print("=== Direct navigation to /signals ===")
    page.goto('http://localhost:5173/signals', wait_until='domcontentloaded')
    time.sleep(8)
    print(f"  URL: {page.url}")
    print(f"  Errors: {len(all_errors)}")
    for e in all_errors[:10]:
        print(f"    {e}")

    # Check if the page content is visible
    body_text = page.evaluate("() => document.body?.innerText?.substring(0, 200) || 'empty'")
    print(f"  Body text: {body_text}")

    browser.close()
