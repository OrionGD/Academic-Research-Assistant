"""
Local LLM integration for ARAS.
Handles running LLMs locally using various backends (llama.cpp, Ollama, etc.)
"""

import os
import json
import subprocess
from typing import List, Dict, Any, Optional, Union, Generator
import logging
import requests
from pathlib import Path
import time
from datetime import datetime
import asyncio
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LocalLLM:
    """
    Local LLM integration supporting multiple backends:
    - Ollama
    - llama.cpp
    - Local HTTP endpoints
    """
    
    # Available backends
    BACKENDS = {
        "ollama": {
            "description": "Ollama local model runner",
            "default_port": 11434,
            "health_endpoint": "/api/tags"
        },
        "llama_cpp": {
            "description": "llama.cpp server",
            "default_port": 8080,
            "health_endpoint": "/health"
        },
        "custom": {
            "description": "Custom HTTP endpoint",
            "default_port": None,
            "health_endpoint": "/health"
        }
    }
    
    def __init__(
        self,
        backend: str = "ollama",
        model_name: str = "llama2",
        base_url: Optional[str] = None,
        port: Optional[int] = None,
        api_key: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        top_p: float = 0.95,
        top_k: int = 40,
        repeat_penalty: float = 1.1,
        num_ctx: int = 4096,
        num_predict: Optional[int] = None,
        stop: Optional[List[str]] = None
    ):
        """
        Initialize local LLM.
        
        Args:
            backend: Backend type ('ollama', 'llama_cpp', 'custom')
            model_name: Model name
            base_url: Base URL for API (if not using default)
            port: Port number
            api_key: API key (if required)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            top_k: Top-k sampling parameter
            repeat_penalty: Repetition penalty
            num_ctx: Context window size
            num_predict: Number of tokens to predict
            stop: Stop sequences
        """
        self.backend = backend
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.top_p = top_p
        self.top_k = top_k
        self.repeat_penalty = repeat_penalty
        self.num_ctx = num_ctx
        self.num_predict = num_predict or max_tokens
        self.stop = stop or []
        
        # Set up base URL
        if base_url:
            self.base_url = base_url.rstrip('/')
        else:
            backend_info = self.BACKENDS.get(backend, self.BACKENDS["custom"])
            port = port or backend_info["default_port"]
            if port:
                self.base_url = f"http://localhost:{port}"
            else:
                self.base_url = "http://localhost"
        
        self.api_key = api_key
        
        # Check backend availability
        self._check_backend()
        
        logger.info(f"Initialized Local LLM: {backend} - {model_name}")
    
    def _check_backend(self):
        """Check if backend is available."""
        backend_info = self.BACKENDS.get(self.backend, self.BACKENDS["custom"])
        health_endpoint = backend_info["health_endpoint"]
        
        try:
            response = requests.get(f"{self.base_url}{health_endpoint}", timeout=5)
            if response.status_code == 200:
                logger.info(f"Backend {self.backend} is available")
            else:
                logger.warning(f"Backend {self.backend} returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Backend {self.backend} may not be available: {e}")
            logger.info(f"Make sure {self.backend} is running at {self.base_url}")
    
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
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        if self.backend == "ollama":
            return self._generate_ollama(prompt, system_message, **kwargs)
        elif self.backend == "llama_cpp":
            return self._generate_llama_cpp(prompt, system_message, **kwargs)
        elif self.backend == "custom":
            return self._generate_custom(prompt, system_message, **kwargs)
        else:
            raise ValueError(f"Unsupported backend: {self.backend}")
    
    def _generate_ollama(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate using Ollama.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        url = f"{self.base_url}/api/generate"
        
        # Prepare messages for chat format
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", self.temperature),
                "num_predict": kwargs.get("max_tokens", self.max_tokens),
                "top_p": kwargs.get("top_p", self.top_p),
                "top_k": kwargs.get("top_k", self.top_k),
                "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty),
                "num_ctx": kwargs.get("num_ctx", self.num_ctx),
                "stop": kwargs.get("stop", self.stop)
            }
        }
        
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result.get("message", {}).get("content", "")
        except Exception as e:
            logger.error(f"Error generating with Ollama: {e}")
            raise
    
    def _generate_llama_cpp(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate using llama.cpp server.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        url = f"{self.base_url}/completion"
        
        # Format prompt with system message if provided
        if system_message:
            formatted_prompt = f"<s>[INST] <<SYS>>\n{system_message}\n<</SYS>>\n\n{prompt} [/INST]"
        else:
            formatted_prompt = prompt
        
        payload = {
            "prompt": formatted_prompt,
            "temperature": kwargs.get("temperature", self.temperature),
            "n_predict": kwargs.get("max_tokens", self.max_tokens),
            "top_p": kwargs.get("top_p", self.top_p),
            "top_k": kwargs.get("top_k", self.top_k),
            "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty),
            "stop": kwargs.get("stop", self.stop)
        }
        
        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result.get("content", "")
        except Exception as e:
            logger.error(f"Error generating with llama.cpp: {e}")
            raise
    
    def _generate_custom(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate using custom HTTP endpoint.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        url = f"{self.base_url}/generate"
        
        payload = {
            "prompt": prompt,
            "system": system_message,
            "temperature": kwargs.get("temperature", self.temperature),
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "top_p": kwargs.get("top_p", self.top_p),
            "top_k": kwargs.get("top_k", self.top_k),
            "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty),
            "stop": kwargs.get("stop", self.stop)
        }
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "") or result.get("text", "") or result.get("generated_text", "")
        except Exception as e:
            logger.error(f"Error generating with custom endpoint: {e}")
            raise
    
    def stream_generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> Generator[str, None, None]:
        """
        Stream generate text.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            **kwargs: Additional parameters
            
        Yields:
            Generated text chunks
        """
        if self.backend == "ollama":
            yield from self._stream_ollama(prompt, system_message, **kwargs)
        elif self.backend == "llama_cpp":
            yield from self._stream_llama_cpp(prompt, system_message, **kwargs)
        elif self.backend == "custom":
            yield from self._stream_custom(prompt, system_message, **kwargs)
        else:
            raise ValueError(f"Unsupported backend for streaming: {self.backend}")
    
    def _stream_ollama(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> Generator[str, None, None]:
        """
        Stream using Ollama.
        """
        url = f"{self.base_url}/api/generate"
        
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": kwargs.get("temperature", self.temperature),
                "num_predict": kwargs.get("max_tokens", self.max_tokens),
                "top_p": kwargs.get("top_p", self.top_p),
                "top_k": kwargs.get("top_k", self.top_k),
                "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty),
                "num_ctx": kwargs.get("num_ctx", self.num_ctx)
            }
        }
        
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        try:
            with requests.post(url, json=payload, headers=headers, stream=True, timeout=60) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        chunk = json.loads(line)
                        if chunk.get("message", {}).get("content"):
                            yield chunk["message"]["content"]
        except Exception as e:
            logger.error(f"Error streaming from Ollama: {e}")
            raise
    
    def _stream_llama_cpp(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> Generator[str, None, None]:
        """
        Stream using llama.cpp server.
        """
        url = f"{self.base_url}/completion"
        
        if system_message:
            formatted_prompt = f"<s>[INST] <<SYS>>\n{system_message}\n<</SYS>>\n\n{prompt} [/INST]"
        else:
            formatted_prompt = prompt
        
        payload = {
            "prompt": formatted_prompt,
            "temperature": kwargs.get("temperature", self.temperature),
            "n_predict": kwargs.get("max_tokens", self.max_tokens),
            "top_p": kwargs.get("top_p", self.top_p),
            "top_k": kwargs.get("top_k", self.top_k),
            "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty),
            "stream": True
        }
        
        try:
            with requests.post(url, json=payload, stream=True, timeout=60) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line and line.startswith(b"data: "):
                        data = json.loads(line[6:])
                        if data.get("content"):
                            yield data["content"]
        except Exception as e:
            logger.error(f"Error streaming from llama.cpp: {e}")
            raise
    
    def _stream_custom(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> Generator[str, None, None]:
        """
        Stream using custom endpoint.
        """
        url = f"{self.base_url}/stream"
        
        payload = {
            "prompt": prompt,
            "system": system_message,
            "temperature": kwargs.get("temperature", self.temperature),
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "top_p": kwargs.get("top_p", self.top_p),
            "top_k": kwargs.get("top_k", self.top_k),
            "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty)
        }
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        try:
            with requests.post(url, json=payload, headers=headers, stream=True, timeout=60) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        chunk = json.loads(line)
                        yield chunk.get("text", "")
        except Exception as e:
            logger.error(f"Error streaming from custom endpoint: {e}")
            raise
    
    async def generate_async(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously generate text.
        
        Args:
            prompt: User prompt
            system_message: Optional system message
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        async with aiohttp.ClientSession() as session:
            if self.backend == "ollama":
                return await self._generate_ollama_async(session, prompt, system_message, **kwargs)
            elif self.backend == "llama_cpp":
                return await self._generate_llama_cpp_async(session, prompt, system_message, **kwargs)
            elif self.backend == "custom":
                return await self._generate_custom_async(session, prompt, system_message, **kwargs)
            else:
                raise ValueError(f"Unsupported backend: {self.backend}")
    
    async def _generate_ollama_async(
        self,
        session: aiohttp.ClientSession,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously generate using Ollama.
        """
        url = f"{self.base_url}/api/generate"
        
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", self.temperature),
                "num_predict": kwargs.get("max_tokens", self.max_tokens),
                "top_p": kwargs.get("top_p", self.top_p),
                "top_k": kwargs.get("top_k", self.top_k),
                "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty)
            }
        }
        
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        async with session.post(url, json=payload, headers=headers) as response:
            response.raise_for_status()
            result = await response.json()
            return result.get("message", {}).get("content", "")
    
    async def _generate_llama_cpp_async(
        self,
        session: aiohttp.ClientSession,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously generate using llama.cpp.
        """
        url = f"{self.base_url}/completion"
        
        if system_message:
            formatted_prompt = f"<s>[INST] <<SYS>>\n{system_message}\n<</SYS>>\n\n{prompt} [/INST]"
        else:
            formatted_prompt = prompt
        
        payload = {
            "prompt": formatted_prompt,
            "temperature": kwargs.get("temperature", self.temperature),
            "n_predict": kwargs.get("max_tokens", self.max_tokens),
            "top_p": kwargs.get("top_p", self.top_p),
            "top_k": kwargs.get("top_k", self.top_k),
            "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty),
            "stream": False
        }
        
        async with session.post(url, json=payload) as response:
            response.raise_for_status()
            result = await response.json()
            return result.get("content", "")
    
    async def _generate_custom_async(
        self,
        session: aiohttp.ClientSession,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Asynchronously generate using custom endpoint.
        """
        url = f"{self.base_url}/generate"
        
        payload = {
            "prompt": prompt,
            "system": system_message,
            "temperature": kwargs.get("temperature", self.temperature),
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "top_p": kwargs.get("top_p", self.top_p),
            "top_k": kwargs.get("top_k", self.top_k),
            "repeat_penalty": kwargs.get("repeat_penalty", self.repeat_penalty)
        }
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        async with session.post(url, json=payload, headers=headers) as response:
            response.raise_for_status()
            result = await response.json()
            return result.get("response", "") or result.get("text", "") or result.get("generated_text", "")
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available models from the backend.
        
        Returns:
            List of model names
        """
        if self.backend == "ollama":
            return self._get_ollama_models()
        elif self.backend == "llama_cpp":
            return self._get_llama_cpp_models()
        else:
            return [self.model_name]
    
    def _get_ollama_models(self) -> List[str]:
        """
        Get available Ollama models.
        """
        url = f"{self.base_url}/api/tags"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        except Exception as e:
            logger.error(f"Error getting Ollama models: {e}")
            return []
    
    def _get_llama_cpp_models(self) -> List[str]:
        """
        Get available llama.cpp models (just the current one).
        """
        return [self.model_name]
    
    def pull_model(self, model_name: Optional[str] = None) -> bool:
        """
        Pull a model (Ollama only).
        
        Args:
            model_name: Name of model to pull (defaults to current model)
            
        Returns:
            True if successful
        """
        if self.backend != "ollama":
            logger.warning(f"Model pulling not supported for backend: {self.backend}")
            return False
        
        model = model_name or self.model_name
        url = f"{self.base_url}/api/pull"
        
        payload = {
            "name": model,
            "stream": False
        }
        
        try:
            response = requests.post(url, json=payload, timeout=300)  # Longer timeout for model download
            response.raise_for_status()
            logger.info(f"Successfully pulled model: {model}")
            return True
        except Exception as e:
            logger.error(f"Error pulling model {model}: {e}")
            return False
    
    def get_backend_info(self) -> Dict[str, Any]:
        """
        Get information about the current backend.
        
        Returns:
            Backend information
        """
        return {
            "backend": self.backend,
            "model_name": self.model_name,
            "base_url": self.base_url,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "num_ctx": self.num_ctx,
            "available_models": self.get_available_models()
        }