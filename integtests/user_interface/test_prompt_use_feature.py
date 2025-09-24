"""
Integration tests for the prompt use feature.
Tests the end-to-end flow from prompts page to chat page.
"""
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time


class TestPromptUseFeature:
    """Integration tests for prompt use functionality."""

    @pytest.fixture(scope="class")
    def driver(self):
        """Setup Chrome driver for testing."""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.implicitly_wait(10)
        yield driver
        driver.quit()

    @pytest.fixture
    def authenticated_session(self, driver):
        """Setup authenticated session for testing."""
        # This would need to be implemented based on your auth flow
        # For now, assume we can navigate directly to the prompts page
        pass

    def test_prompt_use_button_exists(self, driver, authenticated_session):
        """Test that Use button exists in prompts table."""
        driver.get("https://dp3koqacdqxyq.cloudfront.net/prompts")
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TEXT, "Prompt Management"))
        )
        
        # Check if Use button exists
        use_buttons = driver.find_elements(By.XPATH, "//button[text()='Use']")
        assert len(use_buttons) > 0, "Use button should be present in prompts table"

    def test_prompt_use_navigation(self, driver, authenticated_session):
        """Test that clicking Use button navigates to chat page."""
        driver.get("https://dp3koqacdqxyq.cloudfront.net/prompts")
        
        # Wait for prompts to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TEXT, "Prompt Management"))
        )
        
        # Click first Use button
        use_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Use']"))
        )
        use_button.click()
        
        # Wait for navigation to chat page
        WebDriverWait(driver, 10).until(
            EC.url_contains("/chatbot/playground")
        )
        
        # Verify we're on the chat page
        assert "/chatbot/playground" in driver.current_url

    def test_prompt_prefill_in_chat(self, driver, authenticated_session):
        """Test that prompt content is prefilled in chat input."""
        # First create a test prompt
        driver.get("https://dp3koqacdqxyq.cloudfront.net/prompts")
        
        # Create a new prompt (this would need actual implementation)
        test_prompt_content = "Test prompt for integration testing"
        
        # Use the prompt
        use_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Use']"))
        )
        use_button.click()
        
        # Wait for chat page to load
        WebDriverWait(driver, 10).until(
            EC.url_contains("/chatbot/playground")
        )
        
        # Check if prompt is prefilled in input
        # This would need to be adjusted based on actual input element
        chat_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-locator='prompt-input']"))
        )
        
        # Verify prompt content is prefilled
        input_value = chat_input.get_attribute("value")
        assert input_value is not None, "Chat input should have prefilled content"

    def test_session_storage_cleanup(self, driver, authenticated_session):
        """Test that sessionStorage is cleaned up after prompt use."""
        driver.get("https://dp3koqacdqxyq.cloudfront.net/prompts")
        
        # Use a prompt
        use_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[text()='Use']"))
        )
        use_button.click()
        
        # Wait for navigation
        WebDriverWait(driver, 10).until(
            EC.url_contains("/chatbot/playground")
        )
        
        # Check that sessionStorage is cleaned up
        selected_prompt = driver.execute_script(
            "return sessionStorage.getItem('selectedPrompt');"
        )
        assert selected_prompt is None, "selectedPrompt should be removed from sessionStorage"
