"""
LLM Service - Abstracts LLM provider integrations.
Supports multiple providers, handles API rate limiting, response streaming, and cost optimization.
"""

import logging
import time
import asyncio
from typing import List, Optional, Dict, Any, AsyncGenerator, Union
from dataclasses import dataclass
from enum import Enum
import json

import openai
import anthropic
from anthropic import Anthropic
import google.generativeai as genai
from huggingface_hub import InferenceClient
from groq import Groq

from app.core.config import settings
from app.utils.cache_manager import CacheManager
from app.utils.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    HUGGINGFACE = "huggingface"
    GROQ = "groq"
    LOCAL = "local"
    AZURE_OPENAI = "azure_openai"


class LLMModel(str, Enum):
    """Supported LLM models"""
    # OpenAI
    GPT4_TURBO = "gpt-4-turbo-preview"
    GPT4 = "gpt-4"
    GPT35_TURBO = "gpt-3.5-turbo"
    
    # Anthropic
    CLAUDE3_OPUS = "claude-3-opus-20240229"
    CLAUDE3_SONNET = "claude-3-sonnet-20240229"
    CLAUDE3_HAIKU = "claude-3-haiku-20240307"
    
    # Google
    GEMINI_PRO = "gemini-pro"
    GEMINI_ULTRA = "gemini-ultra"
    
    # Hugging Face (example models)
    MISTRAL_7B = "mistralai/Mistral-7B-Instruct-v0.2"
    LLAMA2_70B = "meta-llama/Llama-2-70b-chat-hf"
    
    # Groq
    MIXTRAL_8X7B = "mixtral-8x7b-32768"
    LLAMA3_70B = "llama3-70b-8192"


@dataclass
class LLMConfig:
    """Configuration for LLM service"""
    provider: LLMProvider = LLMProvider.OPENAI
    model: LLMModel = LLMModel.GPT35_TURBO
    temperature: float = 0.7
    max_tokens: int = 1000
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    timeout: int = 30
    max_retries: int = 3
    cache_responses: bool = True
    stream: bool = False


@dataclass
class LLMResponse:
    """LLM response object"""
    content: str
    model: str
    provider: str
    usage: Dict[str, Any]
    latency_ms: float
    cached: bool = False


@dataclass
class TokenUsage:
    """Token usage tracking"""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0


class LLMService:
    """Service for LLM operations with multi-provider support"""
    
    # Model pricing (per 1K tokens) - approximate costs
    MODEL_PRICING = {
        # OpenAI
        "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-3.5-turbo": {"input": 0.001, "output": 0.002},
        
        # Anthropic
        "claude-3-opus-20240229": {"input": 0.015, "output": 0.075},
        "claude-3-sonnet-20240229": {"input": 0.003, "output": 0.015},
        "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
        
        # Google (approximate)
        "gemini-pro": {"input": 0.0005, "output": 0.0015},
        
        # Others (placeholder)
        "default": {"input": 0.001, "output": 0.002},
    }
    
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()
        self.cache = CacheManager(namespace="llm_responses")
        self.rate_limiter = RateLimiter(
            requests_per_minute=self._get_rate_limit(),
            burst_size=5
        )
        
        # Initialize provider clients
        self._initialize_clients()
        
        # Track usage
        self.total_usage = TokenUsage()
        
    def _get_rate_limit(self) -> int:
        """Get rate limit based on provider"""
        limits = {
            LLMProvider.OPENAI: 60,
            LLMProvider.ANTHROPIC: 40,
            LLMProvider.GOOGLE: 60,
            LLMProvider.HUGGINGFACE: 30,
            LLMProvider.GROQ: 50,
            LLMProvider.LOCAL: 1000,  # Local is less restricted
            LLMProvider.AZURE_OPENAI: 120,
        }
        return limits.get(self.config.provider, 60)
    
    def _initialize_clients(self):
        """Initialize provider clients"""
        self.clients = {}
        
        try:
            # OpenAI
            if settings.OPENAI_API_KEY:
                self.clients[LLMProvider.OPENAI] = openai.OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    timeout=self.config.timeout
                )
            
            # Anthropic
            if settings.ANTHROPIC_API_KEY:
                self.clients[LLMProvider.ANTHROPIC] = Anthropic(
                    api_key=settings.ANTHROPIC_API_KEY
                )
            
            # Google
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.clients[LLMProvider.GOOGLE] = genai
            
            # Hugging Face
            if settings.HUGGINGFACE_API_KEY:
                self.clients[LLMProvider.HUGGINGFACE] = InferenceClient(
                    provider="hf-inference",
                    token=settings.HUGGINGFACE_API_KEY
                )
            
            # Groq
            if settings.GROQ_API_KEY:
                self.clients[LLMProvider.GROQ] = Groq(
                    api_key=settings.GROQ_API_KEY
                )
            
            # Azure OpenAI
            if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
                self.clients[LLMProvider.AZURE_OPENAI] = openai.AzureOpenAI(
                    api_key=settings.AZURE_OPENAI_API_KEY,
                    api_version="2023-12-01-preview",
                    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
                )
            
            # Local (Ollama, etc.)
            # This would be configured separately
            
            logger.info(f"Initialized LLM clients for providers: {list(self.clients.keys())}")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM clients: {str(e)}")
            raise
    
    async def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config_override: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """
        Generate a response from the LLM.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            config_override: Optional configuration overrides
            **kwargs: Additional parameters
        
        Returns:
            LLM response text
        """
        # Merge config with overrides
        config = self._merge_config(config_override, kwargs)
        
        # Check cache
        cache_key = None
        if config.cache_responses:
            cache_key = self._generate_cache_key(prompt, system_prompt, config)
            cached_response = self.cache.get(cache_key)
            if cached_response:
                logger.debug(f"Cache hit for LLM response: {cache_key[:50]}...")
                return cached_response['content']
        
        # Apply rate limiting
        await self.rate_limiter.acquire()
        
        # Generate response
        start_time = time.time()
        
        try:
            if config.provider == LLMProvider.OPENAI:
                response_text = await self._generate_openai(prompt, system_prompt, config)
            elif config.provider == LLMProvider.ANTHROPIC:
                response_text = await self._generate_anthropic(prompt, system_prompt, config)
            elif config.provider == LLMProvider.GOOGLE:
                response_text = await self._generate_google(prompt, system_prompt, config)
            elif config.provider == LLMProvider.HUGGINGFACE:
                response_text = await self._generate_huggingface(prompt, system_prompt, config)
            elif config.provider == LLMProvider.GROQ:
                response_text = await self._generate_groq(prompt, system_prompt, config)
            elif config.provider == LLMProvider.AZURE_OPENAI:
                response_text = await self._generate_azure_openai(prompt, system_prompt, config)
            elif config.provider == LLMProvider.LOCAL:
                response_text = await self._generate_local(prompt, system_prompt, config)
            else:
                raise ValueError(f"Unsupported provider: {config.provider}")
            
            latency = (time.time() - start_time) * 1000
            
            # Cache response
            if cache_key and config.cache_responses:
                self.cache.set(cache_key, {
                    'content': response_text,
                    'model': config.model.value,
                    'provider': config.provider.value,
                    'timestamp': time.time()
                }, ttl=3600)  # Cache for 1 hour
            
            logger.info(f"Generated LLM response in {latency:.2f}ms using {config.provider}/{config.model}")
            return response_text
            
        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            raise
    
    async def generate_response_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config_override: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM response token by token.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            config_override: Optional configuration overrides
            **kwargs: Additional parameters
        
        Yields:
            Response chunks
        """
        config = self._merge_config(config_override, kwargs)
        config.stream = True
        
        # Apply rate limiting
        await self.rate_limiter.acquire()
        
        try:
            if config.provider == LLMProvider.OPENAI:
                async for chunk in self._generate_openai_stream(prompt, system_prompt, config):
                    yield chunk
            elif config.provider == LLMProvider.ANTHROPIC:
                async for chunk in self._generate_anthropic_stream(prompt, system_prompt, config):
                    yield chunk
            elif config.provider == LLMProvider.GOOGLE:
                async for chunk in self._generate_google_stream(prompt, system_prompt, config):
                    yield chunk
            elif config.provider == LLMProvider.GROQ:
                async for chunk in self._generate_groq_stream(prompt, system_prompt, config):
                    yield chunk
            else:
                # Fallback: generate full response and yield chunks
                response = await self.generate_response(prompt, system_prompt, config_override, **kwargs)
                for i in range(0, len(response), 50):
                    yield response[i:i+50]
                    
        except Exception as e:
            logger.error(f"LLM stream generation failed: {str(e)}")
            yield f"Error: {str(e)}"
    
    def _merge_config(self, config_override: Optional[Dict[str, Any]], kwargs: Dict[str, Any]) -> LLMConfig:
        """Merge configuration with overrides"""
        config_dict = self.config.__dict__.copy()
        
        if config_override:
            config_dict.update(config_override)
        
        # Update with kwargs (higher priority)
        for key, value in kwargs.items():
            if key in config_dict:
                config_dict[key] = value
        
        return LLMConfig(**config_dict)
    
    def _generate_cache_key(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate cache key for LLM response"""
        import hashlib
        
        key_data = {
            'prompt': prompt,
            'system_prompt': system_prompt,
            'model': config.model.value,
            'provider': config.provider.value,
            'temperature': config.temperature,
            'max_tokens': config.max_tokens,
            'top_p': config.top_p,
        }
        
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    async def _generate_openai(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate response using OpenAI"""
        client = self.clients.get(LLMProvider.OPENAI)
        if not client:
            raise ValueError("OpenAI client not initialized")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = client.chat.completions.create(
                model=config.model.value,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty,
                timeout=config.timeout
            )
            
            # Update usage tracking
            usage = response.usage
            self._update_usage(usage.prompt_tokens, usage.completion_tokens, config.model.value)
            
            return response.choices[0].message.content
            
        except openai.RateLimitError:
            logger.warning("OpenAI rate limit exceeded")
            await asyncio.sleep(2)  # Wait before retry
            raise
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    async def _generate_openai_stream(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> AsyncGenerator[str, None]:
        """Stream response using OpenAI"""
        client = self.clients.get(LLMProvider.OPENAI)
        if not client:
            raise ValueError("OpenAI client not initialized")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            stream = client.chat.completions.create(
                model=config.model.value,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                stream=True,
                timeout=config.timeout
            )
            
            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
            
            # Note: streaming doesn't provide token usage
            # We'll estimate usage
            estimated_tokens = len(full_response.split()) * 1.3  # Rough estimate
            self._update_usage(len(prompt.split()) * 1.3, estimated_tokens, config.model.value)
            
        except Exception as e:
            logger.error(f"OpenAI stream error: {str(e)}")
            raise
    
    async def _generate_anthropic(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate response using Anthropic Claude"""
        client = self.clients.get(LLMProvider.ANTHROPIC)
        if not client:
            raise ValueError("Anthropic client not initialized")
        
        try:
            message = client.messages.create(
                model=config.model.value,
                max_tokens=config.max_tokens,
                temperature=config.temperature,
                system=system_prompt or "",
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Update usage tracking
            # Anthropic provides token counts in response
            input_tokens = message.usage.input_tokens
            output_tokens = message.usage.output_tokens
            self._update_usage(input_tokens, output_tokens, config.model.value)
            
            return message.content[0].text
            
        except anthropic.RateLimitError:
            logger.warning("Anthropic rate limit exceeded")
            await asyncio.sleep(2)
            raise
        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}")
            raise
    
    async def _generate_anthropic_stream(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> AsyncGenerator[str, None]:
        """Stream response using Anthropic Claude"""
        client = self.clients.get(LLMProvider.ANTHROPIC)
        if not client:
            raise ValueError("Anthropic client not initialized")
        
        try:
            with client.messages.stream(
                model=config.model.value,
                max_tokens=config.max_tokens,
                temperature=config.temperature,
                system=system_prompt or "",
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                for text in stream.text_stream:
                    yield text
            
            # Note: Need to get final message for token counts
            # For now, estimate usage
            estimated_input = len(prompt.split()) * 1.3
            estimated_output = 0  # Can't estimate without final message
            self._update_usage(estimated_input, estimated_output, config.model.value)
            
        except Exception as e:
            logger.error(f"Anthropic stream error: {str(e)}")
            raise
    
    async def _generate_google(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate response using Google Gemini"""
        client = self.clients.get(LLMProvider.GOOGLE)
        if not client:
            raise ValueError("Google client not initialized")
        
        try:
            # Configure the model
            model = genai.GenerativeModel(
                model_name=config.model.value,
                system_instruction=system_prompt
            )
            
            # Generate response
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": config.temperature,
                    "top_p": config.top_p,
                    "max_output_tokens": config.max_tokens,
                }
            )
            
            # Update usage tracking (Gemini doesn't provide token counts in free tier)
            estimated_input = len(prompt.split()) * 1.3
            estimated_output = len(response.text.split()) * 1.3
            self._update_usage(estimated_input, estimated_output, config.model.value)
            
            return response.text
            
        except Exception as e:
            logger.error(f"Google Gemini API error: {str(e)}")
            raise
    
    async def _generate_google_stream(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> AsyncGenerator[str, None]:
        """Stream response using Google Gemini"""
        client = self.clients.get(LLMProvider.GOOGLE)
        if not client:
            raise ValueError("Google client not initialized")
        
        try:
            model = genai.GenerativeModel(
                model_name=config.model.value,
                system_instruction=system_prompt
            )
            
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": config.temperature,
                    "top_p": config.top_p,
                    "max_output_tokens": config.max_tokens,
                },
                stream=True
            )
            
            full_response = ""
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text
            
            # Estimate usage
            estimated_input = len(prompt.split()) * 1.3
            estimated_output = len(full_response.split()) * 1.3
            self._update_usage(estimated_input, estimated_output, config.model.value)
            
        except Exception as e:
            logger.error(f"Google Gemini stream error: {str(e)}")
            raise
    
    async def _generate_huggingface(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate response using Hugging Face Inference API"""
        client = self.clients.get(LLMProvider.HUGGINGFACE)
        if not client:
            raise ValueError("Hugging Face client not initialized")
        
        try:
            # Prepare prompt
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            
            response = client.text_generation(
                full_prompt,
                model=config.model.value,
                max_new_tokens=config.max_tokens,
                temperature=config.temperature,
                top_p=config.top_p
            )
            
            # Estimate usage
            estimated_input = len(full_prompt.split()) * 1.3
            estimated_output = len(response.split()) * 1.3
            self._update_usage(estimated_input, estimated_output, config.model.value)
            
            return response
            
        except Exception as e:
            logger.error(f"Hugging Face API error: {str(e)}")
            raise
    
    async def _generate_groq(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate response using Groq"""
        client = self.clients.get(LLMProvider.GROQ)
        if not client:
            raise ValueError("Groq client not initialized")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = client.chat.completions.create(
                model=config.model.value,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p
            )
            
            # Groq doesn't provide token counts in response yet
            estimated_input = len(prompt.split()) * 1.3
            estimated_output = len(response.choices[0].message.content.split()) * 1.3
            self._update_usage(estimated_input, estimated_output, config.model.value)
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            raise
    
    async def _generate_groq_stream(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> AsyncGenerator[str, None]:
        """Stream response using Groq"""
        client = self.clients.get(LLMProvider.GROQ)
        if not client:
            raise ValueError("Groq client not initialized")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            stream = client.chat.completions.create(
                model=config.model.value,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                stream=True
            )
            
            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
            
            # Estimate usage
            estimated_input = len(prompt.split()) * 1.3
            estimated_output = len(full_response.split()) * 1.3
            self._update_usage(estimated_input, estimated_output, config.model.value)
            
        except Exception as e:
            logger.error(f"Groq stream error: {str(e)}")
            raise
    
    async def _generate_azure_openai(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate response using Azure OpenAI"""
        client = self.clients.get(LLMProvider.AZURE_OPENAI)
        if not client:
            raise ValueError("Azure OpenAI client not initialized")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            # Azure deployment name might differ from model name
            deployment_name = settings.AZURE_OPENAI_DEPLOYMENT or config.model.value
            
            response = client.chat.completions.create(
                deployment_id=deployment_name,
                messages=messages,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty,
                timeout=config.timeout
            )
            
            # Update usage tracking
            usage = response.usage
            self._update_usage(usage.prompt_tokens, usage.completion_tokens, config.model.value)
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Azure OpenAI API error: {str(e)}")
            raise
    
    async def _generate_local(self, prompt: str, system_prompt: Optional[str], config: LLMConfig) -> str:
        """Generate response using local LLM (Ollama, etc.)"""
        # This is a placeholder for local LLM integration
        # Implementation would depend on your local setup
        
        # Example for Ollama:
        # import ollama
        # response = ollama.chat(model=config.model.value, messages=[...])
        # return response['message']['content']
        
        raise NotImplementedError("Local LLM integration not implemented")
    
    def _update_usage(self, prompt_tokens: int, completion_tokens: int, model_name: str):
        """Update token usage tracking"""
        self.total_usage.prompt_tokens += prompt_tokens
        self.total_usage.completion_tokens += completion_tokens
        self.total_usage.total_tokens += prompt_tokens + completion_tokens
        
        # Calculate cost
        pricing = self.MODEL_PRICING.get(model_name, self.MODEL_PRICING["default"])
        prompt_cost = (prompt_tokens / 1000) * pricing["input"]
        completion_cost = (completion_tokens / 1000) * pricing["output"]
        self.total_usage.cost_usd += prompt_cost + completion_cost
        
        logger.debug(f"Token usage: {prompt_tokens} input, {completion_tokens} output, cost: ${prompt_cost + completion_cost:.4f}")
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get usage statistics"""
        return {
            'prompt_tokens': self.total_usage.prompt_tokens,
            'completion_tokens': self.total_usage.completion_tokens,
            'total_tokens': self.total_usage.total_tokens,
            'cost_usd': round(self.total_usage.cost_usd, 4),
            'current_provider': self.config.provider.value,
            'current_model': self.config.model.value
        }
    
    def switch_provider(self, provider: LLMProvider, model: Optional[LLMModel] = None):
        """Switch to a different LLM provider"""
        if provider not in self.clients:
            raise ValueError(f"Provider {provider} not initialized")
        
        old_provider = self.config.provider
        self.config.provider = provider
        
        if model:
            self.config.model = model
        
        # Update rate limiter
        self.rate_limiter = RateLimiter(
            requests_per_minute=self._get_rate_limit(),
            burst_size=5
        )
        
        logger.info(f"Switched LLM provider from {old_provider} to {provider}")
    
    def list_available_providers(self) -> List[Dict[str, Any]]:
        """List available LLM providers and models"""
        providers = []
        
        for provider in LLMProvider:
            if provider in self.clients:
                provider_info = {
                    'provider': provider.value,
                    'models': []
                }
                
                # Add available models for this provider
                if provider == LLMProvider.OPENAI:
                    provider_info['models'] = [
                        LLMModel.GPT4_TURBO.value,
                        LLMModel.GPT4.value,
                        LLMModel.GPT35_TURBO.value
                    ]
                elif provider == LLMProvider.ANTHROPIC:
                    provider_info['models'] = [
                        LLMModel.CLAUDE3_OPUS.value,
                        LLMModel.CLAUDE3_SONNET.value,
                        LLMModel.CLAUDE3_HAIKU.value
                    ]
                elif provider == LLMProvider.GOOGLE:
                    provider_info['models'] = [
                        LLMModel.GEMINI_PRO.value,
                        LLMModel.GEMINI_ULTRA.value
                    ]
                elif provider == LLMProvider.GROQ:
                    provider_info['models'] = [
                        LLMModel.MIXTRAL_8X7B.value,
                        LLMModel.LLAMA3_70B.value
                    ]
                
                providers.append(provider_info)
        
        return providers
    
    def clear_cache(self) -> int:
        """Clear LLM response cache"""
        return self.cache.clear()
    
    def health_check(self) -> Dict[str, Any]:
        """Check health of LLM service"""
        health_status = {
            'provider': self.config.provider.value,
            'model': self.config.model.value,
            'cache_enabled': self.config.cache_responses,
            'rate_limiter_active': self.rate_limiter.is_active(),
            'clients_initialized': list(self.clients.keys()),
            'usage_stats': self.get_usage_stats()
        }
        
        # Test each provider
        for provider, client in self.clients.items():
            try:
                # Simple test based on provider
                if provider == LLMProvider.OPENAI:
                    # Try to list models (lightweight operation)
                    client.models.list()
                    health_status[f'{provider}_test'] = 'passed'
                else:
                    # For other providers, mark as available
                    health_status[f'{provider}_test'] = 'available'
            except Exception as e:
                health_status[f'{provider}_test'] = f'failed: {str(e)}'
        
        return health_status