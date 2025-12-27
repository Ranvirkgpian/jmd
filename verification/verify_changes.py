
import os
from playwright.sync_api import Page, expect, sync_playwright

def test_bill_book_integration(page: Page):
    print("Navigating to Login...")
    # 1. Login
    page.goto("http://localhost:9002/login", timeout=60000)

    print("Waiting for username input...")
    username = page.wait_for_selector("#username", state="visible", timeout=60000)
    username.fill("JMD")

    page.fill("#password", "311976")
    page.click("button[type='submit']")

    print("Logged in. Waiting for dashboard...")
    # Wait for navigation to home - Use a more specific locator or just wait for url change
    page.wait_for_url("http://localhost:9002/", timeout=30000)

    # 2. Navigate to Bill Book -> Reports (Verify Product Chart)
    print("Navigating to Reports...")
    page.goto("http://localhost:9002/bill-book/reports")
    # Wait for chart title
    expect(page.get_by_text("Product Sales (Quantity)")).to_be_visible(timeout=30000)

    # Take screenshot of Reports
    page.screenshot(path="verification/1_reports_chart.png")
    print("Reports screenshot taken.")

    # 3. Navigate to Customer Ledger
    print("Navigating to Ledger...")
    page.goto("http://localhost:9002/bill-book/ledger")
    expect(page.get_by_text("Customer Ledger")).to_be_visible(timeout=30000)

    # Take screenshot of Ledger to show "Create Bill" buttons
    page.screenshot(path="verification/2_ledger_buttons.png")
    print("Ledger screenshot taken.")

    # 4. Navigate to Create New Bill
    print("Navigating to New Bill...")
    page.goto("http://localhost:9002/bill-book/new")

    # Open Customer Search
    print("Opening search...")
    page.click("button[title='Search Existing Customer']")

    # Type to search
    page.fill("input[placeholder='Search customer...']", "a")

    # Wait a bit for results
    page.wait_for_timeout(2000)

    # Take screenshot of search results showing Shopkeepers (if any)
    page.screenshot(path="verification/3_new_bill_search.png")
    print("Search screenshot taken.")

    # 5. Test "Create Bill" from Ledger (Direct URL)
    print("Testing pre-fill...")
    page.goto("http://localhost:9002/bill-book/new?customerId=test-id-123")

    # Wait for page load
    expect(page.get_by_text("Create New Bill")).to_be_visible()

    page.screenshot(path="verification/4_new_bill_param.png")
    print("Pre-fill screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_bill_book_integration(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
