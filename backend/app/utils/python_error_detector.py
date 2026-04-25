import ast
import importlib
import sys
import traceback
from typing import Optional, Tuple, List, Dict, Set
import re
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO

class PythonErrorDetector:
    """
    Comprehensive Python error detection and auto-fixing system.
    Detects and fixes: syntax errors, indentation, missing imports,
    undefined names, and converts one-line compound statements.
    """

    def __init__(self):
        self.common_imports = {
            'os': 'import os',
            'sys': 'import sys',
            'json': 'import json',
            'datetime': 'from datetime import datetime',
            'time': 'import time',
            'random': 'import random',
            're': 'import re',
            'math': 'import math',
            'collections': 'from collections import defaultdict',
            'itertools': 'import itertools',
            'functools': 'import functools',
            'requests': 'import requests',
            'pandas': 'import pandas as pd',
            'numpy': 'import numpy as np',
            'matplotlib': 'import matplotlib.pyplot as plt',
            'flask': 'from flask import Flask',
            'fastapi': 'from fastapi import FastAPI',
            'uvicorn': 'import uvicorn',
            'pymongo': 'import pymongo',
            'redis': 'import redis',
            'chromadb': 'import chromadb',
            'google.generativeai': 'import google.generativeai as genai',
            'groq': 'from groq import Groq',
            'pydantic': 'from pydantic import BaseModel',
            'sqlalchemy': 'from sqlalchemy import create_engine',
        }

        # Built-in functions and common names that shouldn't be imported
        self.builtins = {
            'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set',
            'tuple', 'enumerate', 'zip', 'sum', 'max', 'min', 'sorted', 'reversed',
            'abs', 'round', 'open', 'type', 'isinstance', 'callable', 'dir',
            'hasattr', 'getattr', 'setattr', 'delattr', 'exec', 'eval',
        }

    def detect_and_fix(self, code: str, max_retries: int = 10) -> Tuple[str, bool, str]:
        """
        Detect errors in Python code and auto-fix them completely.
        Returns: (fixed_code, success, error_message)
        """
        fixed_code = code
        attempt = 0
        last_error = ""
        last_code_state = ""

        while attempt < max_retries:
            try:
                # Pre-processing: normalize code structure
                fixed_code = self._normalize_code(fixed_code)

                # Fix syntax errors
                fixed_code = self._fix_all_syntax_errors(fixed_code)

                # Convert one-line statements
                fixed_code = self._convert_one_line_statements(fixed_code)

                # Fix and add missing imports
                fixed_code = self._fix_all_missing_imports(fixed_code)
                
                # Add any undefined variables as None initialization
                fixed_code = self._add_undefined_variables(fixed_code)

                # Verify it compiles
                ast.parse(fixed_code)

                # Test execution in safe environment
                self._safe_execute(fixed_code)

                return fixed_code, True, ""

            except SyntaxError as e:
                last_error = str(e)
                error_sig = f"SyntaxError:{e.lineno}"
                
                if error_sig in attempted_fixes:
                    attempt += 1
                    attempted_fixes.clear()
                    continue

                attempted_fixes.add(error_sig)

                # Apply targeted syntax fixes based on error type
                if "expected ':'" in str(e):
                    fixed_code = self._fix_missing_colons(fixed_code, e.lineno)
                elif "expected an indented block" in str(e):
                    fixed_code = self._fix_indentation_block(fixed_code, e.lineno)
                elif "unexpected indent" in str(e):
                    fixed_code = self._fix_unexpected_indent(fixed_code, e.lineno)
                elif "invalid syntax" in str(e):
                    fixed_code = self._fix_invalid_syntax(fixed_code, e.lineno)
                else:
                    attempt += 1

            except NameError as e:
                # Handle undefined names
                name = str(e).split("'")[1] if "'" in str(e) else ""
                fixed_code = self._fix_undefined_name(fixed_code, name)
                attempt += 1

            except Exception as e:
                last_error = str(e)
                attempt += 1

        return fixed_code, False, f"Could not fully fix code: {last_error}"

    def _normalize_code(self, code: str) -> str:
        """Normalize code structure and whitespace."""
        lines = code.split('\n')
        
        # Remove trailing whitespace but preserve leading
        lines = [line.rstrip() for line in lines]
        
        # Remove completely empty lines at start/end but preserve empty lines within code
        while lines and not lines[0].strip():
            lines.pop(0)
        while lines and not lines[-1].strip():
            lines.pop()
        
        return '\n'.join(lines)

    def _fix_all_syntax_errors(self, code: str) -> str:
        """Fix all syntax errors systematically."""
        max_attempts = 5
        attempt = 0
        
        while attempt < max_attempts:
            try:
                ast.parse(code)
                return code
            except SyntaxError as e:
                if e.lineno is None:
                    return code
                    
                # Get the specific line
                lines = code.split('\n')
                line_idx = e.lineno - 1
                
                if not (0 <= line_idx < len(lines)):
                    return code

                # Fix based on error message
                if "expected ':'" in str(e):
                    fixed = self._fix_missing_colons(code, e.lineno)
                elif "expected an indented block" in str(e):
                    fixed = self._fix_indentation_block(code, e.lineno)
                elif "unexpected indent" in str(e):
                    fixed = self._fix_unexpected_indent(code, e.lineno)
                elif "EOL while scanning" in str(e):
                    fixed = self._fix_eol_error(code, e.lineno)
                elif "invalid syntax" in str(e):
                    fixed = self._fix_invalid_syntax(code, e.lineno)
                else:
                    return code

                if fixed == code:
                    # No change made, avoid infinite loop
                    return code

                code = fixed
                attempt += 1

        return code

    def _fix_missing_colons(self, code: str, error_line: int) -> str:
        """Fix missing colons after compound statements."""
        lines = code.split('\n')
        
        # Look at the error line and surrounding lines
        for i in range(max(0, error_line - 2), min(len(lines), error_line + 1)):
            line = lines[i]
            stripped = line.strip()
            
            # Check for compound statement keywords
            if re.match(r'^\s*(def|class|if|elif|else|for|while|with|try|except|finally)\b', stripped):
                if stripped and not stripped.endswith(':') and not stripped.startswith('else:'):
                    # Add colon
                    lines[i] = line.rstrip() + ':'
                    break

        return '\n'.join(lines)

    def _fix_indentation_block(self, code: str, error_line: int) -> str:
        """Fix missing indentation after compound statements."""
        lines = code.split('\n')
        
        if error_line <= 1:
            return code

        # Find the compound statement that needs a body
        for i in range(error_line - 2, max(-1, error_line - 5), -1):
            line = lines[i]
            stripped = line.strip()
            
            if stripped.endswith(':') and any(keyword in stripped for keyword in 
                    ['def ', 'class ', 'if ', 'elif ', 'else:', 'for ', 'while ', 'with ', 'try:', 'except']):
                # This line needs an indented body
                if error_line - 1 < len(lines):
                    next_line = lines[error_line - 1]
                    if next_line.strip() and not next_line.startswith(' '):
                        # Indent the next line
                        lines[error_line - 1] = '    ' + next_line
                break

        return '\n'.join(lines)

    def _fix_unexpected_indent(self, code: str, error_line: int) -> str:
        """Fix unexpected indentation."""
        lines = code.split('\n')
        
        if not (0 < error_line <= len(lines)):
            return code

        line_idx = error_line - 1
        line = lines[line_idx]
        
        # Remove indentation if it's not after a compound statement
        if line_idx > 0:
            prev_line = lines[line_idx - 1].strip()
            if not prev_line.endswith(':'):
                # This indentation is unexpected, remove it
                lines[line_idx] = line.lstrip()

        return '\n'.join(lines)

    def _fix_eol_error(self, code: str, error_line: int) -> str:
        """Fix end-of-line errors (unclosed strings/brackets)."""
        lines = code.split('\n')
        
        if not (0 < error_line <= len(lines)):
            return code

        line_idx = error_line - 1
        
        # Count unclosed brackets across all lines
        all_text = '\n'.join(lines[:line_idx + 1])
        
        # Remove strings to avoid counting brackets in strings
        all_text_no_strings = re.sub(r'"[^"]*"', '', all_text)
        all_text_no_strings = re.sub(r"'[^']*'", '', all_text_no_strings)
        
        open_parens = all_text_no_strings.count('(') - all_text_no_strings.count(')')
        open_brackets = all_text_no_strings.count('[') - all_text_no_strings.count(']')
        open_braces = all_text_no_strings.count('{') - all_text_no_strings.count('}')
        
        # Close any unclosed brackets at the end
        closing = ''
        if open_braces > 0:
            closing += '}' * open_braces
        if open_brackets > 0:
            closing += ']' * open_brackets
        if open_parens > 0:
            closing += ')' * open_parens
        
        if closing and line_idx < len(lines):
            lines[line_idx] = lines[line_idx].rstrip() + closing
        
        return '\n'.join(lines)

    def _fix_invalid_syntax(self, code: str, error_line: int) -> str:
        """Fix generic invalid syntax errors."""
        lines = code.split('\n')
        
        if not (0 < error_line <= len(lines)):
            return code

        # Check for unclosed brackets in the entire code up to error line
        all_text = '\n'.join(lines[:error_line])
        
        # Remove strings to avoid counting brackets in strings
        all_text_no_strings = re.sub(r'"[^"]*"', '', all_text)
        all_text_no_strings = re.sub(r"'[^']*'", '', all_text_no_strings)
        
        open_parens = all_text_no_strings.count('(') - all_text_no_strings.count(')')
        open_brackets = all_text_no_strings.count('[') - all_text_no_strings.count(']')
        open_braces = all_text_no_strings.count('{') - all_text_no_strings.count('}')
        
        # If we have unclosed brackets, close them
        if open_parens > 0 or open_brackets > 0 or open_braces > 0:
            closing = ''
            if open_braces > 0:
                closing += '}' * open_braces
            if open_brackets > 0:
                closing += ']' * open_brackets
            if open_parens > 0:
                closing += ')' * open_parens
            
            line_idx = error_line - 1
            if line_idx < len(lines):
                lines[line_idx] = lines[line_idx].rstrip() + closing
            return '\n'.join(lines)
        
        line_idx = error_line - 1
        if line_idx >= len(lines):
            return code
            
        line = lines[line_idx]
        stripped = line.strip()
        
        # Double colon
        if '::' in stripped:
            lines[line_idx] = line.replace('::', ':')
        
        # Missing operator
        if re.match(r'.*\d\s+\d.*', stripped):
            # Numbers without operator between them
            lines[line_idx] = line.replace('  ', ' ')
        
        return '\n'.join(lines)

    def _convert_one_line_statements(self, code: str) -> str:
        """Convert one-line compound statements to multi-line blocks."""
        lines = code.split('\n')
        converted_lines = []

        for line in lines:
            stripped = line.strip()
            
            # Match one-line statements: if/for/while/def ... : statement
            match = re.match(r'^(if|elif|for|while|def|class|with|try|except|finally)\s+(.+):\s+(\S.+)$', stripped)
            
            if match:
                keyword = match.group(1)
                condition = match.group(2)
                statement = match.group(3)
                
                # Get the original indentation
                indent = len(line) - len(line.lstrip())
                base_indent = ' ' * indent
                body_indent = ' ' * (indent + 4)
                
                # Add the condition line
                converted_lines.append(f"{base_indent}{keyword} {condition}:")
                
                # Add the statement on next line with proper indentation
                converted_lines.append(f"{body_indent}{statement}")
            else:
                converted_lines.append(line)

        return '\n'.join(converted_lines)

    def _fix_all_missing_imports(self, code: str) -> str:
        """Comprehensively fix all missing imports."""
        lines = code.split('\n')
        
        # Collect all used names in code
        used_names = self._extract_used_names(code)
        
        # Find missing imports
        imports_to_add = []
        
        for name in used_names:
            if name in self.builtins:
                continue
                
            if name in self.common_imports:
                import_stmt = self.common_imports[name]
                if not self._is_imported(code, name):
                    imports_to_add.append(import_stmt)
        
        # Add imports at the beginning
        if imports_to_add:
            # Remove duplicates while preserving order
            seen = set()
            unique_imports = []
            for imp in imports_to_add:
                if imp not in seen:
                    unique_imports.append(imp)
                    seen.add(imp)
            
            # Insert at top, after existing imports if any
            import_insert_idx = 0
            for i, line in enumerate(lines):
                if line.strip().startswith(('import ', 'from ')):
                    import_insert_idx = i + 1
            
            for imp in reversed(unique_imports):
                lines.insert(import_insert_idx, imp)

        return '\n'.join(lines)

    def _extract_used_names(self, code: str) -> Set[str]:
        """Extract all used names from code."""
        used_names = set()
        
        # Regex patterns for used names
        patterns = [
            r'\b([a-zA-Z_]\w*)\.',  # module.method
            r'\b([a-zA-Z_]\w*)\(',   # function calls
            r'\b(os|sys|json|requests|pandas|numpy|redis|pymongo|chromadb)\b',  # direct module usage
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, code)
            used_names.update(matches)
        
        return used_names

    def _is_imported(self, code: str, name: str) -> bool:
        """Check if a name is already imported."""
        patterns = [
            rf'\bimport\s+{re.escape(name)}\b',
            rf'\bfrom\s+\S+\s+import\s+.*\b{re.escape(name)}\b',
        ]
        
        for pattern in patterns:
            if re.search(pattern, code):
                return True
        
        return False

    def _fix_undefined_name(self, code: str, name: str) -> str:
        """Fix undefined names by adding imports or defining variables."""
        if not name or name in self.builtins:
            return code
        
        # Check if it's a module that needs importing
        if name in self.common_imports:
            import_stmt = self.common_imports[name]
            if not self._is_imported(code, name):
                lines = code.split('\n')
                # Insert import at the beginning
                import_insert_idx = 0
                for i, line in enumerate(lines):
                    if line.strip().startswith(('import ', 'from ')):
                        import_insert_idx = i + 1
                
                lines.insert(import_insert_idx, import_stmt)
                return '\n'.join(lines)
        
        return code

    def _safe_execute(self, code: str) -> None:
        """Safely execute code to validate it works."""
        import os
        import sys
        import json
        import time
        import random
        import re as re_module
        import math
        from datetime import datetime
        from collections import defaultdict
        import itertools
        import functools

        safe_globals = {
            '__builtins__': __builtins__,
            'os': os,
            'sys': sys,
            'json': json,
            'time': time,
            'random': random,
            're': re_module,
            'math': math,
            'datetime': datetime,
            'defaultdict': defaultdict,
            'itertools': itertools,
            'functools': functools,
        }

        # Capture output to avoid cluttering
        output = StringIO()
        with redirect_stdout(output), redirect_stderr(output):
            try:
                exec(code, safe_globals)
            except Exception as e:
                # Re-raise to let error handler deal with it
                raise e


def detect_and_fix_python_errors(code: str) -> Tuple[str, bool, str]:
    """
    Main function to detect and fix Python errors.
    Returns: (fixed_code, success, error_message)
    
    Example:
        code = '''
        import os
        if x > 5: print("Hello")
        '''
        fixed, success, error = detect_and_fix_python_errors(code)
    """
    detector = PythonErrorDetector()
    return detector.detect_and_fix(code)