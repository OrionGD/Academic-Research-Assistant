"""
Legacy settings shim for ARAS platform.
All configurations are now centralized in app/core/config.py.
"""
from app.core.config import settings

# Re-exporting for compatibility with legacy imports
__all__ = ["settings"]
