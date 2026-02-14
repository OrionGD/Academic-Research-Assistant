"""
OpenAI LLM integration for ARAS.
Handles interactions with OpenAI's chat and completion models.
"""

import os
import json
from typing import List, Dict, Any, Optional, Union, AsyncGenerator
import openai
from openai import OpenAI, AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
import tiktoken
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OpenAILLM:
    """
    OpenAI LLM integration for chat and completions.
    Supports both synchronous and asynchronous operations.
    """
    
    # Available models with their properties
    AVAILABLE_MODELS = {
        "gpt-4-turbo-preview": {
            "context_window": 128000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 10.00,
            "cost_output_per_1m": 30.00,
            "description": "Latest GPT-4 Turbo model"
        },
        "gpt-4-0125-preview": {
            "context_window": 128000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 10.00,
            "cost_output_per_1m": 30.00,
            "description": "GPT-4 Turbo preview"
        },
        "gpt-4-1106-preview": {
            "context_window": 128000,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 10.00,
            "cost_output_per_1m": 30.00,
            "description": "GPT-4 Turbo preview"
        },
        "gpt-4": {
            "context_window": 8192,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 30.00,
            "cost_output_per_1m": 60.00,
            "description": "GPT-4 base model"
        },
        "gpt-3.5-turbo-0125": {
            "context_window": 16385,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 0.50,
            "cost_output_per_1m": 1.50,
            "description": "Latest GPT-3.5 Turbo"
        },
        "gpt-3.5-turbo-1106": {
            "context_window": 16385,
            "max_output_tokens": 4096,
            "cost_input_per_1m": 1.00,
            "cost_output_per_1m": 2.00,
            "description": "GPT-3.5 Turbo"
        }
    }
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4-turbo-preview",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        organization: Optional[str] = None,
        timeout: float = 60.0,
        max_retries: int = 3
    ):
        """
        Initialize OpenAI LLM.
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
            model: Model name to use
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            frequency_penalty: Frequency penalty (-2 to 2)
            presence_penalty: Presence penalty (-2 to 2)
            organization: Organization ID
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable.")
        
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens or self.get_model_info().get("max_output_tokens", 4096)
        self.top_p = top_p
        self.frequency_penalty = frequency_penalty
        self.presence_penalty = presence_penalty
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Initialize clients
        client_kwargs = {
            "api_key": self.api_key,
            "timeout": timeout,
            "max_retries": max_retries
        }
        if organization:
            client_kwargs["organization"] = organization
        
        self.client = OpenAI(**client_kwargs)
        self.async_client = AsyncOpenAI(**client_kwargs)
        
        # Initialize tokenizer
        try:
            self.tokenizer = tiktoken.encoding_for_model(model)
        except:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        logger.info(f"Initialized OpenAI LLM with model: {model}")
    
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
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        return self.chat(messages, **kwargs)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def chat(
        self,
        messages: List[Dict[str, str]],
        functions: Optional[List[Dict]] = None,
        function_call: Optional[Union[str, Dict]] = None,
        **kwargs
    ) -> str:
        """
        Generate chat response.
        
        Args:
            messages: List of messages (role, content)
            functions: Optional function definitions
            function_call: Function calling behavior
            **kwargs: Additional parameters to override defaults
            
        Returns:
            Generated response
        """
        # Prepare request parameters
        request_params = self._prepare_request_params(kwargs)
        
        # Add messages
        request_params["messages"] = messages
        
        # Add functions if provided
        if functions:
            request_params["functions"] = functions
        if function_call:
            request_params["function_call"] = function_call
        
        try:
            response = self.client.chat.completions.create(**request_params)
            
            # Extract response
            message = response.choices[0].message
            
            # Check for function call
            if message.function_call:
                return json.dumps({
                    "function_call": {
                        "name": message.function_call.name,
                        "arguments": message.function_call.arguments
                    }
                })
            
            return message.content or ""
            
        except Exception as e:
            logger.error(f"Error in chat completion: {str(e)}")
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
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        return await self.chat_async(messages, **kwargs)
    
    async def chat_async(
        self,
        messages: List[Dict[str, str]],
        functions: Optional[List[Dict]] = None,
        function_call: Optional[Union[str, Dict]] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously generate chat response.
        
        Args:
            messages: List of messages
            functions: Optional function definitions
            function_call: Function calling behavior
            **kwargs: Additional parameters
            
        Returns:
            Generated response
        """
        request_params = self._prepare_request_params(kwargs)
        request_params["messages"] = messages
        
        if functions:
            request_params["functions"] = functions
        if function_call:
            request_params["function_call"] = function_call
        
        try:
            response = await self.async_client.chat.completions.create(**request_params)
            
            message = response.choices[0].message
            
            if message.function_call:
                return json.dumps({
                    "function_call": {
                        "name": message.function_call.name,
                        "arguments": message.function_call.arguments
                    }
                })
            
            return message.content or ""
            
        except Exception as e:
            logger.error(f"Error in async chat completion: {str(e)}")
            raise
    
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat responses.
        
        Args:
            messages: List of messages
            **kwargs: Additional parameters
            
        Yields:
            Chunks of generated text
        """
        request_params = self._prepare_request_params(kwargs)
        request_params["messages"] = messages
        request_params["stream"] = True
        
        try:
            stream = await self.async_client.chat.completions.create(**request_params)
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
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
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty
        }
        
        # Update with any provided kwargs
        params.update(kwargs)
        
        return params
    
    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text.
        
        Args:
            text: Input text
            
        Returns:
            Number of tokens
        """
        return len(self.tokenizer.encode(text))
    
    def count_message_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Count tokens in messages.
        
        Args:
            messages: List of messages
            
        Returns:
            Total token count
        """
        total_tokens = 0
        for message in messages:
            total_tokens += self.count_tokens(message.get("content", ""))
            total_tokens += 4  # Message overhead
        total_tokens += 2  # Reply overhead
        
        return total_tokens
    
    def estimate_cost(
        self,
        messages: List[Dict[str, str]],
        response_tokens: int
    ) -> Dict[str, float]:
        """
        Estimate cost for a request.
        
        Args:
            messages: Input messages
            response_tokens: Expected response tokens
            
        Returns:
            Cost estimate
        """
        model_info = self.get_model_info()
        input_tokens = self.count_message_tokens(messages)
        
        input_cost = (input_tokens / 1_000_000) * model_info["cost_input_per_1m"]
        output_cost = (response_tokens / 1_000_000) * model_info["cost_output_per_1m"]
        
        return {
            "model": self.model,
            "input_tokens": input_tokens,
            "response_tokens": response_tokens,
            "total_tokens": input_tokens + response_tokens,
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
                "context_window": 128000,
                "max_output_tokens": 4096,
                "cost_input_per_1m": 10.00,
                "cost_output_per_1m": 30.00,
                "description": "Unknown model, using defaults"
            }
    
    def create_rag_prompt(
        self,
        query: str,
        context_chunks: List[str],
        system_message: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """
        Create a RAG prompt with context.
        
        Args:
            query: User query
            context_chunks: Retrieved context chunks
            system_message: Optional system message
            
        Returns:
            Messages list for chat
        """
        messages = []
        
        # System message
        if system_message:
            messages.append({"role": "system", "content": system_message})
        else:
            messages.append({
                "role": "system",
                "content": """You are a helpful assistant that answers questions based on the provided context. 
                Use only the information from the context to answer the question. 
                If the context doesn't contain the answer, say so politely.
                Always cite the relevant parts of the context in your answer."""
            })
        
        # Build context section
        context_text = "\n\n".join([
            f"[Context {i+1}]: {chunk}" 
            for i, chunk in enumerate(context_chunks)
        ])
        
        # User message with context and query
        user_message = f"""Context:
{context_text}

Question: {query}

Please answer the question based on the context provided above."""
        
        messages.append({"role": "user", "content": user_message})
        
        return messages
