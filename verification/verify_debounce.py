from playwright.sync_api import sync_playwright

def verify_bill_history_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Add local storage state to simulate login
        context.add_init_script("""
            localStorage.setItem('isLoggedIn', 'true');
        """)

        page = context.new_page()

        try:
            # Navigate to the bill history page
            page.goto("http://localhost:9002/bill-book/history")

            # Wait for the page to load
            page.wait_for_selector("h1:has-text('All Bills / History')")

            # Type in the search box to trigger debounce
            search_input = page.get_by_placeholder("Search by customer, bill number, or date...")
            search_input.fill("Test Customer")

            # Wait a bit for debounce and filter to happen
            page.wait_for_timeout(1000)

            # Take a screenshot
            page.screenshot(path="verification/history_page_debounced.png")
            print("Screenshot taken successfully")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_bill_history_page()
