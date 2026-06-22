#!/usr/bin/env python3
"""SecMind 浅色主题审查 - 第1步：登录并截图"""
import sys
import os
os.makedirs("/tmp/secmind-qa", exist_ok=True)

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    print("访问登录页...", flush=True)
    page.goto("http://localhost:3000/login", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)

    # 截图
    page.screenshot(path="/tmp/secmind-qa/login.png", full_page=True)
    print("登录页截图完成", flush=True)

    # 获取页面内容来分析登录按钮
    buttons = page.evaluate("""() => {
        const btns = document.querySelectorAll('button, a[role="button"], [role="button"]');
        return Array.from(btns).map(b => ({
            text: b.textContent.trim().substring(0, 100),
            tag: b.tagName,
            type: b.type || '',
            href: b.href || '',
            classes: b.className.substring(0, 200),
            visible: b.offsetParent !== null
        }));
    }""")
    print("页面按钮: " + str(buttons), flush=True)

    # 获取输入框
    inputs = page.evaluate("""() => {
        const inputs = document.querySelectorAll('input, textarea');
        return Array.from(inputs).map(i => ({
            type: i.type,
            name: i.name,
            placeholder: i.placeholder,
            visible: i.offsetParent !== null
        }));
    }""")
    print("输入框: " + str(inputs), flush=True)

    # 获取链接
    links = page.evaluate("""() => {
        const links = document.querySelectorAll('a');
        return Array.from(links).map(a => ({
            text: a.textContent.trim().substring(0, 100),
            href: a.href
        }));
    }""")
    print("链接: " + str(links), flush=True)

    browser.close()
    print("完成", flush=True)
