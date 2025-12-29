from playwright.sync_api import sync_playwright

def verify_shopkeepers_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Set localStorage to simulate logged-in user
        # Based on memory: "Login page ... persisted via localStorage keys loginAttempts"
        # And AuthGuard verifies isLoggedIn.
        page.goto("http://localhost:9002/login")
        page.evaluate("localStorage.setItem('isLoggedIn', 'true')")

        # Navigate to shopkeepers page
        page.goto("http://localhost:9002/shopkeepers")

        # Wait for content to load
        page.wait_for_selector("text=Shopkeepers", timeout=10000)

        # Verify search input exists
        search_input = page.get_by_placeholder("Search by name...")
        if search_input.is_visible():
            print("Search input found")

        # Type into search input
        search_input.fill("Test Shopkeeper")

        # Take a screenshot to verify UI is responsive
        page.screenshot(path="verification/shopkeepers_search.png")
        print("Screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_shopkeepers_page()
