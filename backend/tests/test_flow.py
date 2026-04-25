import pytest
import io
import uuid
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.main import app

# Initialize TestClient
client = TestClient(app)

# Removed obsolete auth flow test and mocks since system is now guest-access only
