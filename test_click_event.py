from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    all_messages = []
    page.on("console", lambda msg: all_messages.append(f"[{msg.type}] {msg.text[:300]}"))

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Test clicking pipeline link with detailed event monitoring
    print("=== Testing click on /pipeline link ===")
    all_messages.clear()

    result = page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return 'Link not found';

        // Add click listener to see what happens
        link.addEventListener('click', (e) => {
            console.log('CLICK_EVENT: type=' + e.type + ' defaultPrevented=' + e.defaultPrevented + ' cancelable=' + e.cancelable);
            console.log('CLICK_EVENT: target=' + e.target.tagName + ' currentTarget=' + e.currentTarget.tagName);
            console.log('CLICK_EVENT: href=' + e.currentTarget.getAttribute('href'));
        }, true);  // capture phase

        // Simulate click
        link.click();

        return 'Click simulated';
    }""")
    print(f"  {result}")
    time.sleep(5)
    print(f"  URL: {page.url}")
    print(f"  Messages:")
    for m in all_messages:
        if 'CLICK' in m:
            print(f"    {m}")

    browser.close()
