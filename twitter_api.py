import requests
import base64
import json
from typing import Dict, Optional


class TwitterAPI:
    """Real Twitter API v2 integration"""
    
    def __init__(self, api_key: str, api_secret: str, bearer_token: str, 
                 access_token: str, access_token_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.bearer_token = bearer_token
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        self.base_url = "https://api.twitter.com/2"
    
    def get_user_profile(self) -> Optional[Dict]:
        """Get authenticated user's profile information"""
        try:
            # Use Bearer Token for API v2
            headers = {
                'Authorization': f'Bearer {self.bearer_token}',
                'Content-Type': 'application/json'
            }
            
            # Get user's own profile using /users/me endpoint
            url = f"{self.base_url}/users/me"
            params = {
                'user.fields': 'id,name,username,description,public_metrics,verified,profile_image_url'
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user_data = data.get('data', {})
                
                return {
                    'username': f"@{user_data.get('username', '')}",
                    'display_name': user_data.get('name', ''),
                    'follower_count': user_data.get('public_metrics', {}).get('followers_count', 0),
                    'verified': user_data.get('verified', False),
                    'profile_image': user_data.get('profile_image_url', ''),
                    'description': user_data.get('description', ''),
                    'user_id': user_data.get('id', ''),
                    'api_response': True
                }
            else:
                print(f"Twitter API Error: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return None
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return None
    
    def test_connection(self) -> Dict:
        """Test if the API credentials are valid"""
        try:
            profile = self.get_user_profile()
            if profile:
                return {
                    'status': 'success',
                    'message': 'Conexión exitosa con Twitter API',
                    'profile': profile
                }
            else:
                return {
                    'status': 'error',
                    'message': 'No se pudo conectar con Twitter API. Verifica tus credenciales.'
                }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error de conexión: {str(e)}'
            }
    
    def post_tweet(self, text: str) -> Dict:
        """Post a tweet using Twitter API v2"""
        try:
            # This would require OAuth 1.0a for posting
            # For now, return simulation since posting requires more complex auth
            return {
                'status': 'simulated',
                'message': f'Tweet simulado: "{text[:50]}..."',
                'note': 'Publicación real requiere OAuth 1.0a implementation'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error al publicar: {str(e)}'
            }


def create_twitter_client(credentials: Dict) -> Optional[TwitterAPI]:
    """Create TwitterAPI client from credentials dictionary"""
    try:
        return TwitterAPI(
            api_key=credentials.get('api_key', ''),
            api_secret=credentials.get('api_secret', ''),
            bearer_token=credentials.get('bearer_token', ''),
            access_token=credentials.get('access_token', ''),
            access_token_secret=credentials.get('access_token_secret', '')
        )
    except Exception as e:
        print(f"Error creating Twitter client: {str(e)}")
        return None