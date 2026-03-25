"""
LLM Client for Commander V3
Wrapper for OpenAI and Anthropic APIs with unified interface.
"""

import os
from typing import Dict, List, Optional, Union
from enum import Enum


class LLMProvider(Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


class LLMClient:
    """
    Unified client for LLM APIs.
    Supports OpenAI GPT-4 and Anthropic Claude.
    """
    
    def __init__(self, provider: LLMProvider = LLMProvider.OPENAI):
        """
        Initialize LLM client.
        
        Args:
            provider: Which LLM provider to use
        """
        self.provider = provider
        self.client = None
        
        if provider == LLMProvider.OPENAI:
            try:
                from openai import OpenAI
                api_key = os.getenv('OPENAI_API_KEY')
                if not api_key:
                    print("Warning: OPENAI_API_KEY not set")
                self.client = OpenAI(api_key=api_key) if api_key else None
                self.model = "gpt-4-turbo-preview"
            except ImportError:
                print("OpenAI package not installed")
                
        elif provider == LLMProvider.ANTHROPIC:
            try:
                from anthropic import Anthropic
                api_key = os.getenv('ANTHROPIC_API_KEY')
                if not api_key:
                    print("Warning: ANTHROPIC_API_KEY not set")
                self.client = Anthropic(api_key=api_key) if api_key else None
                self.model = "claude-3-5-sonnet-20241022"
            except ImportError:
                print("Anthropic package not installed")
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Optional[str]:
        """
        Send chat completion request.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum response length
            
        Returns:
            Assistant's response text or None if error
        """
        if not self.client:
            return None
        
        try:
            if self.provider == LLMProvider.OPENAI:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content
                
            elif self.provider == LLMProvider.ANTHROPIC:
                # Anthropic uses different format
                system_msg = next((m['content'] for m in messages if m['role'] == 'system'), None)
                user_messages = [m for m in messages if m['role'] != 'system']
                
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_msg if system_msg else "",
                    messages=user_messages
                )
                return response.content[0].text
                
        except Exception as e:
            print(f"LLM API error: {e}")
            return None
    
    def generate_completion(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Optional[str]:
        """
        Simple completion generation.
        
        Args:
            prompt: Input prompt
            temperature: Sampling temperature
            max_tokens: Maximum response length
            
        Returns:
            Generated text or None if error
        """
        messages = [{"role": "user", "content": prompt}]
        return self.chat(messages, temperature, max_tokens)
    
    def is_available(self) -> bool:
        """Check if LLM client is properly configured."""
        return self.client is not None
