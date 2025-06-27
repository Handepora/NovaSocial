import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

class APIKeyEncryption:
    """Secure encryption for API keys using Fernet symmetric encryption"""
    
    def __init__(self):
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key)
    
    def _get_or_create_key(self):
        """Get existing encryption key or create a new one"""
        # Use a combination of environment variables to create a stable key
        password = os.environ.get("SESSION_SECRET", "default-secret-key")
        salt = b'social_media_dashboard_salt'  # Static salt for consistency
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def encrypt_api_key(self, api_key):
        """Encrypt an API key"""
        if not api_key:
            return None
        try:
            encrypted_key = self.cipher.encrypt(api_key.encode())
            return base64.urlsafe_b64encode(encrypted_key).decode()
        except Exception as e:
            logging.error(f"Error encrypting API key: {e}")
            return None
    
    def decrypt_api_key(self, encrypted_key):
        """Decrypt an API key"""
        if not encrypted_key:
            return None
        try:
            encrypted_data = base64.urlsafe_b64decode(encrypted_key.encode())
            decrypted_key = self.cipher.decrypt(encrypted_data)
            return decrypted_key.decode()
        except Exception as e:
            logging.error(f"Error decrypting API key: {e}")
            return None
    
    def encrypt_credentials(self, credentials_dict):
        """Encrypt a dictionary of credentials"""
        encrypted_creds = {}
        for key, value in credentials_dict.items():
            if value and isinstance(value, str):
                encrypted_creds[key] = self.encrypt_api_key(value)
            else:
                encrypted_creds[key] = value
        return encrypted_creds
    
    def decrypt_credentials(self, encrypted_creds):
        """Decrypt a dictionary of credentials"""
        decrypted_creds = {}
        for key, value in encrypted_creds.items():
            if value and isinstance(value, str) and key in ['api_key', 'api_secret', 'access_token']:
                decrypted_creds[key] = self.decrypt_api_key(value)
            else:
                decrypted_creds[key] = value
        return decrypted_creds

# Global encryption instance
encryption_service = APIKeyEncryption()