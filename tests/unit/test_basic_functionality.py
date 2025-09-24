import pytest
import json
import os


class TestBasicFunctionality:
    """Basic unit tests for core functionality"""
    
    def test_environment_variables(self):
        """Test environment variable handling"""
        # Test setting and getting environment variables
        test_key = "TEST_CHATBOT_VAR"
        test_value = "test_value"
        
        os.environ[test_key] = test_value
        assert os.environ.get(test_key) == test_value
        
        # Clean up
        del os.environ[test_key]

    def test_json_handling(self):
        """Test JSON serialization and deserialization"""
        test_data = {
            "session_id": "test-session-123",
            "user_id": "test-user",
            "message": "Hello, chatbot!",
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
        # Test serialization
        json_string = json.dumps(test_data)
        assert isinstance(json_string, str)
        
        # Test deserialization
        parsed_data = json.loads(json_string)
        assert parsed_data == test_data
        assert parsed_data["session_id"] == "test-session-123"

    def test_string_operations(self):
        """Test string manipulation functions"""
        test_message = "Hello, World!"
        
        # Test basic string operations
        assert test_message.lower() == "hello, world!"
        assert test_message.upper() == "HELLO, WORLD!"
        assert len(test_message) == 13
        assert "World" in test_message

    def test_list_operations(self):
        """Test list manipulation"""
        test_list = ["apple", "banana", "cherry"]
        
        # Test list operations
        assert len(test_list) == 3
        assert "banana" in test_list
        
        # Test list modification
        test_list.append("date")
        assert len(test_list) == 4
        assert test_list[-1] == "date"

    def test_dictionary_operations(self):
        """Test dictionary operations"""
        test_dict = {
            "name": "ChatBot",
            "version": "1.0.0",
            "features": ["chat", "rag", "bedrock"]
        }
        
        # Test dictionary access
        assert test_dict["name"] == "ChatBot"
        assert test_dict.get("version") == "1.0.0"
        assert test_dict.get("nonexistent", "default") == "default"
        
        # Test dictionary modification
        test_dict["status"] = "active"
        assert "status" in test_dict
        assert test_dict["status"] == "active"
