from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    all_messages = []
    page.on("console", lambda msg: all_messages.append(f"[{msg.type}] {msg.text[:500]}"))

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Get the full onClick handler
    print("=== Getting onClick handler ===")
    result = page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return 'Link not found';

        const reactKey = Object.keys(link).find(k => k.startsWith('__reactProps'));
        const reactProps = reactKey ? link[reactKey] : null;

        return {
            onClickFull: reactProps?.onClick?.toString()?.substring(0, 1000),
            href: reactProps?.href,
            ref: typeof reactProps?.ref,
        };
    }""")
    print(f"  {result}")

    # Now try to call the onClick handler directly
    print("\n=== Calling onClick directly ===")
    all_messages.clear()
    page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return;

        const reactKey = Object.keys(link).find(k => k.startsWith('__reactProps'));
        const reactProps = reactKey ? link[reactKey] : null;

        if (reactProps?.onClick) {
            // Create a mock event
            const mockEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
            });

            // Prevent default to avoid actual navigation
            // mockEvent.preventDefault();

            try {
                reactProps.onClick(mockEvent);
                console.log('ONCLICK_CALLED: success');
            } catch (e) {
                console.log('ONCLICK_ERROR:', e.message);
            }
        }
    }""")

    time.sleep(5)
    print(f"  URL: {page.url}")
    print(f"  Messages:")
    for m in all_messages:
        if 'ONCLICK' in m:
            print(f"    {m}")

    browser.close()
