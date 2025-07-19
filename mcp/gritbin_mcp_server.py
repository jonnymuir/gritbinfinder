# gritbin_mcp_server.py
from fastmcp import FastMCP
from pydantic import BaseModel, Field
import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

mcp = FastMCP(name="GritBin MCP Server")

# Define the input schema for your tool using Pydantic BaseModel
class PostcodeInput(BaseModel):
    postcode: str = Field(description="The UK postcode to search, e.g., 'LS28 5UL'.")

# Define your tool using the @app.tool() decorator
async def click_first_unclustered_pin(page):
    # Loop: zoom in on clusters until only single markers remain
    max_attempts = 10
    for _ in range(max_attempts):
        # Get all marker icons
        pins = await page.query_selector_all('.leaflet-marker-icon')
        # Filter out clusters (clusters often have 'marker-cluster' in their class)
        single_pins = []
        for pin in pins:
            class_name = await pin.get_attribute('class')
            if 'marker-cluster' not in class_name:
                single_pins.append(pin)
        if single_pins:
            # Found at least one single marker, click the first
            pin_element = single_pins[0]
            await pin_element.scroll_into_view_if_needed()
            await pin_element.click(force=True)
            return True
        else:
            # Click the first cluster to zoom in
            clusters = [pin for pin in pins if 'marker-cluster' in (await pin.get_attribute('class'))]
            if clusters:
                await clusters[0].scroll_into_view_if_needed()
                await clusters[0].click(force=True)
                await page.wait_for_timeout(1000)  # Wait for map to update
            else:
                break
    return False

async def click_and_get_popup(page, marker):
    await marker.scroll_into_view_if_needed()
    await marker.click(force=True)
    try:
        await page.wait_for_selector('.leaflet-popup-content', timeout=2000)
        popup = await page.query_selector('.leaflet-popup-content')
        if popup:
            popup_content = await popup.inner_html()  # Changed from inner_text to inner_html
            # Optionally, close the popup for the next try
            close_btn = await page.query_selector('.leaflet-popup-close-button')
            if close_btn:
                await close_btn.click()
            return popup_content
    except Exception:
        pass
    return None

async def wait_for_marker_dom_change(page, previous_htmls, timeout=3000):
    await page.wait_for_function(
        """(selector, prevHtmls) => {
            const nodes = Array.from(document.querySelectorAll(selector));
            const htmls = nodes.map(n => n.outerHTML);
            if (htmls.length !== prevHtmls.length) return true;
            for (let i = 0; i < htmls.length; i++) {
                if (htmls[i] !== prevHtmls[i]) return true;
            }
            return false;
        }""",
        ('.leaflet-marker-icon', previous_htmls),
        timeout=timeout
    )

async def find_marker_with_popup(page, max_attempts=10):
    for _ in range(max_attempts):
        pins = await page.query_selector_all('.leaflet-marker-icon')
        single_pins = []
        clusters = []
        for pin in pins:
            class_name = await pin.get_attribute('class')
            if 'marker-cluster' in class_name:
                clusters.append(pin)
            else:
                single_pins.append(pin)
        # Try each single marker for a popup
        for pin in single_pins:
            popup_content = await click_and_get_popup(page, pin)
            if popup_content and "Grit Bin" in popup_content:
                return popup_content
        # If no popup found, zoom into the first cluster and try again
        if clusters:
            # Get current marker DOM state
            previous_htmls = [await pin.evaluate('n => n.outerHTML') for pin in pins]
            await clusters[0].scroll_into_view_if_needed()
            await clusters[0].click(force=True)
            await wait_for_marker_dom_change(page, previous_htmls)
        else:
            break
    return None

def extract_links_from_html(html):
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.find_all("a"):
        links.append({
            "text": a.get_text(strip=True),
            "url": a.get("href")
        })
    return links

@mcp.tool()
async def view_gritbins_on_map(input: PostcodeInput) -> dict:
    """
    Visits the grit bin finder page, runs JavaScript, and extracts info from the nearest grit bin pin.
    Returns a dict with popup HTML and extracted links.
    """
    base_url = "https://gritbinfinder-476im3hk7-jonny-muirs-projects.vercel.app"
    generated_url = f"{base_url}/?postcode={input.postcode}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(generated_url)
        await page.wait_for_load_state('networkidle')
        await page.wait_for_selector('.leaflet-marker-icon')

        popup_content = await find_marker_with_popup(page)
        await browser.close()

        if popup_content:
            links = extract_links_from_html(popup_content)
            return {
                "popup_html": popup_content,
                "links": links,
                "display_instructions": (
                    "Please display the grit bin information in a clear and friendly way. "
                    "Summarize the details from the popup, and if there are any links, "
                    "list them as clickable Markdown bullet points with their text and URLs. "
                    "Use bullet points for clarity and include all available information."
                )
            }
        else:
            screenshot_path = "debug_popup_failure.png"
            await page.screenshot(path=screenshot_path, full_page=True)
            return {
                "error": "No grit bin popup found after clicking markers and clusters.",
                "screenshot": screenshot_path,
                "display_instructions": (
                    "Sorry, I couldn't find a grit bin popup for that postcode. "
                    "If you need help, check the attached screenshot for debugging."
                )
            }

if __name__ == "__main__":
    print("\n--- Starting FastMCP Server via __main__ ---")
    mcp.run(transport="sse", port=8080, host="0.0.0.0")
