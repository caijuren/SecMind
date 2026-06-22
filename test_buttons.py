"""Test buttons on SecMind - v2 with force click and proper cleanup."""
import json
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:3000'

DASHBOARD_PAGES = [
    '/dashboard', '/signals', '/pipeline', '/investigate', '/cases',
    '/ai-chat', '/knowledge', '/learning', '/assets', '/settings',
    '/settings/skills', '/settings/providers', '/settings/mcp',
    '/hunting', '/response', '/reports', '/notifications', '/metrics',
    '/audit', '/datasource', '/integrations', '/system',
    '/system/billing', '/system/compliance', '/system/rbac',
    '/ai-analysis', '/situation-room', '/onboarding',
    '/playbooks/editor', '/users', '/workflows',
]

MARKETING_PAGES = ['/', '/pricing', '/solutions', '/docs']
AUTH_PAGES = ['/login', '/register', '/forgot-password']

SKIP_TEXT = ['登 录', 'Login', '获取验证码', '退出', '注销', '注册', 'Register', 'Submit']
SKIP_ARIA = ['隐藏密码', '显示密码', '展开侧边栏', '收起侧边栏']

non_responsive = []
working = []
disabled_list = []
page_errors = []


def log(msg):
    print(msg, flush=True)


def should_skip(text, aria):
    for s in SKIP_TEXT:
        if s in text:
            return True
    if aria:
        for s in SKIP_ARIA:
            if s in aria:
                return True
    return False


def close_all_overlays(page):
    """Close any open dialogs, menus, or popups."""
    try:
        page.keyboard.press('Escape')
        page.wait_for_timeout(200)
        page.keyboard.press('Escape')
        page.wait_for_timeout(200)
    except:
        pass
    # Also try clicking any close buttons
    try:
        close_btns = page.locator('[data-state="open"] button:has(svg), [role="dialog"] button').all()
        for btn in close_btns[:3]:
            try:
                btn.click(timeout=500, force=True)
                page.wait_for_timeout(200)
            except:
                pass
    except:
        pass


def test_page(page, url, name):
    log(f"\n--- {name} ({url}) ---")
    try:
        page.goto(f'{BASE_URL}{url}', timeout=15000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(2000)
        close_all_overlays(page)
    except Exception as e:
        log(f"  PAGE ERROR: {str(e)[:80]}")
        page_errors.append({'page': name, 'url': url, 'error': str(e)[:100]})
        return

    # Get all buttons with their info
    buttons_info = page.evaluate('''() => {
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons).map((btn, i) => ({
            index: i,
            text: btn.textContent.trim().substring(0, 60),
            ariaLabel: btn.getAttribute('aria-label') || '',
            disabled: btn.disabled,
            visible: btn.offsetParent !== null && btn.offsetHeight > 0,
            className: btn.className.substring(0, 80),
            rect: btn.getBoundingClientRect().toJSON(),
        }));
    }''')

    visible_buttons = [b for b in buttons_info if b['visible']]
    log(f"  {len(visible_buttons)} visible / {len(buttons_info)} total buttons")

    for binfo in visible_buttons:
        idx = binfo['index']
        text = binfo['text']
        aria = binfo['ariaLabel']

        if binfo['disabled']:
            disabled_list.append({'page': name, 'text': text, 'aria': aria})
            log(f"  [DISABLED] '{text}' (aria: {aria})")
            continue

        if should_skip(text, aria):
            log(f"  [SKIP] '{text}'")
            continue

        # Close any overlays before each click
        close_all_overlays(page)

        btn = page.locator('button').nth(idx)
        url_before = page.url

        # Take snapshot of DOM before click
        dom_before = page.evaluate('() => document.body.innerHTML.length')

        try:
            btn.click(timeout=3000, force=True)
        except Exception as e:
            err = str(e)
            if 'detached' in err or 'not attached' in err:
                working.append({'page': name, 'text': text, 'effect': 'element_removed'})
                log(f"  [WORKING] '{text}' -> element removed")
                continue
            log(f"  [CLICK-ERR] '{text}' - {err[:60]}")
            continue

        page.wait_for_timeout(800)

        # Check effects
        url_after = page.url
        nav = url_before != url_after

        # Check for dialog/modal/dropdown
        has_dialog = False
        try:
            d = page.locator('[role="dialog"], [role="menu"], [role="listbox"], [aria-modal="true"], [data-state="open"], [data-radix-popper-content-wrapper]').first
            if d.count() > 0 and d.is_visible():
                has_dialog = True
        except:
            pass

        # Check for toast
        has_toast = False
        try:
            t = page.locator('[data-sonner-toast], [role="status"], .toast').first
            if t.count() > 0 and t.is_visible():
                has_toast = True
        except:
            pass

        # Check if DOM changed significantly
        dom_after = page.evaluate('() => document.body.innerHTML.length')
        dom_changed = abs(dom_after - dom_before) > 100

        # Check for sheet/drawer
        has_sheet = False
        try:
            s = page.locator('[data-state="open"]').first
            if s.count() > 0 and s.is_visible():
                has_sheet = True
        except:
            pass

        had_effect = nav or has_dialog or has_toast or dom_changed or has_sheet

        if had_effect:
            effects = []
            if nav: effects.append('navigated')
            if has_dialog: effects.append('dialog/menu')
            if has_toast: effects.append('toast')
            if dom_changed and not nav and not has_dialog: effects.append('DOM changed')
            if has_sheet and not has_dialog: effects.append('sheet/drawer')
            working.append({'page': name, 'text': text, 'effect': ', '.join(effects)})
            log(f"  [WORKING] '{text}' -> {', '.join(effects)}")

            # Cleanup
            close_all_overlays(page)
            if nav:
                try:
                    page.go_back()
                    page.wait_for_load_state('networkidle', timeout=8000)
                    page.wait_for_timeout(500)
                except:
                    page.goto(f'{BASE_URL}{url}', timeout=10000)
                    page.wait_for_load_state('networkidle', timeout=8000)
                    page.wait_for_timeout(500)
        else:
            non_responsive.append({'page': name, 'url': url, 'text': text, 'aria': aria})
            log(f"  [NO-RESPONSE] '{text}' (aria: {aria})")

        # Always close overlays after each button test
        close_all_overlays(page)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # Login
        log("Logging in...")
        page.goto(f'{BASE_URL}/login')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        page.locator('input[name="email"]').fill('admin@secmind.com')
        page.locator('input[type="password"]').fill('admin123')
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(3000)
        log(f"After login: {page.url}")

        if '/login' in page.url:
            log("Login failed, trying demo...")
            page.goto(f'{BASE_URL}/auth/demo')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)
            log(f"After demo: {page.url}")

        # Test dashboard pages
        for url in DASHBOARD_PAGES:
            test_page(page, url, url.strip('/') or 'dashboard')

        # Test auth/marketing pages in separate context
        ctx2 = browser.new_context(viewport={"width": 1440, "height": 900})
        p2 = ctx2.new_page()

        for url in AUTH_PAGES:
            test_page(p2, url, f'auth-{url.strip("/")}')

        for url in MARKETING_PAGES:
            test_page(p2, url, f'mkt-{url.strip("/") or "home"}')

        ctx2.close()

        # Summary
        log("\n" + "="*60)
        log("SUMMARY")
        log("="*60)
        log(f"Working buttons: {len(working)}")
        log(f"Non-responsive buttons: {len(non_responsive)}")
        log(f"Disabled buttons: {len(disabled_list)}")
        log(f"Page errors: {len(page_errors)}")

        if non_responsive:
            log("\n=== NON-RESPONSIVE BUTTONS ===")
            # Group by page
            by_page = {}
            for btn in non_responsive:
                pg = btn['page']
                if pg not in by_page:
                    by_page[pg] = []
                by_page[pg].append(btn)
            for pg, btns in sorted(by_page.items()):
                log(f"\n  [{pg}]")
                for btn in btns:
                    log(f"    - '{btn['text']}' (aria: {btn['aria']})")

        # Save JSON
        with open('/tmp/btn-results.json', 'w') as f:
            json.dump({
                'non_responsive': non_responsive,
                'working': working,
                'disabled': disabled_list,
                'page_errors': page_errors,
            }, f, ensure_ascii=False, indent=2)
        log("\nResults saved to /tmp/btn-results.json")

        browser.close()


if __name__ == '__main__':
    main()
