from playwright.sync_api import sync_playwright

def verify_footer_setting():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to ensure we can see the full page
        context = browser.new_context(viewport={'width': 1280, 'height': 1024})

        # Load storage state if possible, but here we just login
        page = context.new_page()

        # 1. Login
        print("Navigating to login...")
        page.goto("http://localhost:9002/login")

        # Fill credentials (from memory: Username: "JMD", Password: "311976")
        page.fill("input#username", "JMD")
        page.fill("input#password", "311976")
        page.click("button[type='submit']")

        # Wait for navigation to home
        page.wait_for_url("http://localhost:9002/", timeout=10000)
        print("Logged in successfully.")

        # 2. Navigate to Bill Book Settings
        print("Navigating to Bill Book Settings...")
        page.goto("http://localhost:9002/bill-book/settings")

        # Wait for the Footer Message textarea to be visible
        page.wait_for_selector("textarea#footer_message")

        # 3. Enter a value in the footer message (include Hindi text)
        test_message = "Terms & Conditions:\n1. Goods once sold will not be taken back.\n2. यह एक कंप्यूटर जनित बिल है।"
        page.fill("textarea#footer_message", test_message)

        # 4. Save settings
        page.click("button:has-text('Save Settings')")

        # Wait for toast or confirmation (optional, but good for stability)
        # page.wait_for_selector("text=Settings Updated")
        # (Toast might appear and disappear, so we might skip waiting for it if flaky,
        # but let's wait a bit to ensure save completes)
        page.wait_for_timeout(2000)

        # 5. Take screenshot of the settings page
        print("Taking screenshot of Settings page...")
        page.screenshot(path="verification/settings_page.png")

        # 6. Verify PDF generation?
        # It's hard to verify PDF content via Playwright screenshot since it triggers a download.
        # But we can verify the setting is persisted by reloading.

        print("Reloading page to verify persistence...")
        page.reload()
        page.wait_for_selector("textarea#footer_message")

        value = page.input_value("textarea#footer_message")
        print(f"Persisted value: {value}")

        if test_message in value:
             print("Verification SUCCESS: Footer message persisted.")
        else:
             print("Verification FAILED: Footer message not persisted.")

        browser.close()

if __name__ == "__main__":
    verify_footer_setting()
