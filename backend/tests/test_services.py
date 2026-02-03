"""
Unit tests for business logic layer.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

from app.services import user_service, item_service, auth_service
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.item import ItemCreate, ItemUpdate
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    UnauthorizedException,
    ValidationException
)


class TestUserService:
    """Tests for user service layer."""
    
    async def test_get_user_by_id_success(self, db_session, test_user):
        """Test retrieving user by ID successfully."""
        # Act
        result = await user_service.get_by_id(db_session, test_user.id)
        
        # Assert
        assert result is not None
        assert result.id == test_user.id
        assert result.email == test_user.email
        assert result.username == test_user.username
    
    async def test_get_user_by_id_not_found(self, db_session):
        """Test retrieving non-existent user."""
        # Act & Assert
        with pytest.raises(NotFoundException) as exc:
            await user_service.get_by_id(db_session, 99999)
        
        assert "User not found" in str(exc.value)
    
    async def test_create_user_success(self, db_session, test_user_data):
        """Test creating a new user."""
        # Arrange
        user_create = UserCreate(**test_user_data)
        
        # Act
        user = await user_service.create(db_session, user_create)
        
        # Assert
        assert user is not None
        assert user.email == test_user_data["email"]
        assert user.username == test_user_data["username"]
        assert user.is_active is True
    
    async def test_create_user_duplicate_email(self, db_session, test_user, test_user_data):
        """Test creating user with duplicate email."""
        # Arrange
        test_user_data["username"] = "differentuser"  # Change username but keep email
        user_create = UserCreate(**test_user_data)
        
        # Act & Assert
        with pytest.raises(ConflictException) as exc:
            await user_service.create(db_session, user_create)
        
        assert "already registered" in str(exc.value)
    
    async def test_update_user_success(self, db_session, test_user):
        """Test updating user information."""
        # Arrange
        update_data = UserUpdate(full_name="Updated Name", is_active=False)
        
        # Act
        updated_user = await user_service.update(db_session, test_user.id, update_data)
        
        # Assert
        assert updated_user.full_name == "Updated Name"
        assert updated_user.is_active is False
    
    async def test_authenticate_user_success(self, db_session, test_user, test_user_data):
        """Test successful user authentication."""
        # Act
        authenticated_user = await auth_service.authenticate(
            db_session,
            email=test_user.email,
            password=test_user_data["password"]
        )
        
        # Assert
        assert authenticated_user is not None
        assert authenticated_user.id == test_user.id
    
    async def test_authenticate_user_invalid_password(self, db_session, test_user):
        """Test authentication with invalid password."""
        # Act & Assert
        with pytest.raises(UnauthorizedException) as exc:
            await auth_service.authenticate(
                db_session,
                email=test_user.email,
                password="wrongpassword"
            )
        
        assert "Invalid credentials" in str(exc.value)
    
    async def test_authenticate_user_inactive(self, db_session, test_user, test_user_data):
        """Test authentication with inactive user."""
        # Arrange
        test_user.is_active = False
        await db_session.commit()
        
        # Act & Assert
        with pytest.raises(UnauthorizedException) as exc:
            await auth_service.authenticate(
                db_session,
                email=test_user.email,
                password=test_user_data["password"]
            )
        
        assert "Inactive user" in str(exc.value)


class TestItemService:
    """Tests for item service layer."""
    
    async def test_create_item_success(self, db_session, test_user, test_item_data):
        """Test creating a new item."""
        # Arrange
        item_create = ItemCreate(**test_item_data)
        
        # Act
        item = await item_service.create_with_owner(db_session, item_create, owner_id=test_user.id)
        
        # Assert
        assert item is not None
        assert item.title == test_item_data["title"]
        assert item.owner_id == test_user.id
    
    async def test_get_items_paginated(self, db_session, test_user, test_item):
        """Test retrieving paginated items."""
        # Act
        items, total = await item_service.get_multi_paginated(
            db_session,
            skip=0,
            limit=10
        )
        
        # Assert
        assert len(items) == 1
        assert total == 1
        assert items[0].id == test_item.id
    
    async def test_get_items_by_owner(self, db_session, test_user, test_item):
        """Test retrieving items by owner."""
        # Act
        items = await item_service.get_by_owner(db_session, owner_id=test_user.id)
        
        # Assert
        assert len(items) == 1
        assert items[0].owner_id == test_user.id
    
    async def test_update_item_success(self, db_session, test_item):
        """Test updating item information."""
        # Arrange
        update_data = ItemUpdate(
            title="Updated Title",
            price=149.99,
            description="Updated description"
        )
        
        # Act
        updated_item = await item_service.update(db_session, test_item.id, update_data)
        
        # Assert
        assert updated_item.title == "Updated Title"
        assert updated_item.price == Decimal("149.99")
    
    async def test_update_item_not_found(self, db_session):
        """Test updating non-existent item."""
        # Arrange
        update_data = ItemUpdate(title="New Title")
        
        # Act & Assert
        with pytest.raises(NotFoundException) as exc:
            await item_service.update(db_session, 99999, update_data)
        
        assert "Item not found" in str(exc.value)
    
    async def test_delete_item_success(self, db_session, test_item):
        """Test deleting an item."""
        # Act
        await item_service.delete(db_session, item_id=test_item.id)
        
        # Assert - Item should no longer exist
        with pytest.raises(NotFoundException):
            await item_service.get_by_id(db_session, test_item.id)


class TestServiceEdgeCases:
    """Tests for edge cases in service layer."""
    
    async def test_create_item_with_extreme_values(self, db_session, test_user):
        """Test creating item with boundary values."""
        # Arrange
        extreme_data = {
            "title": "A" * 255,  # Max length
            "description": "",  # Empty description
            "price": 0.0,  # Zero price
            "tax": 999999.99,  # Very large tax
        }
        item_create = ItemCreate(**extreme_data)
        
        # Act
        item = await item_service.create_with_owner(
            db_session,
            item_create,
            owner_id=test_user.id
        )
        
        # Assert
        assert item.title == extreme_data["title"]
        assert item.price == Decimal("0.0")
    
    async def test_concurrent_user_update(self, db_session, test_user):
        """Test handling concurrent user updates."""
        # This would test optimistic locking or similar concurrency control
        # Implementation depends on your concurrency strategy
        
        # For now, we'll test basic update consistency
        update1 = UserUpdate(full_name="First Update")
        update2 = UserUpdate(full_name="Second Update")
        
        user1 = await user_service.update(db_session, test_user.id, update1)
        user2 = await user_service.update(db_session, test_user.id, update2)
        
        # Last update should win
        assert user2.full_name == "Second Update"
    
    @patch("app.services.item_service.cache")
    async def test_cache_integration(self, mock_cache, db_session, test_item):
        """Test service layer caching behavior."""
        # Arrange
        mock_cache.get.return_value = None  # Cache miss
        mock_cache.set.return_value = True
        
        # Act - First call should miss cache
        item1 = await item_service.get_by_id(db_session, test_item.id)
        
        # Simulate cache hit on second call
        mock_cache.get.return_value = test_item
        
        # Assert
        assert item1 is not None
        mock_cache.set.assert_called_once()


class TestValidationService:
    """Tests for validation logic in services."""
    
    async def test_email_validation(self, db_session):
        """Test email format validation."""
        invalid_emails = [
            "invalid",
            "invalid@",
            "invalid@domain",
            "@domain.com",
            "space @domain.com",
        ]
        
        for email in invalid_emails:
            user_data = {
                "email": email,
                "username": "testuser",
                "password": "validpass123",
                "full_name": "Test User"
            }
            
            with pytest.raises(ValidationException) as exc:
                user_create = UserCreate(**user_data)
                await user_service.create(db_session, user_create)
            
            assert "email" in str(exc.value).lower()
    
    async def test_password_validation(self, db_session):
        """Test password strength validation."""
        weak_passwords = [
            "short",  # Too short
            "nouppercase123",  # No uppercase
            "NOLOWERCASE123",  # No lowercase
            "NoNumbers",  # No numbers
        ]
        
        for password in weak_passwords:
            user_data = {
                "email": "test@example.com",
                "username": "testuser",
                "password": password,
                "full_name": "Test User"
            }
            
            with pytest.raises(ValidationException) as exc:
                user_create = UserCreate(**user_data)
                await user_service.create(db_session, user_create)
            
            assert "password" in str(exc.value).lower()