import os
import logging
import re
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import uuid
from encryption import encryption_service
from ai_content_generator import content_generator

# Configure logging
logging.basicConfig(level=logging.DEBUG)

def process_twitter_content(content):
    """Process Twitter content to extract clean text and hashtags"""
    # Remove meta-text like "¡Claro Aquí tienes" or "Here's a tweet"
    meta_phrases = [
        r'¡claro[^"]*"',
        r'aquí tienes[^"]*"',
        r'here\'s[^"]*:',
        r'here is[^"]*:',
        r'"[^"]*puedes hacerme[^"]*"',
        r'tweet sobre[^"]*:',
        r'contenido[^"]*para twitter[^"]*:'
    ]
    
    cleaned_content = content
    for phrase in meta_phrases:
        cleaned_content = re.sub(phrase, '', cleaned_content, flags=re.IGNORECASE)
    
    # Extract hashtags
    hashtag_pattern = r'#\w+'
    hashtags = re.findall(hashtag_pattern, cleaned_content)
    
    # Remove hashtags from main content for cleaner display
    main_content = re.sub(hashtag_pattern, '', cleaned_content).strip()
    
    # Clean up extra quotes and formatting
    main_content = re.sub(r'^["\'"]*|["\'"]*$', '', main_content).strip()
    main_content = re.sub(r'\n+', ' ', main_content).strip()
    
    # If content is still too meta or empty, create a simple fallback
    if not main_content or len(main_content) < 10 or 'puedes hacerme' in main_content.lower():
        main_content = "Contenido generado automáticamente"
    
    return main_content, hashtags

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Enable CORS for API endpoints
CORS(app)

# In-memory storage for social media accounts, AI providers, and scheduled posts
AI_PROVIDERS = [
    {
        "id": 1,
        "name": "openai",
        "display_name": "OpenAI GPT-4o",
        "encrypted_api_key": None,
        "status": "disconnected",
        "is_default": True,
        "model": "gpt-4o",
        "last_tested": None
    },
    {
        "id": 2,
        "name": "gemini",
        "display_name": "Google Gemini 2.5 Flash",
        "encrypted_api_key": None,
        "status": "disconnected",
        "is_default": False,
        "model": "gemini-2.5-flash",
        "last_tested": None
    },
    {
        "id": 3,
        "name": "perplexity",
        "display_name": "Perplexity Sonar",
        "encrypted_api_key": None,
        "status": "disconnected",
        "is_default": False,
        "model": "llama-3.1-sonar-small-128k-online",
        "last_tested": None
    }
]

def initialize_ai_providers():
    """Initialize AI providers by decrypting stored API keys"""
    for provider in AI_PROVIDERS:
        if provider.get('encrypted_api_key'):
            try:
                # Decrypt the API key and set environment variable
                decrypted_key = encryption_service.decrypt_api_key(provider['encrypted_api_key'])
                if decrypted_key:  # Check if decryption was successful
                    env_key = f"{provider['name'].upper()}_API_KEY"
                    os.environ[env_key] = decrypted_key
                    provider['status'] = 'connected'
            except Exception as e:
                logging.error(f"Failed to decrypt API key for {provider['name']}: {e}")
                provider['status'] = 'error'

# Initialize AI providers on startup
initialize_ai_providers()

SOCIAL_ACCOUNTS = [
    {
        "id": 1,
        "platform": "linkedin",
        "account_name": "@mi-empresa",
        "display_name": "Mi Empresa - LinkedIn",
        "status": "connected",
        "auto_posting": True,
        "is_default": True,
        "connected_date": "2025-06-20T10:00:00",
        "has_api": True,
        "encrypted_credentials": None
    },
    {
        "id": 2,
        "platform": "twitter",
        "account_name": "@mi_empresa",
        "display_name": "Mi Empresa - Twitter",
        "status": "connected",
        "auto_posting": True,
        "is_default": True,
        "connected_date": "2025-06-21T14:30:00",
        "has_api": True,
        "encrypted_credentials": None
    },
    {
        "id": 3,
        "platform": "instagram",
        "account_name": "@mi.empresa",
        "display_name": "Mi Empresa - Instagram",
        "status": "pending",
        "auto_posting": False,
        "is_default": False,
        "connected_date": "2025-06-27T09:00:00",
        "has_api": False,
        "encrypted_credentials": None
    }
]

SCHEDULED_POSTS = [
    {
        "id": 1,
        "title": "Anuncio de nuevo producto innovador",
        "content": "¡Estamos emocionados de presentar nuestro último producto que revolucionará la industria!",
        "platform": "linkedin",
        "scheduled_date": "2025-06-27T10:00:00",
        "status": "scheduled",
        "engagement": 245,
        "reach": 1250,
        "created_at": "2025-06-27T08:00:00",
        "timezone": "UTC"
    },
    {
        "id": 2,
        "title": "Tips para mejorar productividad",
        "content": "5 consejos que cambiarán tu forma de trabajar #ProductividadTips",
        "platform": "twitter",
        "scheduled_date": "2025-06-27T14:30:00",
        "status": "scheduled",
        "engagement": 189,
        "reach": 890,
        "created_at": "2025-06-27T09:15:00",
        "timezone": "UTC"
    },
    {
        "id": 3,
        "title": "Behind the scenes de nuestro equipo",
        "content": "Conoce a las personas increíbles que hacen posible nuestros proyectos",
        "platform": "instagram",
        "scheduled_date": "2025-06-27T18:00:00",
        "status": "scheduled",
        "engagement": 312,
        "reach": 1580,
        "created_at": "2025-06-27T10:30:00",
        "timezone": "UTC"
    }
]

MOCK_PENDING_POSTS = [
    {
        "id": 4,
        "title": "Reflexiones sobre el futuro del trabajo remoto",
        "content": "El trabajo remoto ha cambiado nuestras vidas. Aquí mis reflexiones sobre hacia dónde nos dirigimos.",
        "platform": "linkedin",
        "status": "pending",
        "created_date": "2025-06-26T15:30:00"
    },
    {
        "id": 5,
        "title": "Celebrando nuestros logros del trimestre",
        "content": "¡Increíbles resultados este trimestre! Gracias a todo el equipo por su dedicación.",
        "platform": "twitter",
        "status": "pending",
        "created_date": "2025-06-26T16:45:00"
    }
]

MOCK_ANALYTICS = {
    "followers_growth": [
        {"date": "2025-06-01", "linkedin": 1200, "twitter": 850, "instagram": 2100},
        {"date": "2025-06-07", "linkedin": 1250, "twitter": 890, "instagram": 2180},
        {"date": "2025-06-14", "linkedin": 1300, "twitter": 920, "instagram": 2250},
        {"date": "2025-06-21", "linkedin": 1380, "twitter": 950, "instagram": 2320},
        {"date": "2025-06-27", "linkedin": 1420, "twitter": 980, "instagram": 2400}
    ],
    "engagement_rates": {
        "linkedin": 4.2,
        "twitter": 3.8,
        "instagram": 5.1
    },
    "weekly_interactions": [120, 135, 158, 142, 167, 189, 201]
}

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/posts')
def get_posts():
    """Get all scheduled posts"""
    return jsonify(SCHEDULED_POSTS)

@app.route('/api/posts/today')
def get_today_posts():
    """Get posts scheduled for today"""
    today = datetime.now().date()
    today_posts = [
        post for post in SCHEDULED_POSTS 
        if datetime.fromisoformat(post['scheduled_date'].replace('Z', '+00:00')).date() == today
    ]
    return jsonify(today_posts)

@app.route('/api/posts/pending')
def get_pending_posts():
    """Get posts pending approval"""
    return jsonify(MOCK_PENDING_POSTS)

@app.route('/api/analytics')
def get_analytics():
    """Get analytics data"""
    return jsonify(MOCK_ANALYTICS)

@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    """Generate content using AI providers"""
    try:
        data = request.get_json()
        topic = data.get('topic', 'tecnología')
        platforms = data.get('platforms', ['linkedin'])
        provider = data.get('provider', 'openai')
        
        # Check if provider has API key configured
        ai_provider = next((p for p in AI_PROVIDERS if p['name'] == provider), None)
        logging.debug(f"AI Provider found: {ai_provider}")
        
        if not ai_provider:
            return jsonify({
                "status": "error",
                "error": f"Proveedor {provider} no encontrado",
                "requires_setup": True,
                "available_providers": [p['name'] for p in AI_PROVIDERS]
            }), 400
            
        if ai_provider['status'] != 'connected':
            return jsonify({
                "status": "error",
                "error": f"Proveedor {provider} no configurado. Estado actual: {ai_provider['status']}",
                "requires_setup": True,
                "available_providers": [p['name'] for p in AI_PROVIDERS if p['status'] == 'connected']
            }), 400
        
        # Generate content for each platform
        response = {
            "status": "success",
            "topic": topic,
            "provider": provider,
            "content": {},
            "hashtags": {},
            "generated_at": datetime.now().isoformat()
        }
        
        for platform in platforms:
            prompt = f"Crea contenido sobre '{topic}' para {platform}"
            logging.debug(f"Generating content for {platform} with provider {provider}")
            
            result = content_generator.generate_content(prompt, platform, provider)
            logging.debug(f"Generation result for {platform}: {result}")
            
            if result and result.get('success'):
                content = result['content']
                
                # Special processing for Twitter
                if platform == 'twitter':
                    main_content, hashtags_found = process_twitter_content(content)
                else:
                    # Extract hashtags from content if present
                    if '#' in content:
                        parts = content.split('#')
                        main_content = parts[0].strip()
                        hashtags_found = ['#' + tag.split()[0] for tag in parts[1:] if tag.strip()]
                    else:
                        main_content = content
                        hashtags_found = []
                
                response["content"][platform] = main_content
                response["hashtags"][platform] = hashtags_found
                
                # Add citations if from Perplexity
                if provider == 'perplexity' and 'citations' in result:
                    response["citations"] = result['citations']
            else:
                error_msg = result.get('error', 'Error desconocido') if result else 'No se recibió respuesta'
                logging.error(f"Content generation failed for {platform}: {error_msg}")
                response["content"][platform] = f"Error generando contenido: {error_msg}"
                response["hashtags"][platform] = []
                response["status"] = "error"
        
        logging.debug(f"Final response: {response}")
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Exception in generate_content: {str(e)}")
        return jsonify({
            "status": "error",
            "error": f"Error interno del servidor: {str(e)}"
        }), 500

@app.route('/api/ai-providers/status', methods=['GET'])
def get_ai_providers_status():
    """Get current status of all AI providers"""
    return jsonify({
        "providers": AI_PROVIDERS,
        "environment_keys": {
            "openai": bool(os.environ.get('OPENAI_API_KEY')),
            "gemini": bool(os.environ.get('GEMINI_API_KEY')),
            "perplexity": bool(os.environ.get('PERPLEXITY_API_KEY'))
        }
    })

# Default prompt configurations
DEFAULT_PROMPTS = {
    "system_prompt": "Eres un experto en marketing de redes sociales. Crea contenido atractivo basado en información actualizada.",
    "platform_prompts": {
        "twitter": "Máximo 280 caracteres INCLUYENDO hashtags. Tono conciso y engaging. Contenido directo, sin meta-texto ni explicaciones. No incluyas frases como 'Aquí tienes' o '¡Claro!'.",
        "linkedin": "Máximo 3000 caracteres. Tono profesional. Incluir enlaces y menciones profesionales cuando sea apropiado.",
        "instagram": "Máximo 2200 caracteres. Tono visual y atractivo. Incluir llamadas a la acción. Usar hasta 10 hashtags relevantes.",
        "web": "Contenido informativo y detallado. Estructura con títulos y subtítulos. Incluir introducción, desarrollo y conclusión."
    },
    "tone_prompts": {
        "professional": "Formal, informativo, con terminología especializada cuando sea apropiado. Evitar jerga coloquial.",
        "casual": "Conversacional, amigable, cercano. Usar lenguaje cotidiano y expresiones naturales.",
        "humorous": "Divertido, con humor apropiado. Incluir elementos que generen sonrisas sin ofender.",
        "inspirational": "Motivador, positivo, que impulse a la acción. Usar mensajes de empoderamiento y crecimiento."
    }
}

# Store prompt settings in memory (in production, use database)
PROMPT_SETTINGS = DEFAULT_PROMPTS.copy()

@app.route('/api/prompt-settings', methods=['GET'])
def get_prompt_settings():
    """Get current prompt settings"""
    return jsonify({
        "success": True,
        "settings": PROMPT_SETTINGS
    })

@app.route('/api/prompt-settings/system', methods=['POST'])
def update_system_prompt():
    """Update system prompt"""
    try:
        data = request.get_json()
        system_prompt = data.get('system_prompt', '').strip()
        
        if not system_prompt:
            return jsonify({
                "success": False,
                "error": "El prompt del sistema no puede estar vacío"
            }), 400
        
        PROMPT_SETTINGS['system_prompt'] = system_prompt
        logging.info(f"System prompt updated: {system_prompt[:100]}...")
        
        return jsonify({
            "success": True,
            "message": "Prompt del sistema actualizado correctamente"
        })
        
    except Exception as e:
        logging.error(f"Error updating system prompt: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@app.route('/api/prompt-settings/platforms', methods=['POST'])
def update_platform_prompts():
    """Update platform-specific prompts"""
    try:
        data = request.get_json()
        platform_prompts = data.get('platform_prompts', {})
        
        # Validate platform prompts
        valid_platforms = ['twitter', 'linkedin', 'instagram', 'web']
        for platform, prompt in platform_prompts.items():
            if platform not in valid_platforms:
                return jsonify({
                    "success": False,
                    "error": f"Plataforma no válida: {platform}"
                }), 400
            
            if not prompt.strip():
                return jsonify({
                    "success": False,
                    "error": f"El prompt para {platform} no puede estar vacío"
                }), 400
        
        PROMPT_SETTINGS['platform_prompts'].update(platform_prompts)
        logging.info(f"Platform prompts updated for: {list(platform_prompts.keys())}")
        
        return jsonify({
            "success": True,
            "message": "Prompts de plataforma actualizados correctamente"
        })
        
    except Exception as e:
        logging.error(f"Error updating platform prompts: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@app.route('/api/prompt-settings/tones', methods=['POST'])
def update_tone_prompts():
    """Update tone-specific prompts"""
    try:
        data = request.get_json()
        tone_prompts = data.get('tone_prompts', {})
        
        # Validate tone prompts
        valid_tones = ['professional', 'casual', 'humorous', 'inspirational']
        for tone, prompt in tone_prompts.items():
            if tone not in valid_tones:
                return jsonify({
                    "success": False,
                    "error": f"Tono no válido: {tone}"
                }), 400
            
            if not prompt.strip():
                return jsonify({
                    "success": False,
                    "error": f"El prompt para el tono {tone} no puede estar vacío"
                }), 400
        
        PROMPT_SETTINGS['tone_prompts'].update(tone_prompts)
        logging.info(f"Tone prompts updated for: {list(tone_prompts.keys())}")
        
        return jsonify({
            "success": True,
            "message": "Configuración de tonos actualizada correctamente"
        })
        
    except Exception as e:
        logging.error(f"Error updating tone prompts: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@app.route('/api/prompt-settings/reset', methods=['POST'])
def reset_prompts_to_default():
    """Reset all prompts to default values"""
    try:
        global PROMPT_SETTINGS
        PROMPT_SETTINGS = DEFAULT_PROMPTS.copy()
        logging.info("All prompts reset to default values")
        
        return jsonify({
            "success": True,
            "message": "Todos los prompts han sido restaurados a sus valores predeterminados",
            "settings": PROMPT_SETTINGS
        })
        
    except Exception as e:
        logging.error(f"Error resetting prompts: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@app.route('/api/adapt-content', methods=['POST'])
def adapt_content():
    """Adapt existing content for different social media platforms"""
    try:
        data = request.get_json()
        
        original_content = data.get('original_content', '').strip()
        style = data.get('style', 'summary')
        tone = data.get('tone', 'professional')
        platforms = data.get('platforms', [])
        provider = data.get('provider', 'perplexity')
        focus = data.get('focus', 'engagement')
        
        if not original_content:
            return jsonify({
                "status": "error",
                "error": "El contenido original es requerido"
            }), 400
            
        if not platforms:
            return jsonify({
                "status": "error", 
                "error": "Selecciona al menos una plataforma"
            }), 400
        
        # Check if provider has API key configured
        ai_provider = next((p for p in AI_PROVIDERS if p['name'] == provider), None)
        logging.debug(f"AI Provider found: {ai_provider}")
        
        if not ai_provider:
            return jsonify({
                "status": "error",
                "error": f"Proveedor {provider} no encontrado",
                "requires_setup": True,
                "available_providers": [p['name'] for p in AI_PROVIDERS]
            }), 400
            
        if ai_provider['status'] != 'connected':
            return jsonify({
                "status": "error",
                "error": f"Proveedor {provider} no configurado. Estado actual: {ai_provider['status']}",
                "requires_setup": True,
                "available_providers": [p['name'] for p in AI_PROVIDERS if p['status'] == 'connected']
            }), 400
        
        # Generate adapted content for each platform
        response = {
            "status": "success",
            "original_content": original_content,
            "style": style,
            "tone": tone,
            "provider": provider,
            "adapted_content": {},
            "generated_at": datetime.now().isoformat()
        }
        
        for platform in platforms:
            logging.debug(f"Adapting content for {platform} with provider {provider}")
            
            # Create adaptation prompt
            adaptation_prompt = create_adaptation_prompt(original_content, platform, style, tone, focus)
            
            result = content_generator.generate_content(adaptation_prompt, platform, provider)
            logging.debug(f"Adaptation result for {platform}: {result}")
            
            if result and result.get('success'):
                content = result['content']
                
                # Special processing for Twitter
                if platform == 'twitter':
                    main_content, hashtags_found = process_twitter_content(content)
                else:
                    # Extract hashtags from content if present
                    if '#' in content:
                        parts = content.split('#')
                        main_content = parts[0].strip()
                        hashtags_found = ['#' + tag.split()[0] for tag in parts[1:] if tag.strip()]
                    else:
                        main_content = content
                        hashtags_found = []
                
                response["adapted_content"][platform] = {
                    "content": main_content,
                    "hashtags": hashtags_found
                }
                
                # Add citations if from Perplexity
                if provider == 'perplexity' and 'citations' in result:
                    response["citations"] = result['citations']
            else:
                error_msg = result.get('error', 'Error desconocido') if result else 'No se recibió respuesta'
                logging.error(f"Content adaptation failed for {platform}: {error_msg}")
                response["adapted_content"][platform] = {
                    "content": f"Error adaptando contenido: {error_msg}",
                    "hashtags": []
                }
                response["status"] = "error"
        
        logging.debug(f"Final adaptation response: {response}")
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Exception in adapt_content: {str(e)}")
        return jsonify({
            "status": "error",
            "error": f"Error interno del servidor: {str(e)}"
        }), 500

def create_adaptation_prompt(original_content, platform, style, tone, focus):
    """Create a specific prompt for content adaptation"""
    
    # Style descriptions
    style_descriptions = {
        'summary': 'un resumen conciso y atractivo',
        'highlights': 'los puntos clave más importantes',
        'questions': 'preguntas engaging que generen interacción',
        'story': 'formato de historia narrativa',
        'tips': 'tips o consejos prácticos'
    }
    
    # Focus descriptions
    focus_descriptions = {
        'engagement': 'máximo engagement e interacción',
        'information': 'valor informativo y educativo',
        'viral': 'potencial viral y compartible',
        'educational': 'contenido educativo y formativo'
    }
    
    style_desc = style_descriptions.get(style, 'contenido adaptado')
    focus_desc = focus_descriptions.get(focus, 'engagement')
    
    # Platform-specific adaptations
    platform_specs = {
        'twitter': 'Tweet de máximo 280 caracteres con 2 hashtags relevantes',
        'linkedin': 'Post profesional de LinkedIn (hasta 3000 caracteres) con 3 hashtags',
        'instagram': 'Post de Instagram visual y atractivo (hasta 2200 caracteres) con 10 hashtags',
        'facebook': 'Post de Facebook conversacional (hasta 63000 caracteres) con 2 hashtags',
        'youtube': 'Descripción de YouTube detallada (hasta 5000 caracteres) con 5 hashtags',
        'web': 'Artículo web estructurado con títulos y subtítulos (hasta 5000 caracteres)'
    }
    
    platform_spec = platform_specs.get(platform, 'contenido para redes sociales')
    
    prompt = f"""
Adapta el siguiente contenido original para crear {style_desc} optimizado para {platform_spec}.

CONTENIDO ORIGINAL:
{original_content}

INSTRUCCIONES:
- Crea {style_desc} del contenido original
- Tono: {tone}
- Enfoque: {focus_desc}
- Plataforma: {platform}
- Mantén la información clave y el valor del contenido original
- Hazlo nativo y natural para {platform}
- Incluye hashtags relevantes al final

Genera ÚNICAMENTE el contenido adaptado listo para publicar.
"""
    
    return prompt

@app.route('/api/posts/approve/<int:post_id>', methods=['POST'])
def approve_post(post_id):
    """Approve a pending post"""
    # In a real app, this would update the database
    return jsonify({"status": "approved", "post_id": post_id})

@app.route('/api/posts/reject/<int:post_id>', methods=['POST'])
def reject_post(post_id):
    """Reject a pending post"""
    # In a real app, this would update the database
    return jsonify({"status": "rejected", "post_id": post_id})

# Real-time scheduling endpoints
@app.route('/api/posts/schedule', methods=['POST'])
def schedule_post():
    """Schedule a new post"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'content', 'platform', 'scheduled_date']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create new post
        new_post = {
            "id": len(SCHEDULED_POSTS) + len(MOCK_PENDING_POSTS) + 1,
            "title": data['title'],
            "content": data['content'],
            "platform": data['platform'],
            "scheduled_date": data['scheduled_date'],
            "status": "scheduled",
            "engagement": 0,
            "reach": 0,
            "created_at": datetime.now().isoformat(),
            "timezone": data.get('timezone', 'UTC')
        }
        
        SCHEDULED_POSTS.append(new_post)
        
        return jsonify({
            "status": "success", 
            "message": "Post scheduled successfully",
            "post": new_post
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_scheduled_post(post_id):
    """Update a scheduled post"""
    try:
        data = request.get_json()
        
        # Find the post
        post_index = None
        for i, post in enumerate(SCHEDULED_POSTS):
            if post['id'] == post_id:
                post_index = i
                break
        
        if post_index is None:
            return jsonify({"error": "Post not found"}), 404
        
        # Update the post
        post = SCHEDULED_POSTS[post_index]
        for field in ['title', 'content', 'platform', 'scheduled_date', 'timezone']:
            if field in data:
                post[field] = data[field]
        
        post['updated_at'] = datetime.now().isoformat()
        
        return jsonify({
            "status": "success",
            "message": "Post updated successfully",
            "post": post
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_scheduled_post(post_id):
    """Delete a scheduled post"""
    try:
        # Find and remove the post
        for i, post in enumerate(SCHEDULED_POSTS):
            if post['id'] == post_id:
                deleted_post = SCHEDULED_POSTS.pop(i)
                return jsonify({
                    "status": "success",
                    "message": "Post deleted successfully",
                    "post": deleted_post
                })
        
        return jsonify({"error": "Post not found"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/calendar/<int:year>/<int:month>')
def get_calendar_posts(year, month):
    """Get posts for a specific month for calendar view"""
    try:
        # Filter posts for the specified month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        calendar_posts = []
        for post in SCHEDULED_POSTS:
            post_date = datetime.fromisoformat(post['scheduled_date'].replace('Z', '+00:00'))
            if start_date <= post_date < end_date:
                calendar_posts.append({
                    "id": post['id'],
                    "title": post['title'],
                    "platform": post['platform'],
                    "scheduled_date": post['scheduled_date'],
                    "status": post['status']
                })
        
        return jsonify({
            "year": year,
            "month": month,
            "posts": calendar_posts
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/upcoming')
def get_upcoming_posts():
    """Get posts scheduled for the next 7 days"""
    try:
        now = datetime.now()
        week_later = now + timedelta(days=7)
        
        upcoming_posts = []
        for post in SCHEDULED_POSTS:
            post_date = datetime.fromisoformat(post['scheduled_date'].replace('Z', '+00:00'))
            if now <= post_date <= week_later:
                upcoming_posts.append(post)
        
        # Sort by scheduled date
        upcoming_posts.sort(key=lambda x: x['scheduled_date'])
        
        return jsonify(upcoming_posts)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Social Media Account Management Endpoints
@app.route('/api/accounts')
def get_accounts():
    """Get all social media accounts"""
    return jsonify(SOCIAL_ACCOUNTS)

@app.route('/api/accounts', methods=['POST'])
def add_account():
    """Add a new social media account"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['platform', 'account_name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create new account
        new_account = {
            "id": len(SOCIAL_ACCOUNTS) + 1,
            "platform": data['platform'],
            "account_name": data['account_name'],
            "display_name": data.get('display_name', f"{data['account_name']} - {data['platform'].title()}"),
            "status": "connected" if data.get('has_api', False) else "pending",
            "auto_posting": data.get('auto_posting', False),
            "is_default": data.get('is_default', False),
            "connected_date": datetime.now().isoformat(),
            "has_api": data.get('has_api', False),
            "encrypted_credentials": None
        }
        
        # Encrypt and store API credentials if provided
        if data.get('api_key') or data.get('api_secret'):
            credentials = {
                'api_key': data.get('api_key'),
                'api_secret': data.get('api_secret'),
                'access_token': data.get('access_token'),
                'webhook_url': data.get('webhook_url')
            }
            new_account['encrypted_credentials'] = encryption_service.encrypt_credentials(credentials)
        
        # If this is set as default, remove default from other accounts of same platform
        if new_account['is_default']:
            for account in SOCIAL_ACCOUNTS:
                if account['platform'] == new_account['platform']:
                    account['is_default'] = False
        
        SOCIAL_ACCOUNTS.append(new_account)
        
        return jsonify({
            "status": "success",
            "message": "Cuenta agregada exitosamente",
            "account": new_account
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/accounts/<int:account_id>', methods=['PUT'])
def update_account(account_id):
    """Update a social media account"""
    try:
        data = request.get_json()
        
        # Find the account
        account_index = None
        for i, account in enumerate(SOCIAL_ACCOUNTS):
            if account['id'] == account_id:
                account_index = i
                break
        
        if account_index is None:
            return jsonify({"error": "Account not found"}), 404
        
        account = SOCIAL_ACCOUNTS[account_index]
        
        # Update account fields
        updatable_fields = ['account_name', 'display_name', 'auto_posting', 'is_default', 'status']
        for field in updatable_fields:
            if field in data:
                account[field] = data[field]
        
        # Handle default account logic
        if account.get('is_default'):
            for other_account in SOCIAL_ACCOUNTS:
                if other_account['platform'] == account['platform'] and other_account['id'] != account_id:
                    other_account['is_default'] = False
        
        account['updated_at'] = datetime.now().isoformat()
        
        return jsonify({
            "status": "success",
            "message": "Cuenta actualizada exitosamente",
            "account": account
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/accounts/<int:account_id>', methods=['DELETE'])
def delete_account(account_id):
    """Delete a social media account"""
    try:
        # Find and remove the account
        for i, account in enumerate(SOCIAL_ACCOUNTS):
            if account['id'] == account_id:
                deleted_account = SOCIAL_ACCOUNTS.pop(i)
                return jsonify({
                    "status": "success",
                    "message": "Cuenta eliminada exitosamente",
                    "account": deleted_account
                })
        
        return jsonify({"error": "Account not found"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/accounts/<int:account_id>/test', methods=['POST'])
def test_account_connection(account_id):
    """Test connection to a social media account"""
    try:
        # Find the account
        account = None
        for acc in SOCIAL_ACCOUNTS:
            if acc['id'] == account_id:
                account = acc
                break
        
        if not account:
            return jsonify({"error": "Account not found"}), 404
        
        # Simulate API connection test
        import random
        success = random.choice([True, True, True, False])  # 75% success rate for demo
        
        if success:
            account['status'] = 'connected'
            account['last_tested'] = datetime.now().isoformat()
            return jsonify({
                "status": "success",
                "message": f"Conexión exitosa con {account['platform']}",
                "account": account
            })
        else:
            account['status'] = 'error'
            account['last_tested'] = datetime.now().isoformat()
            return jsonify({
                "status": "error",
                "message": f"Error al conectar con {account['platform']}. Verifica las credenciales.",
                "account": account
            }), 400
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/accounts/stats')
def get_accounts_stats():
    """Get account statistics"""
    try:
        connected = len([acc for acc in SOCIAL_ACCOUNTS if acc['status'] == 'connected'])
        pending = len([acc for acc in SOCIAL_ACCOUNTS if acc['status'] == 'pending'])
        error = len([acc for acc in SOCIAL_ACCOUNTS if acc['status'] == 'error'])
        
        return jsonify({
            "connected": connected,
            "pending": pending,
            "error": error,
            "total": len(SOCIAL_ACCOUNTS)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# AI Provider Management Endpoints
@app.route('/api/ai-providers')
def get_ai_providers():
    """Get all AI providers"""
    # Check environment variables and update status
    for provider in AI_PROVIDERS:
        env_key = f"{provider['name'].upper()}_API_KEY"
        has_key = os.environ.get(env_key) is not None
        provider['status'] = 'connected' if has_key else 'disconnected'
    
    return jsonify(AI_PROVIDERS)

@app.route('/api/ai-providers/<provider_name>', methods=['PUT'])
def update_ai_provider(provider_name):
    """Update AI provider credentials"""
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        
        if not api_key:
            return jsonify({"error": "API key is required"}), 400
        
        # Find the provider
        provider = next((p for p in AI_PROVIDERS if p['name'] == provider_name), None)
        if not provider:
            return jsonify({"error": "Provider not found"}), 404
        
        # Encrypt and store the API key securely
        provider['encrypted_api_key'] = encryption_service.encrypt_api_key(api_key)
        
        # Set environment variable for immediate use
        env_key = f"{provider_name.upper()}_API_KEY"
        os.environ[env_key] = api_key
        
        # Update provider status
        provider['status'] = 'connected'
        provider['last_tested'] = datetime.now().isoformat()
        
        # Handle setting as default provider
        if data.get('is_default'):
            # Only allow setting as default if provider is connected
            if provider['status'] != 'connected':
                return jsonify({
                    "status": "error",
                    "message": "No se puede establecer como predeterminado un proveedor desconectado"
                }), 400
            
            # Remove default from all providers
            for p in AI_PROVIDERS:
                p['is_default'] = False
            provider['is_default'] = True
        
        return jsonify({
            "status": "success",
            "message": f"API key para {provider['display_name']} configurada y encriptada exitosamente",
            "provider": {
                "name": provider['name'],
                "display_name": provider['display_name'],
                "status": provider['status'],
                "is_default": provider['is_default'],
                "model": provider['model'],
                "last_tested": provider['last_tested']
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai-providers/<provider_name>/test', methods=['POST'])
def test_ai_provider(provider_name):
    """Test AI provider connection"""
    try:
        # Find the provider
        provider = next((p for p in AI_PROVIDERS if p['name'] == provider_name), None)
        if not provider:
            return jsonify({
                "status": "error",
                "message": "Proveedor no encontrado"
            }), 404
        
        # Check if provider has API key configured
        if provider['status'] == 'disconnected':
            return jsonify({
                "status": "error",
                "message": f"API key no configurada para {provider['display_name']}"
            }), 400
        
        # Test with a simple content generation
        test_prompt = "Genera un saludo breve y profesional"
        logging.debug(f"Testing {provider_name} with prompt: {test_prompt}")
        
        result = content_generator.generate_content(test_prompt, 'linkedin', provider_name)
        logging.debug(f"Test result for {provider_name}: {result}")
        
        if result and result.get('success'):
            provider['status'] = 'connected'
            provider['last_tested'] = datetime.now().isoformat()
            return jsonify({
                "status": "success",
                "message": f"Conexión exitosa con {provider['display_name']}",
                "test_content": result['content'][:100] + "..." if len(result.get('content', '')) > 100 else result.get('content', '')
            })
        else:
            provider['status'] = 'error'
            provider['last_tested'] = datetime.now().isoformat()
            error_msg = result.get('error', 'Error desconocido') if result else 'No se recibió respuesta'
            return jsonify({
                "status": "error",
                "message": f"Error al conectar con {provider['display_name']}: {error_msg}"
            }), 400
        
    except Exception as e:
        logging.error(f"Exception testing AI provider {provider_name}: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": f"Error interno del servidor: {str(e)}"
        }), 500

@app.route('/api/ai-providers/<provider_name>', methods=['DELETE'])
def disconnect_ai_provider(provider_name):
    """Disconnect AI provider by removing API key"""
    try:
        # Find the provider
        provider = next((p for p in AI_PROVIDERS if p['name'] == provider_name), None)
        if not provider:
            return jsonify({"error": "Provider not found"}), 404
        
        # Remove encrypted API key
        provider['encrypted_api_key'] = None
        
        # Remove environment variable
        env_key = f"{provider_name.upper()}_API_KEY"
        if env_key in os.environ:
            del os.environ[env_key]
        
        # Update provider status
        provider['status'] = 'disconnected'
        provider['last_tested'] = None
        
        # If this was the default provider, find another connected one
        if provider.get('is_default', False):
            provider['is_default'] = False
            # Set another connected provider as default
            for other_provider in AI_PROVIDERS:
                if other_provider['status'] == 'connected' and other_provider['name'] != provider_name:
                    other_provider['is_default'] = True
                    break
        
        return jsonify({
            "status": "success",
            "message": f"API key para {provider['display_name']} eliminada exitosamente"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
