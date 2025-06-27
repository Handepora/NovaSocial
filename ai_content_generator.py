import os
import json
import logging
import requests
from typing import Dict, List, Optional
from encryption import encryption_service

class AIContentGenerator:
    """Unified AI content generation using multiple providers"""
    
    def __init__(self):
        self.supported_providers = ['openai', 'gemini', 'perplexity']
        self.provider_configs = {
            'openai': {
                'api_url': 'https://api.openai.com/v1/chat/completions',
                'model': 'gpt-4o',
                'headers_template': {
                    'Authorization': 'Bearer {api_key}',
                    'Content-Type': 'application/json'
                }
            },
            'gemini': {
                'api_url': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
                'model': 'gemini-2.5-flash',
                'headers_template': {
                    'Content-Type': 'application/json'
                }
            },
            'perplexity': {
                'api_url': 'https://api.perplexity.ai/chat/completions',
                'model': 'llama-3.1-sonar-small-128k-online',
                'headers_template': {
                    'Authorization': 'Bearer {api_key}',
                    'Content-Type': 'application/json'
                }
            }
        }
    
    def get_ai_credentials(self):
        """Get AI provider credentials from environment"""
        return {
            'openai': os.environ.get('OPENAI_API_KEY'),
            'gemini': os.environ.get('GEMINI_API_KEY'),
            'perplexity': os.environ.get('PERPLEXITY_API_KEY')
        }
    
    def generate_content(self, prompt: str, platform: str, provider: str = 'openai') -> Dict:
        """Generate content using specified AI provider"""
        try:
            credentials = self.get_ai_credentials()
            api_key = credentials.get(provider)
            
            if not api_key:
                return {
                    'success': False,
                    'error': f'API key para {provider} no configurada',
                    'requires_setup': True
                }
            
            # Platform-specific prompt enhancement
            enhanced_prompt = self._enhance_prompt_for_platform(prompt, platform)
            
            if provider == 'openai':
                return self._generate_with_openai(enhanced_prompt, api_key)
            elif provider == 'gemini':
                return self._generate_with_gemini(enhanced_prompt, api_key)
            elif provider == 'perplexity':
                return self._generate_with_perplexity(enhanced_prompt, api_key)
            else:
                return {
                    'success': False,
                    'error': f'Proveedor {provider} no soportado'
                }
                
        except Exception as e:
            logging.error(f"Error generating content: {e}")
            return {
                'success': False,
                'error': f'Error generando contenido: {str(e)}'
            }
    
    def _enhance_prompt_for_platform(self, prompt: str, platform: str) -> str:
        """Enhance prompt based on platform requirements"""
        platform_specs = {
            'linkedin': {
                'max_chars': 3000,
                'tone': 'profesional',
                'hashtags': 3,
                'features': 'enlaces, menciones profesionales'
            },
            'twitter': {
                'max_chars': 280,
                'tone': 'conciso y engaging',
                'hashtags': 2,
                'features': 'hilos si es necesario'
            },
            'instagram': {
                'max_chars': 2200,
                'tone': 'visual y atractivo',
                'hashtags': 10,
                'features': 'llamadas a la acción'
            },
            'facebook': {
                'max_chars': 63206,
                'tone': 'conversacional',
                'hashtags': 2,
                'features': 'engagement, preguntas'
            },
            'youtube': {
                'max_chars': 5000,
                'tone': 'descriptivo',
                'hashtags': 5,
                'features': 'timestamps, descripciones detalladas'
            },
            'tiktok': {
                'max_chars': 150,
                'tone': 'trending y divertido',
                'hashtags': 5,
                'features': 'trends, challenges'
            }
        }
        
        spec = platform_specs.get(platform, platform_specs['linkedin'])
        
        enhanced = f"""
Crea contenido para {platform.upper()} con estas especificaciones:
- Máximo {spec['max_chars']} caracteres
- Tono: {spec['tone']}
- Incluir {spec['hashtags']} hashtags relevantes
- Características: {spec['features']}

Contenido solicitado: {prompt}

Genera el contenido optimizado para {platform} con hashtags apropiados al final.
"""
        return enhanced
    
    def _generate_with_openai(self, prompt: str, api_key: str) -> Dict:
        """Generate content using OpenAI API"""
        config = self.provider_configs['openai']
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': config['model'],
            'messages': [
                {
                    'role': 'system',
                    'content': 'Eres un experto en marketing de redes sociales. Crea contenido atractivo y profesional.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'max_tokens': 1500,
            'temperature': 0.7
        }
        
        response = requests.post(config['api_url'], headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            return {
                'success': True,
                'content': content,
                'provider': 'openai',
                'model': config['model']
            }
        else:
            return {
                'success': False,
                'error': f'Error de OpenAI API: {response.status_code}',
                'details': response.text
            }
    
    def _generate_with_gemini(self, prompt: str, api_key: str) -> Dict:
        """Generate content using Gemini API"""
        config = self.provider_configs['gemini']
        url = f"{config['api_url']}?key={api_key}"
        
        headers = {'Content-Type': 'application/json'}
        
        payload = {
            'contents': [
                {
                    'parts': [
                        {
                            'text': f"Eres un experto en marketing de redes sociales. {prompt}"
                        }
                    ]
                }
            ],
            'generationConfig': {
                'temperature': 0.7,
                'maxOutputTokens': 1500
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            content = data['candidates'][0]['content']['parts'][0]['text']
            
            return {
                'success': True,
                'content': content,
                'provider': 'gemini',
                'model': config['model']
            }
        else:
            return {
                'success': False,
                'error': f'Error de Gemini API: {response.status_code}',
                'details': response.text
            }
    
    def _generate_with_perplexity(self, prompt: str, api_key: str) -> Dict:
        """Generate content using Perplexity API"""
        config = self.provider_configs['perplexity']
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': config['model'],
            'messages': [
                {
                    'role': 'system',
                    'content': 'Eres un experto en marketing de redes sociales. Crea contenido atractivo basado en información actualizada.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'max_tokens': 1500,
            'temperature': 0.7,
            'search_recency_filter': 'month'
        }
        
        response = requests.post(config['api_url'], headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            return {
                'success': True,
                'content': content,
                'provider': 'perplexity',
                'model': config['model'],
                'citations': data.get('citations', [])
            }
        else:
            return {
                'success': False,
                'error': f'Error de Perplexity API: {response.status_code}',
                'details': response.text
            }
    
    def get_available_providers(self) -> List[str]:
        """Get list of providers with configured API keys"""
        credentials = self.get_ai_credentials()
        return [provider for provider, key in credentials.items() if key]

# Global content generator instance
content_generator = AIContentGenerator()