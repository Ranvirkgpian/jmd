import os
import json
from datetime import datetime
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    today_iso = datetime.now().strftime("%Y-%m-%d")
    mock_bills = [
        {
            "id": 123,
            "bill_number": 1001,
            "customer_id": 1,
            "customer_name": "Test Customer",
            "total_amount": 500.0,
            "paid_amount": 200.0,
            "date": f"{today_iso}T10:00:00",
            "created_at": f"{today_iso}T10:00:00",
            "updated_at": f"{today_iso}T10:00:00"
        }
    ]

    page.route("**/rest/v1/bills?*", lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps(mock_bills)
    ))
    page.route("**/rest/v1/bill_customers?*", lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps([{"id": 1, "name": "Test Customer", "mobile_number": "1234567890", "address": "Test Address"}])
    ))
    page.route("**/rest/v1/bill_settings?*", lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps([{"id": 1, "payment_methods": ["Cash"], "footer_message": "Thank you"}])
    ))
    page.route("**/rest/v1/transactions?*", lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps([])
    ))
    page.route("**/rest/v1/shopkeepers?*", lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps([])
    ))

    page.add_init_script("""
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginAttempts', '0');
    """)

    try:
        page.goto("http://localhost:9002")
        page.wait_for_timeout(5000) # Give it plenty of time to render

        content = page.content()
        print("Page Content Length:", len(content))
        if "S.No." in content:
            print("FOUND S.No. in content!")
        else:
            print("S.No. NOT FOUND in content.")

        if "Bill #" in content:
            print("FOUND Bill # in content!")
        else:
            print("Bill # NOT FOUND in content.")

        page.screenshot(path="verification/debug.png", full_page=True)
        print("Screenshot saved to verification/debug.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run(p)
