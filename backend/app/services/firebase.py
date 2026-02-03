"""
Firebase service for authentication
"""
import firebase_admin
from firebase_admin import auth, credentials
from typing import Optional, Dict, Any
from fastapi import HTTPException, status

from app.core.config import settings


class FirebaseService:
    _instance = None
    
    def __init__(self):
        if not firebase_admin._apps:
            try:
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                    "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "client_id": settings.FIREBASE_CLIENT_ID,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL}"
                })
                firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"Firebase initialization error: {e}")
                raise
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication credentials: {str(e)}"
            )
    
    async def get_user(self, firebase_uid: str) -> Dict[str, Any]:
        """Get user from Firebase"""
        try:
            user = auth.get_user(firebase_uid)
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "photo_url": user.photo_url,
                "email_verified": user.email_verified,
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {str(e)}"
            )
    
    async def create_user(self, email: str, password: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """Create a new Firebase user"""
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name,
                email_verified=False
            )
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create user: {str(e)}"
            )
    
    async def update_user(self, firebase_uid: str, **kwargs) -> Dict[str, Any]:
        """Update Firebase user"""
        try:
            user = auth.update_user(firebase_uid, **kwargs)
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "photo_url": user.photo_url,
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update user: {str(e)}"
            )