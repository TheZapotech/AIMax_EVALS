import os
from typing import Dict, Any, Optional
from datetime import datetime, UTC
import openai
from openai import OpenAI
import anthropic
import requests

class LLMConnector:
    """Base class for LLM API connections."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    async def get_response(self, prompt: str) -> Dict[str, Any]:
        """
        Get response from LLM.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement get_response")

class OpenAIConnector(LLMConnector):
    """Connector for OpenAI's API."""
    
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        super().__init__(api_key)
        self.client = OpenAI(api_key=api_key)
        self.model = model
        
    async def get_response(self, prompt: str) -> Dict[str, Any]:
        """Get response from OpenAI API."""
        try:
            start_time = datetime.now(UTC)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            end_time = datetime.now(UTC)
            response_time = (end_time - start_time).total_seconds()
            
            return {
                "content": response.choices[0].message.content,
                "model": self.model,
                "tokens": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens
                },
                "response_time": response_time,
                "timestamp": end_time.isoformat()
            }
            
        except Exception as e:
            print(f"Error getting OpenAI response: {str(e)}")
            raise

class AnthropicConnector(LLMConnector):
    """Connector for Anthropic's API."""
    
    def __init__(self, api_key: str, model: str = "claude-2"):
        super().__init__(api_key)
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model
        
    async def get_response(self, prompt: str) -> Dict[str, Any]:
        """Get response from Anthropic API."""
        try:
            start_time = datetime.now(UTC)
            
            response = self.client.messages.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            
            end_time = datetime.now(UTC)
            response_time = (end_time - start_time).total_seconds()
            
            return {
                "content": response.content[0].text,
                "model": self.model,
                "tokens": {
                    "total": response.usage.input_tokens + response.usage.output_tokens
                },
                "response_time": response_time,
                "timestamp": end_time.isoformat()
            }
            
        except Exception as e:
            print(f"Error getting Anthropic response: {str(e)}")
            raise

class LLMFactory:
    """Factory for creating LLM connectors."""
    
    @staticmethod
    def create_connector(provider: str, api_key: str, model: Optional[str] = None) -> LLMConnector:
        """
        Create an LLM connector based on provider.
        
        Args:
            provider (str): The LLM provider ("openai" or "anthropic")
            api_key (str): API key for the provider
            model (str, optional): Specific model to use
            
        Returns:
            LLMConnector: An instance of the appropriate connector
        """
        if provider == "openai":
            return OpenAIConnector(api_key, model or "gpt-3.5-turbo")
        elif provider == "anthropic":
            return AnthropicConnector(api_key, model or "claude-2")
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

# Example usage:
"""
# Create a connector
connector = LLMFactory.create_connector(
    provider="openai",
    api_key="your-api-key",
    model="gpt-4"
)

# Get response
response = await connector.get_response("What is 2+2?")
print(response)
"""
