"""
HuggingFace LLM integration for ARAS.
Handles interactions with HuggingFace models (both local and API-based).
"""

import os
import json
from typing import List, Dict, Any, Optional, Union, Generator
import logging
from datetime import datetime
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    pipeline,
    TextStreamer,
    BitsAndBytesConfig
)
import requests
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HuggingFaceLLM:
    """
    HuggingFace LLM integration.
    Supports both local models and Inference API.
    """
    
    # Recommended models for different use cases
    RECOMMENDED_MODELS = {
        "small": {
            "model_id": "microsoft/phi-2",
            "description": "2.7B parameter model, good for fast inference",
            "context_length": 2048,
            "requires_gpu": False
        },
        "medium": {
            "model_id": "mistralai/Mistral-7B-Instruct-v0.2",
            "description": "7B parameter instruct model, good balance",
            "context_length": 32768,
            "requires_gpu": True
        },
        "large": {
            "model_id": "meta-llama/Llama-2-13b-chat-hf",
            "description": "13B parameter chat model, high quality",
            "context_length": 4096,
            "requires_gpu": True
        },
        "xl": {
            "model_id": "meta-llama/Llama-2-70b-chat-hf",
            "description": "70B parameter model, best quality",
            "context_length": 4096,
            "requires_gpu": True
        },
        "code": {
            "model_id": "codellama/CodeLlama-7b-Instruct-hf",
            "description": "Specialized for code generation",
            "context_length": 16384,
            "requires_gpu": True
        },
        "instruct": {
            "model_id": "HuggingFaceH4/zephyr-7b-beta",
            "description": "Fine-tuned for instruction following",
            "context_length": 8192,
            "requires_gpu": True
        }
    }
    
    def __init__(
        self,
        model_id: str = "microsoft/phi-2",
        use_api: bool = False,
        api_token: Optional[str] = None,
        device: Optional[str] = None,
        quantize: bool = False,
        load_in_8bit: bool = False,
        load_in_4bit: bool = False,
        torch_dtype: Optional[torch.dtype] = None,
        max_length: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.95,
        top_k: int = 50,
        repetition_penalty: float = 1.1,
        do_sample: bool = True
    ):
        """
        Initialize HuggingFace LLM.
        
        Args:
            model_id: HuggingFace model ID
            use_api: Use Inference API instead of local model
            api_token: HuggingFace API token
            device: Device to use ('cuda', 'cpu', 'mps')
            quantize: Enable quantization
            load_in_8bit: Load model in 8-bit
            load_in_4bit: Load model in 4-bit
            torch_dtype: Torch dtype for model
            max_length: Maximum generation length
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            top_k: Top-k sampling parameter
            repetition_penalty: Repetition penalty
            do_sample: Whether to use sampling
        """
        self.model_id = model_id
        self.use_api = use_api
        self.api_token = api_token or os.getenv("HUGGINGFACE_TOKEN")
        self.max_length = max_length
        self.temperature = temperature
        self.top_p = top_p
        self.top_k = top_k
        self.repetition_penalty = repetition_penalty
        self.do_sample = do_sample
        
        # Set device
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
        
        if use_api:
            self._init_api()
        else:
            self._init_local_model(
                quantize=quantize,
                load_in_8bit=load_in_8bit,
                load_in_4bit=load_in_4bit,
                torch_dtype=torch_dtype
            )
        
        logger.info(f"Initialized HuggingFace LLM: {model_id} (API: {use_api})")
    
    def _init_api(self):
        """Initialize HuggingFace Inference API."""
        if not self.api_token:
            raise ValueError("API token required for HuggingFace Inference API")
        
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
        self.headers = {"Authorization": f"Bearer {self.api_token}"}
        
        logger.info(f"Using HuggingFace Inference API for {self.model_id}")
    
    def _init_local_model(
        self,
        quantize: bool = False,
        load_in_8bit: bool = False,
        load_in_4bit: bool = False,
        torch_dtype: Optional[torch.dtype] = None
    ):
        """
        Initialize local model.
        
        Args:
            quantize: Enable quantization
            load_in_8bit: Load in 8-bit
            load_in_4bit: Load in 4-bit
            torch_dtype: Torch dtype
        """
        logger.info(f"Loading local model {self.model_id} on {self.device}")
        
        # Prepare quantization config
        quantization_config = None
        if quantize or load_in_8bit or load_in_4bit:
            quantization_config = BitsAndBytesConfig(
                load_in_8bit=load_in_8bit,
                load_in_4bit=load_in_4bit,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4"
            )
        
        # Set torch dtype
        if torch_dtype is None:
            torch_dtype = torch.float16 if self.device == 'cuda' else torch.float32
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id,
            trust_remote_code=True
        )
        
        # Add padding token if missing
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            quantization_config=quantization_config,
            torch_dtype=torch_dtype,
            device_map="auto" if self.device == 'cuda' else None,
            trust_remote_code=True
        )
        
        if self.device != 'cuda':
            self.model = self.model.to(self.device)
        
        self.model.eval()
        
        logger.info(f"Model loaded successfully")
    
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
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        if self.use_api:
            return self._generate_api(prompt, **kwargs)
        else:
            return self._generate_local(prompt, system_message, **kwargs)
    
    def _generate_api(self, prompt: str, **kwargs) -> str:
        """
        Generate using HuggingFace Inference API.
        
        Args:
            prompt: Input prompt
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": kwargs.get("max_new_tokens", self.max_length),
                "temperature": kwargs.get("temperature", self.temperature),
                "top_p": kwargs.get("top_p", self.top_p),
                "top_k": kwargs.get("top_k", self.top_k),
                "repetition_penalty": kwargs.get("repetition_penalty", self.repetition_penalty),
                "do_sample": kwargs.get("do_sample", self.do_sample)
            }
        }
        
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list):
                return result[0].get("generated_text", "")
            return result.get("generated_text", "")
        else:
            raise Exception(f"API request failed: {response.text}")
    
    def _generate_local(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Generate using local model.
        
        Args:
            prompt: Input prompt
            system_message: Optional system message
            **kwargs: Additional parameters
            
        Returns:
            Generated text
        """
        # Format prompt for chat models
        if system_message:
            formatted_prompt = self._format_chat_prompt(prompt, system_message)
        else:
            formatted_prompt = prompt
        
        # Tokenize
        inputs = self.tokenizer(
            formatted_prompt,
            return_tensors="pt",
            truncation=True,
            max_length=self.max_length
        ).to(self.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=kwargs.get("max_new_tokens", 512),
                temperature=kwargs.get("temperature", self.temperature),
                top_p=kwargs.get("top_p", self.top_p),
                top_k=kwargs.get("top_k", self.top_k),
                repetition_penalty=kwargs.get("repetition_penalty", self.repetition_penalty),
                do_sample=kwargs.get("do_sample", self.do_sample),
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode
        generated_text = self.tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        )
        
        return generated_text
    
    def _format_chat_prompt(self, prompt: str, system_message: str) -> str:
        """
        Format prompt for chat models.
        
        Args:
            prompt: User prompt
            system_message: System message
            
        Returns:
            Formatted prompt
        """
        # Different formats for different model types
        if "llama" in self.model_id.lower():
            return f"<s>[INST] <<SYS>>\n{system_message}\n<</SYS>>\n\n{prompt} [/INST]"
        elif "mistral" in self.model_id.lower():
            return f"<s>[INST] {system_message}\n\n{prompt} [/INST]"
        elif "zephyr" in self.model_id.lower():
            return f"<|system|>\n{system_message}</s>\n<|user|>\n{prompt}</s>\n<|assistant|>\n"
        elif "phi" in self.model_id.lower():
            return f"Instruct: {system_message}\n\n{prompt}\nOutput:"
        else:
            return f"{system_message}\n\n{prompt}"
    
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
        if self.use_api:
            raise NotImplementedError("Streaming not supported for API mode")
        
        if system_message:
            formatted_prompt = self._format_chat_prompt(prompt, system_message)
        else:
            formatted_prompt = prompt
        
        # Tokenize
        inputs = self.tokenizer(
            formatted_prompt,
            return_tensors="pt",
            truncation=True,
            max_length=self.max_length
        ).to(self.device)
        
        # Generate with streaming
        with torch.no_grad():
            for _ in range(kwargs.get("max_new_tokens", 512)):
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=1,
                    temperature=kwargs.get("temperature", self.temperature),
                    top_p=kwargs.get("top_p", self.top_p),
                    top_k=kwargs.get("top_k", self.top_k),
                    do_sample=kwargs.get("do_sample", self.do_sample),
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
                
                next_token = outputs[0][-1:]
                next_text = self.tokenizer.decode(next_token, skip_special_tokens=True)
                
                if next_text and next_text != self.tokenizer.eos_token:
                    yield next_text
                    
                    # Update inputs for next token
                    inputs = {
                        "input_ids": torch.cat([inputs["input_ids"], next_token.unsqueeze(0)], dim=1),
                        "attention_mask": torch.cat([
                            inputs["attention_mask"],
                            torch.ones((1, 1), device=self.device)
                        ], dim=1)
                    }
                else:
                    break
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Model information
        """
        # Check if model is in recommended list
        for category, info in self.RECOMMENDED_MODELS.items():
            if info["model_id"] == self.model_id:
                return {
                    "model_id": self.model_id,
                    "category": category,
                    "description": info["description"],
                    "context_length": info["context_length"],
                    "requires_gpu": info["requires_gpu"],
                    "device": self.device if not self.use_api else "api",
                    "use_api": self.use_api
                }
        
        return {
            "model_id": self.model_id,
            "category": "custom",
            "description": "Custom model",
            "context_length": self.max_length,
            "device": self.device if not self.use_api else "api",
            "use_api": self.use_api
        }
    
    def clear_gpu_memory(self):
        """Clear GPU memory if using CUDA."""
        if torch.cuda.is_available() and self.device == 'cuda':
            torch.cuda.empty_cache()
            logger.info("Cleared GPU memory")

