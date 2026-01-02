import os
import json
from datetime import datetime
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Intercept network requests to Supabase to mock bills
    # Note: We don't know the exact URL Supabase uses, but it likely contains "rest/v1/bills"
    # We will try to intercept any request to the bills table.

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

    def handle_route(route):
        print(f"Intercepted: {route.request.url}")
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(mock_bills)
        )

    # We need to catch the Supabase request.
    # Since we might not hit the exact URL, we'll try a broad pattern for the bills table
    # The app code uses `useBill` context which calls `supabase.from('bills').select('*')` probably.
    # The URL will look like `.../rest/v1/bills?...`
    page.route("**/rest/v1/bills?*", handle_route)

    # We also need to mock `bill_customers` and `bill_settings` probably,
    # or the app might fail if it joins or fetches them.
    # The `useBill` context fetches: bills, customers, settings.

    page.route("**/rest/v1/bill_customers?*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": 1, "name": "Test Customer", "mobile_number": "1234567890", "address": "Test Address"}])
    ))

    page.route("**/rest/v1/bill_settings?*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": 1, "payment_methods": ["Cash"], "footer_message": "Thank you"}])
    ))

    # Also mock transactions/shopkeepers for useData if needed, but home page loads them.
    # If they fail, loadingTransactions might be true forever.
    # Let's mock them too.
    page.route("**/rest/v1/transactions?*", lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps([])
    ))
    page.route("**/rest/v1/shopkeepers?*", lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps([])
    ))


    # Set localStorage for AuthGuard
    page.add_init_script("""
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginAttempts', '0');
    """)

    try:
        page.goto("http://localhost:9002")

        # Wait for the table to appear.
        # If loading takes time, we wait for a specific element.
        # "Today's Bills" heading
        expect(page.get_by_role("heading", name="Today's Bills").first).to_be_visible(timeout=10000)

        # Check table headers
        # We expect "S.No." and NOT "Paid"
        expect(page.get_by_role("columnheader", name="S.No.")).to_be_visible()
        expect(page.get_by_role("columnheader", name="Paid")).not_to_be_visible()
        expect(page.get_by_role("columnheader", name="Bill #")).not_to_be_visible()

        # Check row content
        # The S.No should be 1
        # The customer name "Test Customer" should be visible
        expect(page.get_by_role("cell", name="1", exact=True)).to_be_visible()
        expect(page.get_by_role("cell", name="Test Customer")).to_be_visible()

        # Take screenshot
        page.screenshot(path="verification/verification.png")
        print("Verification successful, screenshot saved.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")

    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run(p)
