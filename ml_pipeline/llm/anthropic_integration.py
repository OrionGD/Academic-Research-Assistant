"""
Anthropic Claude LLM integration for ARAS.
Handles interactions with Anthropic's Claude models.
"""

import os
import json
from typing import List, Dict, Any, Optional, Union, AsyncGenerator
import anthropic
from anthropic import Anthropic, AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
from datetime import datetime
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnthropicLLM:
    """
    Anthropic Claude LLM integration.
    Supports both synchronous and asynchronous operations.
    """
    
    # Available models with their properties
    AVAILABLE_MODELS = {
        "claude-3-opus-20240229": {
            "context_window": 200000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 15.00,
            "cost_output_per_1m": 75.00,
            "description": "Most powerful Claude model"
        },
        "claude-3-sonnet-20240229": {
            "context_window": 200000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 3.00,
            "cost_output_per_1m": 15.00,
            "description": "Balanced performance and cost"
        },
        "claude-3-haiku-20240307": {
            "context_window": 200000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 0.25,
            "cost_output_per_1m": 1.25,
            "description": "Fastest and most affordable"
        },
        "claude-2.1": {
            "context_window": 200000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 8.00,
            "cost_output_per_1m": 24.00,
            "description": "Previous generation Claude"
        },
        "claude-2.0": {
            "context_window": 100000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 8.00,
            "cost_output_per_1m": 24.00,
            "description": "Previous generation Claude"
        },
        "claude-instant-1.2": {
            "context_window": 100000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 0.80,
            "cost_output_per_1m": 2.40,
            "description": "Fast Claude model"
        }
    }
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-3-sonnet-20240229",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        top_p: float = 1.0,
        top_k: int = 0,
        timeout: float = 60.0,
        max_retries: int = 3
    ):
        """
        Initialize Anthropic LLM.
        
        Args:
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
            model: Model name to use
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            top_k: Top-k sampling parameter
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.")
        
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens or self.get_model_info().get("max_output_tokens", 4096)
        self.top_p = top_p
        self.top_k = top_k
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Initialize clients
        client_kwargs = {
            "api_key": self.api_key,
            "timeout": timeout,
            "max_retries": max_retries
        }
        
        self.client = Anthropic(**client_kwargs)
        self.async_client = AsyncAnthropic(**client_kwargs)
        
        logger.info(f"Initialized Anthropic LLM with model: {model}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate text from a prompt.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            **kwargs: Additional parameters to override defaults
            
        Returns:
            Generated text
        """
        messages = []
        if system_message:
            # Claude uses system parameter for system messages
            return self._create_message(prompt, system_message, **kwargs)
        
        messages.append({"role": "user", "content": prompt})
        
        return self.chat(messages, **kwargs)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def chat(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate chat response.
        
        Args:
            messages: List of messages (role, content)
            system: Optional system prompt
            **kwargs: Additional parameters to override defaults
            
        Returns:
            Generated response
        """
        # Prepare request parameters
        request_params = self._prepare_request_params(kwargs)
        request_params["messages"] = messages
        
        if system:
            request_params["system"] = system
        
        try:
            response = self.client.messages.create(**request_params)
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Error in chat completion: {str(e)}")
            raise
    
    def _create_message(
        self,
        prompt: str,
        system: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Create a simple message with optional system prompt.
        
        Args:
            prompt: User prompt
            system: System message
            **kwargs: Additional parameters
            
        Returns:
            Generated response
        """
        request_params = self._prepare_request_params(kwargs)
        request_params["messages"] = [{"role": "user", "content": prompt}]
        
        if system:
            request_params["system"] = system
        
        try:
            response = self.client.messages.create(**request_params)
            return response.content[0].text
        except Exception as e:
            logger.error(f"Error creating message: {str(e)}")
            raise
    
    async def generate_async(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously generate text from a prompt.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        if system_message:
            return await self._create_message_async(prompt, system_message, **kwargs)
        
        messages = [{"role": "user", "content": prompt}]
        return await self.chat_async(messages, **kwargs)
    
    async def chat_async(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously generate chat response.
        
        Args:
            messages: List of messages
            system: Optional system prompt
            **kwargs: Additional parameters
            
        Returns:
            Generated response
        """
        request_params = self._prepare_request_params(kwargs)
        request_params["messages"] = messages
        
        if system:
            request_params["system"] = system
        
        try:
            response = await self.async_client.messages.create(**request_params)
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Error in async chat completion: {str(e)}")
            raise
    
    async def _create_message_async(
        self,
        prompt: str,
        system: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously create a simple message.
        
        Args:
            prompt: User prompt
            system: System message
            **kwargs: Additional parameters
            
        Returns:
            Generated response
        """
        request_params = self._prepare_request_params(kwargs)
        request_params["messages"] = [{"role": "user", "content": prompt}]
        
        if system:
            request_params["system"] = system
        
        try:
            response = await self.async_client.messages.create(**request_params)
            return response.content[0].text
        except Exception as e:
            logger.error(f"Error creating async message: {str(e)}")
            raise
    
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat responses.
        
        Args:
            messages: List of messages
            system: Optional system prompt
            **kwargs: Additional parameters
            
        Yields:
            Chunks of generated text
        """
        request_params = self._prepare_request_params(kwargs)
        request_params["messages"] = messages
        
        if system:
            request_params["system"] = system
        
        try:
            async with self.async_client.messages.stream(**request_params) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            logger.error(f"Error in stream chat: {str(e)}")
            raise
    
    def _prepare_request_params(self, kwargs: Dict) -> Dict:
        """
        Prepare request parameters with defaults and overrides.
        
        Args:
            kwargs: Override parameters
            
        Returns:
            Complete request parameters
        """
        params = {
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p,
            "top_k": self.top_k
        }
        
        # Update with any provided kwargs
        params.update(kwargs)
        
        return params
    
    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int
    ) -> Dict[str, float]:
        """
        Estimate cost for a request.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Expected output tokens
            
        Returns:
            Cost estimate
        """
        model_info = self.get_model_info()
        
        input_cost = (input_tokens / 1_000_000) * model_info["cost_input_per_1m"]
        output_cost = (output_tokens / 1_000_000) * model_info["cost_output_per_1m"]
        
        return {
            "model": self.model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "input_cost_usd": input_cost,
            "output_cost_usd": output_cost,
            "total_cost_usd": input_cost + output_cost
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Model information
        """
        if self.model in self.AVAILABLE_MODELS:
            return self.AVAILABLE_MODELS[self.model]
        else:
            return {
                "context_window": 200000,
                "max_output_tokens": 4096,
                "cost_input_per_1m": 3.00,
                "cost_output_per_1m": 15.00,
                "description": "Unknown model, using Claude-3 Sonnet defaults"
            }
    
    def create_rag_prompt(
        self,
        query: str,
        context_chunks: List[str],
        system_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a RAG prompt with context.
        
        Args:
            query: User query
            context_chunks: Retrieved context chunks
            system_message: Optional system message
            
        Returns:
            Dictionary with messages and system prompt
        """
        # Build context section
        context_text = "\n\n".join([
            f"<document index={i+1}>\n{chunk}\n</document>"
            for i, chunk in enumerate(context_chunks)
        ])
        
        # System message
        system = system_message or """You are a helpful assistant that answers questions based on the provided context documents. 
        Use only the information from the context to answer the question. 
        If the context doesn't contain the answer, say so politely.
        Always cite the relevant document numbers in your answer using <citation> tags."""
        
        # User message with context and query
        user_message = f"""Please answer the question based on the following context documents:

{context_text}

Question: {query}

Answer the question using only the information from the context documents above. If the answer cannot be found in the context, say so."""
        
        return {
            "messages": [{"role": "user", "content": user_message}],
            "system": system
        }
