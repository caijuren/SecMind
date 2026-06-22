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

    # Check what happens when we manually trigger a navigation
    print("=== Manual navigation test ===")
    all_messages.clear()

    # Use the native <a> tag click behavior
    result = page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return 'Link not found';

        // Create and dispatch a proper click event
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });

        // Check if there are any React event handlers
        const reactKey = Object.keys(link).find(k => k.startsWith('__reactProps'));
        const reactProps = reactKey ? link[reactKey] : null;

        const eventKey = Object.keys(link).find(k => k.startsWith('__reactEvents'));
        const reactEvents = eventKey ? link[eventKey] : null;

        return {
            reactKey,
            reactProps: reactProps ? Object.keys(reactProps) : null,
            eventKey,
            reactEvents: reactEvents ? Object.keys(reactEvents) : null,
            onClick: typeof reactProps?.onClick,
            onClickHandler: reactProps?.onClick?.toString()?.substring(0, 200),
        };
    }""")
    print(f"  React props: {result}")

    browser.close()
