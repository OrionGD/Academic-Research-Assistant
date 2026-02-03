"""
End-to-end API tests with mocked dependencies.
"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import status
import json

from app.main import app
from app.core.exceptions import (
    NotFoundException,
    UnauthorizedException,
    ValidationException
)


# Test client fixture (override this based on your setup)
@pytest.fixture
def client():
    return TestClient(app)


class TestAuthAPI:
    """Tests for authentication endpoints."""
    
    def test_register_success(self, client, test_user_data):
        """Test successful user registration."""
        # Arrange
        with patch("app.api.endpoints.auth.user_service.create") as mock_create:
            mock_create.return_value = AsyncMock(
                id=1,
                email=test_user_data["email"],
                username=test_user_data["username"],
                is_active=True
            )
            
            # Act
            response = client.post(
                "/auth/register",
                json={
                    "email": test_user_data["email"],
                    "username": test_user_data["username"],
                    "password": test_user_data["password"],
                    "full_name": test_user_data["full_name"]
                }
            )
            
            # Assert
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["email"] == test_user_data["email"]
            assert data["username"] == test_user_data["username"]
            assert "password" not in data  # Password should not be in response
            assert "hashed_password" not in data
    
    def test_register_duplicate_email(self, client, test_user_data):
        """Test registration with duplicate email."""
        # Arrange
        with patch("app.api.endpoints.auth.user_service.create") as mock_create:
            mock_create.side_effect = ConflictException("Email already registered")
            
            # Act
            response = client.post(
                "/auth/register",
                json={
                    "email": test_user_data["email"],
                    "username": "differentuser",
                    "password": test_user_data["password"],
                    "full_name": test_user_data["full_name"]
                }
            )
            
            # Assert
            assert response.status_code == status.HTTP_409_CONFLICT
            data = response.json()
            assert "detail" in data
            assert "already registered" in data["detail"].lower()
    
    def test_register_validation_error(self, client):
        """Test registration with invalid data."""
        # Arrange
        invalid_data = {
            "email": "invalid-email",
            "username": "ab",  # Too short
            "password": "weak",  # Too weak
            "full_name": ""
        }
        
        # Act
        response = client.post("/auth/register", json=invalid_data)
        
        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        errors = response.json()["detail"]
        assert len(errors) >= 3  # Should have multiple validation errors
    
    def test_login_success(self, client, test_user_data):
        """Test successful login."""
        # Arrange
        with patch("app.api.endpoints.auth.auth_service.authenticate") as mock_auth, \
             patch("app.api.endpoints.auth.create_access_token") as mock_token:
            
            mock_auth.return_value = AsyncMock(
                id=1,
                email=test_user_data["email"],
                is_active=True
            )
            mock_token.return_value = "mock-jwt-token"
            
            # Act
            response = client.post(
                "/auth/login",
                data={
                    "username": test_user_data["email"],
                    "password": test_user_data["password"]
                }
            )
            
            # Assert
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["access_token"] == "mock-jwt-token"
            assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        # Arrange
        with patch("app.api.endpoints.auth.auth_service.authenticate") as mock_auth:
            mock_auth.side_effect = UnauthorizedException("Invalid credentials")
            
            # Act
            response = client.post(
                "/auth/login",
                data={
                    "username": "wrong@example.com",
                    "password": "wrongpassword"
                }
            )
            
            # Assert
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "invalid credentials" in response.json()["detail"].lower()


class TestUserAPI:
    """Tests for user endpoints."""
    
    def test_get_current_user(self, client, test_user, headers):
        """Test retrieving current user info."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user:
            mock_current_user.return_value = test_user
            
            # Act
            response = client.get("/users/me", headers=headers)
            
            # Assert
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["id"] == test_user.id
            assert data["email"] == test_user.email
            assert "hashed_password" not in data
    
    def test_get_current_user_unauthorized(self, client):
        """Test retrieving current user without authentication."""
        # Act
        response = client.get("/users/me")
        
        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_user(self, client, test_user, headers):
        """Test updating user information."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.users.user_service.update") as mock_update:
            
            mock_current_user.return_value = test_user
            updated_user = test_user.copy()
            updated_user.full_name = "Updated Name"
            mock_update.return_value = updated_user
            
            # Act
            response = client.put(
                "/users/me",
                headers=headers,
                json={"full_name": "Updated Name"}
            )
            
            # Assert
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["full_name"] == "Updated Name"


class TestItemAPI:
    """Tests for item endpoints."""
    
    def test_create_item(self, client, test_user, test_item_data, headers):
        """Test creating a new item."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.items.item_service.create_with_owner") as mock_create:
            
            mock_current_user.return_value = test_user
            mock_item = AsyncMock(**test_item_data, id=1, owner_id=test_user.id)
            mock_create.return_value = mock_item
            
            # Act
            response = client.post(
                "/items/",
                headers=headers,
                json=test_item_data
            )
            
            # Assert
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["title"] == test_item_data["title"]
            assert data["owner_id"] == test_user.id
    
    def test_get_items_paginated(self, client, headers):
        """Test retrieving paginated items."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.items.item_service.get_multi_paginated") as mock_get:
            
            mock_current_user.return_value = AsyncMock(id=1)
            mock_items = [
                AsyncMock(id=1, title="Item 1", price=10.0),
                AsyncMock(id=2, title="Item 2", price=20.0),
            ]
            mock_get.return_value = (mock_items, 2)
            
            # Act
            response = client.get(
                "/items/",
                headers=headers,
                params={"skip": 0, "limit": 10}
            )
            
            # Assert
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "items" in data
            assert "total" in data
            assert data["total"] == 2
            assert len(data["items"]) == 2
    
    def test_get_item_by_id(self, client, test_item, headers):
        """Test retrieving item by ID."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.items.item_service.get_by_id") as mock_get:
            
            mock_current_user.return_value = AsyncMock(id=1)
            mock_get.return_value = test_item
            
            # Act
            response = client.get(
                f"/items/{test_item.id}",
                headers=headers
            )
            
            # Assert
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["id"] == test_item.id
    
    def test_get_item_not_found(self, client, headers):
        """Test retrieving non-existent item."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.items.item_service.get_by_id") as mock_get:
            
            mock_current_user.return_value = AsyncMock(id=1)
            mock_get.side_effect = NotFoundException("Item not found")
            
            # Act
            response = client.get("/items/99999", headers=headers)
            
            # Assert
            assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_item(self, client, test_item, headers):
        """Test updating an item."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.items.item_service.get_by_id") as mock_get, \
             patch("app.api.endpoints.items.item_service.update") as mock_update:
            
            mock_current_user.return_value = AsyncMock(id=test_item.owner_id)
            mock_get.return_value = test_item
            updated_item = test_item.copy()
            updated_item.title = "Updated Title"
            mock_update.return_value = updated_item
            
            # Act
            response = client.put(
                f"/items/{test_item.id}",
                headers=headers,
                json={"title": "Updated Title", "price": 149.99}
            )
            
            # Assert
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["title"] == "Updated Title"
    
    def test_delete_item(self, client, test_item, headers):
        """Test deleting an item."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.items.item_service.get_by_id") as mock_get, \
             patch("app.api.endpoints.items.item_service.delete") as mock_delete:
            
            mock_current_user.return_value = AsyncMock(id=test_item.owner_id)
            mock_get.return_value = test_item
            mock_delete.return_value = None
            
            # Act
            response = client.delete(f"/items/{test_item.id}", headers=headers)
            
            # Assert
            assert response.status_code == status.HTTP_204_NO_CONTENT


class TestErrorHandling:
    """Tests for API error handling."""
    
    def test_invalid_json(self, client, headers):
        """Test request with invalid JSON."""
        # Act
        response = client.post(
            "/items/",
            headers=headers,
            content="invalid json",
        )
        
        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "json" in response.json()["detail"][0]["type"]
    
    def test_method_not_allowed(self, client):
        """Test using wrong HTTP method."""
        # Act
        response = client.patch("/auth/login")
        
        # Assert
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    def test_rate_limit_exceeded(self, client):
        """Test rate limiting (if enabled)."""
        # This would depend on your rate limiting setup
        # For testing, you might want to mock the rate limiter
        
        with patch("slowapi.Limiter") as mock_limiter:
            mock_limiter.raise_for_status.side_effect = Exception("Rate limit exceeded")
            
            # Make multiple rapid requests
            responses = []
            for _ in range(11):  # Assuming limit is 10
                response = client.post(
                    "/auth/login",
                    data={"username": "test", "password": "test"}
                )
                responses.append(response)
            
            # Check if rate limiting was triggered
            # (Implementation depends on your rate limiting setup)
            pass
    
    def test_internal_server_error(self, client, headers):
        """Test handling of unexpected server errors."""
        # Arrange
        with patch("app.api.deps.get_current_user") as mock_current_user:
            mock_current_user.side_effect = Exception("Unexpected error")
            
            # Act
            response = client.get("/users/me", headers=headers)
            
            # Assert
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            # In production, you might want to mask error details
            assert "detail" in response.json()


class TestResponseFormats:
    """Tests for response format consistency."""
    
    def test_error_response_format(self, client):
        """Test that all errors follow the same format."""
        # Test 404
        response = client.get("/nonexistent-endpoint")
        error_response = response.json()
        assert "detail" in error_response
        
        # Test 422
        response = client.post("/auth/register", json={})
        error_response = response.json()
        assert "detail" in error_response
        
        # Test 401
        response = client.get("/users/me")
        error_response = response.json()
        assert "detail" in error_response
    
    def test_pagination_response_format(self, client, headers):
        """Test that paginated responses follow consistent format."""
        with patch("app.api.deps.get_current_user") as mock_current_user, \
             patch("app.api.endpoints.items.item_service.get_multi_paginated") as mock_get:
            
            mock_current_user.return_value = AsyncMock(id=1)
            mock_get.return_value = ([], 0)
            
            response = client.get("/items/", headers=headers)
            data = response.json()
            
            # Check consistent pagination structure
            assert "items" in data
            assert "total" in data
            assert "skip" in data
            assert "limit" in data
            assert isinstance(data["items"], list)
            assert isinstance(data["total"], int)
    
    def test_response_headers(self, client, test_user_data):
        """Test that responses include appropriate headers."""
        with patch("app.api.endpoints.auth.user_service.create") as mock_create:
            mock_create.return_value = AsyncMock(
                id=1,
                email=test_user_data["email"],
                username=test_user_data["username"]
            )
            
            response = client.post("/auth/register", json=test_user_data)
            
            # Check common headers
            assert "content-type" in response.headers
            assert response.headers["content-type"] == "application/json"
            
            # For creation endpoints, check Location header
            if response.status_code == status.HTTP_201_CREATED:
                assert "location" in response.headers
                # Location header should point to the created resource
                assert str(mock_create.return_value.id) in response.headers["location"]


class TestRequestValidation:
    """Tests for request validation at API layer."""
    
    def test_query_parameter_validation(self, client, headers):
        """Test validation of query parameters."""
        invalid_queries = [
            {"skip": -1, "limit": 10},  # Negative skip
            {"skip": 0, "limit": 0},  # Zero limit
            {"skip": 0, "limit": 101},  # Limit too high
            {"skip": "invalid", "limit": 10},  # Invalid type
        ]
        
        for params in invalid_queries:
            response = client.get("/items/", headers=headers, params=params)
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_path_parameter_validation(self, client, headers):
        """Test validation of path parameters."""
        invalid_ids = ["invalid", "0", "-1", "99999999999999999999"]
        
        for item_id in invalid_ids:
            response = client.get(f"/items/{item_id}", headers=headers)
            assert response.status_code in [
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                status.HTTP_404_NOT_FOUND
            ]