from playwright.sync_api import sync_playwright
import json
import re

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://weather.niwa.co.nz/widgets", wait_until="networkidle")

    # 点击 Parks tab
    # page.get_by_role("button", name="Parks", exact=True).click()
    # page.wait_for_timeout(1000)

    # 只取当前可见的下拉框
    target_select = page.locator("select.form-control:visible").first

    selects = page.locator("select.form-control")
    target_select = None

    for i in range(selects.count()):
        s = selects.nth(i)
        text = s.inner_text()
        if "Akaroa Ews" in text or "Angelus Hut" in text:
            target_select = s
            break

    if target_select is None:
        raise Exception("Could not find the location select")

    options = target_select.locator("option")
    count = options.count()

    for i in range(count):
        label = options.nth(i).inner_text().strip()
        value = options.nth(i).get_attribute("value")

        target_select.select_option(value=value)
        page.wait_for_timeout(1000)

        page.get_by_role("button", name="Get code").click()
        page.wait_for_timeout(1000)

        modal = page.locator(".modal-content")
        text = modal.inner_text()

        match = re.search(r'src="([^"]+)"', text)
        widget_url = match.group(1) if match else None

        results.append({
            "name": label,
            "value": value,
            "widget_url": widget_url
        })

        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        print(f"{count}, {label}, {widget_url}")
    browser.close()

with open("niwa_widgets.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Done!")