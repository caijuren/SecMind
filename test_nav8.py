from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Get all nav links with their details
    links = page.evaluate("""() => {
        const navLinks = document.querySelectorAll('nav a');
        return Array.from(navLinks).map(a => ({
            href: a.getAttribute('href'),
            text: a.textContent.trim(),
            visible: a.offsetParent !== null,
            display: window.getComputedStyle(a).display,
            opacity: window.getComputedStyle(a).opacity,
            pointerEvents: window.getComputedStyle(a).pointerEvents,
            rect: a.getBoundingClientRect()
        }));
    }""")
    print("=== Nav links details ===")
    for link in links:
        print(f"  {link['href']}: text='{link['text']}', visible={link['visible']}, display={link['display']}, pointerEvents={link['pointerEvents']}, rect={link['rect']}")

    # Check if there's something covering the sidebar
    print("\n=== Checking for elements covering sidebar ===")
    covering = page.evaluate("""() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return 'No sidebar found';
        const rect = sidebar.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elementAtPoint = document.elementFromPoint(centerX, centerY);
        return {
            sidebarRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
            elementAtCenter: elementAtPoint?.tagName + (elementAtPoint?.className ? '.' + elementAtPoint.className.toString().substring(0, 50) : ''),
            isInsideSidebar: sidebar.contains(elementAtPoint)
        };
    }""")
    print(f"  {covering}")

    browser.close()
