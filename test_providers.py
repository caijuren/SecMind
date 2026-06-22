from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Deep dive into the fiber tree to find context providers
    print("=== Finding context providers in fiber tree ===")
    result = page.evaluate("""() => {
        const body = document.body;
        const fiberKey = Object.keys(body).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) return 'No fiber on body';

        let fiber = body[fiberKey];
        const providers = [];
        let depth = 0;

        // Walk down the tree
        function walkFiber(fiber, depth) {
            if (!fiber || depth > 30) return;

            // Check if this is a context provider
            if (fiber.type && typeof fiber.type === 'object' && fiber.type.$$typeof) {
                const typeName = fiber.type.$$typeof.toString();
                providers.push({
                    depth,
                    typeName: typeName.substring(0, 50),
                    componentName: fiber.type?.render?.name || 'unknown',
                });
            }

            // Also check for AppRouterProvider or similar
            if (fiber.type?.name) {
                const name = fiber.type.name;
                if (name.includes('Router') || name.includes('Provider') || name.includes('App')) {
                    providers.push({
                        depth,
                        typeName: 'Component',
                        componentName: name,
                    });
                }
            }

            // Walk children
            if (fiber.child) walkFiber(fiber.child, depth + 1);
            if (fiber.sibling) walkFiber(fiber.sibling, depth);
        }

        walkFiber(fiber, 0);

        return {
            providerCount: providers.length,
            providers: providers.slice(0, 30),
        };
    }""")
    print(f"  Found {result.get('providerCount', 0)} providers/components")
    for p_item in result.get('providers', []):
        print(f"    depth={p_item['depth']}: {p_item['componentName']} ({p_item['typeName']})")

    browser.close()
