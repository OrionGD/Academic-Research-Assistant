"""
Centralized logging configuration.
Provides structured logging with different levels, 
context preservation, and integration with monitoring systems.
"""

import logging
import logging.config
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional, Union
from pathlib import Path
import traceback
from dataclasses import dataclass, asdict
from enum import Enum

class LogLevel(Enum):
    """Log levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class LogFormat(Enum):
    """Log formats."""
    TEXT = "text"
    JSON = "json"

@dataclass
class LogContext:
    """Context information for structured logging."""
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    component: Optional[str] = None
    operation: Optional[str] = None
    document_id: Optional[str] = None
    chunk_id: Optional[str] = None
    duration_ms: Optional[float] = None
    additional_fields: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary."""
        result = {}
        for key, value in asdict(self).items():
            if value is not None:
                if key == 'additional_fields' and isinstance(value, dict):
                    result.update(value)
                elif key != 'additional_fields':
                    result[key] = value
        return result

class StructuredFormatter(logging.Formatter):
    """Structured log formatter supporting both text and JSON formats."""
    
    def __init__(self, fmt_type: LogFormat = LogFormat.JSON, **kwargs):
        """
        Initialize the structured formatter.
        
        Args:
            fmt_type: Log format type (TEXT or JSON)
        """
        super().__init__(**kwargs)
        self.fmt_type = fmt_type
        
        # Color codes for terminal output
        self.COLORS = {
            'DEBUG': '\033[94m',  # Blue
            'INFO': '\033[92m',   # Green
            'WARNING': '\033[93m', # Yellow
            'ERROR': '\033[91m',   # Red
            'CRITICAL': '\033[95m', # Magenta
            'RESET': '\033[0m'     # Reset
        }
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record."""
        # Extract context if present
        context = getattr(record, 'context', None)
        
        # Prepare log message
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'process': record.process,
            'thread': record.threadName,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': traceback.format_exception(*record.exc_info)[-1].strip()
            }
        
        # Add context if present
        if context and isinstance(context, dict):
            log_data.update(context)
        elif isinstance(context, LogContext):
            log_data.update(context.to_dict())
        
        # Format based on type
        if self.fmt_type == LogFormat.JSON:
            return json.dumps(log_data, ensure_ascii=False)
        else:
            return self._format_text(log_data)
    
    def _format_text(self, log_data: Dict[str, Any]) -> str:
        """Format log as colored text."""
        timestamp = log_data.get('timestamp', '')
        level = log_data.get('level', 'INFO')
        logger_name = log_data.get('logger', '')
        message = log_data.get('message', '')
        
        # Base format
        log_line = f"{timestamp} | {level:8} | {logger_name} | {message}"
        
        # Add color for terminal output
        if sys.stdout.isatty() and level in self.COLORS:
            log_line = f"{self.COLORS[level]}{log_line}{self.COLORS['RESET']}"
        
        # Add context information
        context_fields = {k: v for k, v in log_data.items() 
                         if k not in ['timestamp', 'level', 'logger', 'message', 'module', 'function', 'line', 'process', 'thread']}
        
        if context_fields:
            context_str = ' '.join(f'{k}={v}' for k, v in context_fields.items())
            log_line += f" | {context_str}"
        
        # Add exception info if present
        if 'exception' in log_data:
            exc = log_data['exception']
            log_line += f"\nException: {exc.get('type')}: {exc.get('message')}"
            if 'traceback' in exc:
                log_line += f"\nTraceback: {exc['traceback']}"
        
        return log_line

class ContextLogger:
    """Logger wrapper that maintains context."""
    
    def __init__(self, name: str, context: Optional[LogContext] = None):
        """
        Initialize context logger.
        
        Args:
            name: Logger name
            context: Initial log context
        """
        self.logger = logging.getLogger(name)
        self.context = context or LogContext()
        self._component = name.split('.')[-1]
        self.context.component = self._component
    
    def set_context(self, **kwargs):
        """Update log context."""
        for key, value in kwargs.items():
            if hasattr(self.context, key):
                setattr(self.context, key, value)
            else:
                if self.context.additional_fields is None:
                    self.context.additional_fields = {}
                self.context.additional_fields[key] = value
    
    def update_context(self, context: Union[LogContext, Dict[str, Any]]):
        """Update log context with new context object or dictionary."""
        if isinstance(context, LogContext):
            self.context = context
        elif isinstance(context, dict):
            for key, value in context.items():
                self.set_context(**{key: value})
    
    def _log_with_context(self, level: int, msg: str, *args, exc_info=None, extra=None, **kwargs):
        """Log message with context."""
        extra = extra or {}
        extra['context'] = self.context.to_dict()
        
        # Add duration if timing decorator was used
        if 'duration_ms' in kwargs:
            self.context.duration_ms = kwargs.pop('duration_ms')
        
        self.logger.log(level, msg, *args, exc_info=exc_info, extra=extra, **kwargs)
    
    def debug(self, msg: str, *args, **kwargs):
        """Log debug message."""
        self._log_with_context(logging.DEBUG, msg, *args, **kwargs)
    
    def info(self, msg: str, *args, **kwargs):
        """Log info message."""
        self._log_with_context(logging.INFO, msg, *args, **kwargs)
    
    def warning(self, msg: str, *args, **kwargs):
        """Log warning message."""
        self._log_with_context(logging.WARNING, msg, *args, **kwargs)
    
    def error(self, msg: str, *args, **kwargs):
        """Log error message."""
        self._log_with_context(logging.ERROR, msg, *args, **kwargs)
    
    def critical(self, msg: str, *args, **kwargs):
        """Log critical message."""
        self._log_with_context(logging.CRITICAL, msg, *args, **kwargs)
    
    def exception(self, msg: str, *args, exc_info=True, **kwargs):
        """Log exception with traceback."""
        self._log_with_context(logging.ERROR, msg, *args, exc_info=exc_info, **kwargs)
    
    def timing(self, func):
        """Decorator to log function execution time."""
        from functools import wraps
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration_ms = (time.time() - start_time) * 1000
                self.debug(
                    f"Function {func.__name__} executed in {duration_ms:.2f}ms",
                    duration_ms=duration_ms
                )
        
        return wrapper

class LogManager:
    """Centralized log manager for the application."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LogManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.config = None
            self.default_log_dir = Path("logs")
            self._initialized = True
    
    def configure(
        self,
        log_level: Union[str, LogLevel] = LogLevel.INFO,
        log_format: Union[str, LogFormat] = LogFormat.JSON,
        log_dir: Optional[Union[str, Path]] = None,
        log_file: Optional[str] = None,
        enable_console: bool = True,
        enable_file: bool = True,
        max_file_size: int = 10 * 1024 * 1024,  # 10 MB
        backup_count: int = 5,
        structured_logging: bool = True,
        service_name: str = "academic-rag-backend"
    ):
        """
        Configure logging for the application.
        
        Args:
            log_level: Minimum log level
            log_format: Log format (text or json)
            log_dir: Directory for log files
            log_file: Log file name
            enable_console: Enable console logging
            enable_file: Enable file logging
            max_file_size: Maximum log file size
            backup_count: Number of backup files to keep
            structured_logging: Enable structured logging
            service_name: Service name for logs
        """
        # Convert enums to strings if needed
        if isinstance(log_level, LogLevel):
            log_level = log_level.value
        if isinstance(log_format, LogFormat):
            log_format = log_format.value
        
        # Create log directory
        if log_dir:
            log_dir = Path(log_dir)
        else:
            log_dir = self.default_log_dir
        
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Set default log file if not specified
        if not log_file:
            timestamp = datetime.now().strftime("%Y%m%d")
            log_file = f"{service_name}_{timestamp}.log"
        
        log_path = log_dir / log_file
        
        # Configure formatters
        formatters = {}
        if structured_logging:
            formatters['json'] = {
                '()': StructuredFormatter,
                'fmt_type': LogFormat.JSON
            }
            formatters['text'] = {
                '()': StructuredFormatter,
                'fmt_type': LogFormat.TEXT
            }
        else:
            formatters['standard'] = {
                'format': '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
            }
        
        # Configure handlers
        handlers = {}
        
        if enable_console:
            handlers['console'] = {
                'class': 'logging.StreamHandler',
                'level': log_level,
                'formatter': 'text' if structured_logging else 'standard',
                'stream': sys.stdout
            }
        
        if enable_file:
            handlers['file'] = {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': log_level,
                'formatter': 'json' if structured_logging else 'standard',
                'filename': str(log_path),
                'maxBytes': max_file_size,
                'backupCount': backup_count,
                'encoding': 'utf8'
            }
        
        # Configure error file handler
        if enable_file:
            error_log_path = log_dir / f"error_{log_file}"
            handlers['error_file'] = {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'json' if structured_logging else 'standard',
                'filename': str(error_log_path),
                'maxBytes': max_file_size,
                'backupCount': backup_count,
                'encoding': 'utf8'
            }
        
        # Configure loggers
        loggers = {
            '': {  # Root logger
                'handlers': list(handlers.keys()),
                'level': log_level,
                'propagate': False
            },
            'backend': {
                'handlers': list(handlers.keys()),
                'level': log_level,
                'propagate': False
            },
            'backend.app.utils': {
                'handlers': list(handlers.keys()),
                'level': log_level,
                'propagate': False
            },
            '__main__': {
                'handlers': list(handlers.keys()),
                'level': log_level,
                'propagate': False
            }
        }
        
        # Create logging configuration
        self.config = {
            'version': 1,
            'disable_existing_loggers': False,
            'formatters': formatters,
            'handlers': handlers,
            'loggers': loggers
        }
        
        # Apply configuration
        logging.config.dictConfig(self.config)
        
        # Set up exception handler
        sys.excepthook = self._exception_handler
        
        logger = self.get_logger(__name__)
        logger.info(
            "Logging configured",
            extra={
                'context': {
                    'log_level': log_level,
                    'log_format': log_format,
                    'log_dir': str(log_dir),
                    'log_file': log_file,
                    'service_name': service_name
                }
            }
        )
    
    def get_logger(self, name: str, context: Optional[LogContext] = None) -> ContextLogger:
        """
        Get a context logger instance.
        
        Args:
            name: Logger name
            context: Initial log context
            
        Returns:
            ContextLogger instance
        """
        return ContextLogger(name, context)
    
    def _exception_handler(self, exc_type, exc_value, exc_traceback):
        """Global exception handler."""
        if issubclass(exc_type, KeyboardInterrupt):
            # Call the default handler for KeyboardInterrupt
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        
        logger = self.get_logger('exception_handler')
        logger.critical(
            "Unhandled exception",
            exc_info=(exc_type, exc_value, exc_traceback)
        )
    
    def get_log_file_paths(self) -> Dict[str, Path]:
        """Get paths to log files."""
        if not self.config:
            return {}
        
        log_dir = self.default_log_dir
        return {
            'log_dir': log_dir,
            'log_files': list(log_dir.glob('*.log'))
        }
    
    def flush_logs(self):
        """Flush all log handlers."""
        for logger in logging.Logger.manager.loggerDict.values():
            if isinstance(logger, logging.Logger):
                for handler in logger.handlers:
                    handler.flush()

# Singleton instance
log_manager = LogManager()

# Convenience functions
def setup_logging(**kwargs):
    """Setup logging with default configuration."""
    log_manager.configure(**kwargs)

def get_logger(name: str, **context_kwargs) -> ContextLogger:
    """Get a logger with optional context."""
    context = LogContext(**context_kwargs) if context_kwargs else None
    return log_manager.get_logger(name, context)

# Example usage decorator
def log_execution(logger_name: str = None):
    """Decorator to log function execution."""
    def decorator(func):
        from functools import wraps
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = get_logger(logger_name or func.__module__)
            logger.set_context(operation=func.__name__)
            
            logger.debug(f"Starting execution of {func.__name__}")
            try:
                result = func(*args, **kwargs)
                logger.debug(f"Completed execution of {func.__name__}")
                return result
            except Exception as e:
                logger.error(
                    f"Error in {func.__name__}: {str(e)}",
                    exc_info=True
                )
                raise
        
        return wrapper
    return decorator

# Initialize default logging if not configured
def init_default_logging():
    """Initialize default logging configuration."""
    if not log_manager.config:
        log_manager.configure(
            log_level=LogLevel.INFO,
            log_format=LogFormat.TEXT,
            enable_console=True,
            enable_file=True,
            structured_logging=True
        )

# Initialize on import
init_default_logging()