from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))
    
    page.goto("http://localhost:3000/investigate", timeout=15000)
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    
    page.screenshot(path="/Users/grubby/Desktop/SecMind/frontend/public/sidebar_check.png", full_page=True)
    
    sidebar = page.query_selector("aside")
    if sidebar:
        print("=== Sidebar found ===")
        links = sidebar.query_selector_all("a")
        print(f"Number of links in sidebar: {len(links)}")
        for link in links:
            href = link.get_attribute("href")
            text = link.inner_text().strip()
            print(f"  Link: href={href}, text='{text}'")
        
        nav = sidebar.query_selector("nav")
        if nav:
            nav_items = nav.query_selector_all("a")
            print(f"Number of nav items: {len(nav_items)}")
            for item in nav_items:
                print(f"  Nav item: href={item.get_attribute('href')}, text='{item.inner_text().strip()}'")
    else:
        print("=== No sidebar found ===")
        body = page.query_selector("body")
        if body:
            print(body.inner_text()[:2000])
    
    browser.close()