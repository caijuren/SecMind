from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Collect all console messages
    all_messages = []
    page.on("console", lambda msg: all_messages.append(f"[{msg.type}] {msg.text[:300]}"))
    page.on("pageerror", lambda err: all_messages.append(f"[PAGE_ERROR] {str(err)[:300]}"))

    # Navigate to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Clear messages
    all_messages.clear()

    # Click pipeline link
    print("=== Clicking /pipeline ===")
    pipeline_link = page.locator('nav a[href="/pipeline"]')
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(5)
        print(f"  URL: {page.url}")

        # Print ALL console messages
        print(f"  Console messages ({len(all_messages)}):")
        for msg in all_messages:
            print(f"    {msg}")
    else:
        print("  Pipeline link not found!")

    browser.close()
