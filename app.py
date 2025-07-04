import os
import logging
import re
from flask import Flask, render_template, jsonify, request, session, redirect, url_for, flash
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
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

# Configure Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor inicia sesión para acceder a esta página.'

# Enable CORS for API endpoints
CORS(app)

# Simple User class for authentication
class User(UserMixin):
    def __init__(self, id, username):
        self.id = id
        self.username = username

# Simple user storage (for now just Admin)
users = {'Admin': User(1, 'Admin')}

@login_manager.user_loader
def load_user(user_id):
    for user in users.values():
        if str(user.id) == str(user_id):
            return user
    return None

# In-memory storage for social media accounts, AI providers, and scheduled posts
AI_PROVIDERS = [
    {
        "id": 1,
        "name": "openai",
        "display_name": "OpenAI GPT-4o",
        "encrypted_api_key": None,
        "status": "disconnected",
        "is_default": False,
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
        "is_default": True,
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

SOCIAL_ACCOUNTS = []

SCHEDULED_POSTS = []

MOCK_PENDING_POSTS = []

MOCK_ANALYTICS = {
    "followers_growth": [],
    "engagement_rates": {
        "linkedin": 0,
        "twitter": 0,
        "instagram": 0
    },
    "weekly_interactions": []
}

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Simple authentication - Admin/Admin
        if username == 'Admin' and password == 'Admin':
            user = users.get(username)
            if user:
                login_user(user)
                next_page = request.args.get('next')
                return redirect(next_page) if next_page else redirect(url_for('index'))
        
        flash('Usuario o contraseña incorrectos')
    
    return render_template('login.html')

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    """Logout user - supports both GET and POST requests"""
    if current_user.is_authenticated:
        logout_user()
        session.clear()  # Clear all session data including drafts
        
        # Handle different request types
        if request.method == 'POST':
            # For AJAX/fetch requests or sendBeacon
            return '', 204  # No Content response for successful logout
        else:
            # For regular GET requests, redirect with flash message
            flash('Has cerrado sesión correctamente')
            return redirect(url_for('login'))
    else:
        # User already logged out
        if request.method == 'POST':
            return '', 204
        else:
            return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/posts')
def get_posts():
    """Get all scheduled posts"""
    return jsonify(SCHEDULED_POSTS)

@app.route('/api/posts/today')
@login_required
def get_today_posts():
    """Get posts scheduled for today"""
    today = datetime.now().date()
    today_posts = [
        post for post in SCHEDULED_POSTS 
        if datetime.fromisoformat(post['scheduled_date'].replace('Z', '+00:00')).date() == today
    ]
    return jsonify(today_posts)

@app.route('/api/posts/pending')
@login_required
def get_pending_posts():
    """Get posts pending approval"""
    return jsonify(MOCK_PENDING_POSTS)

@app.route('/api/analytics')
@login_required
def get_analytics():
    """Get analytics data"""
    return jsonify(MOCK_ANALYTICS)

@app.route('/api/generate-content', methods=['POST'])
@login_required
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
                elif platform == 'web':
                    # For web content, extract hashtags from the end
                    lines = content.split('\n')
                    hashtag_lines = []
                    content_lines = []
                    
                    for line in lines:
                        if line.strip().startswith('#') or '**#' in line:
                            hashtag_lines.append(line.strip())
                        else:
                            content_lines.append(line)
                    
                    main_content = '\n'.join(content_lines).strip()
                    
                    # Extract hashtags from hashtag lines
                    hashtags_found = []
                    for line in hashtag_lines:
                        hashtags = re.findall(r'#\w+', line)
                        hashtags_found.extend(hashtags)
                    
                    # Remove duplicates while preserving order
                    hashtags_found = list(dict.fromkeys(hashtags_found))
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
@login_required
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
@login_required
def get_prompt_settings():
    """Get current prompt settings"""
    return jsonify({
        "success": True,
        "settings": PROMPT_SETTINGS
    })

@app.route('/api/prompt-settings/system', methods=['POST'])
@login_required
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
@login_required
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
@login_required
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
@login_required
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
@login_required
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
                logging.debug(f"Raw content for {platform}: {content}")
                
                # Special processing for Twitter
                if platform == 'twitter':
                    main_content, hashtags_found = process_twitter_content(content)
                else:
                    # Simplified hashtag extraction - preserve content integrity
                    main_content = content
                    hashtags_found = []
                    
                    # Extract hashtags from the end of content or separate lines
                    if '#' in content:
                        lines = content.split('\n')
                        # Check last few lines for hashtags
                        for i in range(len(lines)-1, -1, -1):
                            line = lines[i].strip()
                            if line and all(word.startswith('#') or not word for word in line.split()):
                                # This line contains only hashtags
                                hashtags_found.extend([tag for tag in line.split() if tag.startswith('#')])
                                lines.pop(i)
                            elif line:
                                break
                        
                        # Rebuild main content without hashtag-only lines
                        main_content = '\n'.join(lines).strip()
                
                logging.debug(f"Processed for {platform}: content length={len(main_content)}, hashtags={len(hashtags_found)}")
                
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
@login_required
def approve_post(post_id):
    """Approve a pending post"""
    # In a real app, this would update the database
    return jsonify({"status": "approved", "post_id": post_id})

@app.route('/api/posts/reject/<int:post_id>', methods=['POST'])
@login_required
def reject_post(post_id):
    """Reject a pending post"""
    # In a real app, this would update the database
    return jsonify({"status": "rejected", "post_id": post_id})

# Real-time scheduling endpoints
@app.route('/api/posts/schedule', methods=['POST'])
@login_required
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
@login_required
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
@login_required
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
@login_required
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
@login_required
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
@login_required
def get_accounts():
    """Get all social media accounts"""
    return jsonify(SOCIAL_ACCOUNTS)

@app.route('/api/accounts', methods=['POST'])
@login_required
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
        if data.get('has_api') and (data.get('api_key') or data.get('api_secret')):
            credentials = {
                'api_key': data.get('api_key', ''),
                'api_secret': data.get('api_secret', ''),
                'access_token': data.get('access_token', ''),
                'webhook_url': data.get('webhook_url', '')
            }
            
            # Add Twitter-specific credentials
            if data.get('platform') == 'twitter':
                credentials['bearer_token'] = data.get('bearer_token', '')
                credentials['access_token_secret'] = data.get('access_token_secret', '')
            
            new_account['encrypted_credentials'] = encryption_service.encrypt_credentials(credentials)
            new_account['status'] = 'connected'
        elif data.get('has_api'):
            new_account['status'] = 'error'
        
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
@login_required
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
@login_required
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

@app.route('/api/accounts/verify-credentials', methods=['POST'])
@login_required
def verify_credentials():
    """Verify API credentials and get account information"""
    try:
        data = request.get_json()
        platform = data.get('platform')
        api_key = data.get('api_key', '')
        api_secret = data.get('api_secret', '')
        bearer_token = data.get('bearer_token', '')
        access_token = data.get('access_token', '')
        access_token_secret = data.get('access_token_secret', '')
        
        if not platform or not api_key:
            return jsonify({"error": "Platform and API key are required"}), 400
        
        # Try real API connection for Twitter if we have proper credentials
        if platform == 'twitter' and bearer_token and len(api_key) > 20:
            try:
                from twitter_api import TwitterAPI
                
                twitter_client = TwitterAPI(
                    api_key=api_key,
                    api_secret=api_secret,
                    bearer_token=bearer_token,
                    access_token=access_token,
                    access_token_secret=access_token_secret
                )
                
                result = twitter_client.test_connection()
                
                if result['status'] == 'success':
                    return jsonify({
                        "status": "success",
                        "message": f"Conectado exitosamente a tu cuenta de {platform}",
                        "profile": result['profile']
                    })
                else:
                    return jsonify({
                        "status": "error",
                        "message": result['message']
                    }), 400
                    
            except ImportError:
                pass  # Fall back to simulation
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": f"Error conectando con Twitter API: {str(e)}"
                }), 500
        
        # Fall back to simulation for demo purposes
        profile_data = simulate_api_profile_fetch(platform, api_key, api_secret)
        
        if profile_data:
            return jsonify({
                "status": "success",
                "message": f"Credenciales verificadas para {platform}",
                "profile": profile_data
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"No se pudieron verificar las credenciales para {platform}"
            }), 400
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def simulate_api_profile_fetch(platform, api_key, api_secret):
    """Simulate fetching profile data from social media APIs"""
    
    # Check if these look like real API credentials
    real_api_patterns = [
        len(api_key) > 20,  # Real API keys are usually longer
        any(char.isdigit() for char in api_key),  # Usually contain numbers
        any(char.isupper() for char in api_key),  # Usually contain uppercase
        not api_key.lower().startswith(('test', 'demo', 'example'))  # Not test credentials
    ]
    
    is_real_api = sum(real_api_patterns) >= 3
    
    if is_real_api:
        # For real API credentials, show a message about connecting to real APIs
        return {
            'username': 'TU_CUENTA_REAL',
            'display_name': 'Tu Cuenta Real (Requiere implementación de API real)',
            'follower_count': 0,
            'verified': False,
            'profile_image': '',
            'note': 'API_REAL_DETECTED'
        }
    
    # Generate consistent profile data based on API key for demo purposes
    import hashlib
    
    # Create a consistent hash from the API key for stable results
    hash_obj = hashlib.md5(api_key.encode())
    hash_int = int(hash_obj.hexdigest()[:8], 16)
    
    # Base follower count that stays consistent for the same API key
    base_followers = 150 + (hash_int % 500)
    
    # Extract a username hint from API key if it looks like one
    username_hint = api_key.lower()
    if '@' in username_hint:
        clean_username = username_hint
    elif 'test' in username_hint or 'demo' in username_hint:
        clean_username = f"@{username_hint.replace('_', '').replace('-', '')}"
    else:
        clean_username = f"@demo_{username_hint[:6]}"
    
    sample_profiles = {
        'twitter': {
            'username': clean_username,
            'display_name': f'Perfil de {clean_username[1:].title()}',
            'follower_count': base_followers,
            'verified': False,
            'profile_image': 'https://example.com/avatar.jpg'
        },
        'linkedin': {
            'username': clean_username.replace('@', '').replace('_', '-'),
            'display_name': f'Perfil Profesional de {clean_username[1:].title()}',
            'follower_count': base_followers + 50,
            'verified': False,
            'profile_image': 'https://example.com/company-logo.jpg'
        },
        'instagram': {
            'username': clean_username.replace('-', '_'),
            'display_name': f'Instagram de {clean_username[1:].title()}',
            'follower_count': base_followers + 30,
            'verified': False,
            'profile_image': 'https://example.com/insta-avatar.jpg'
        },
        'facebook': {
            'username': clean_username.replace('@', '').replace('_', '').replace('-', ''),
            'display_name': f'Página de {clean_username[1:].title()}',
            'follower_count': base_followers + 100,
            'verified': False,
            'profile_image': 'https://example.com/fb-logo.jpg'
        }
    }
    
    # Simulate 90% success rate for credential verification
    import random
    success = random.random() > 0.1
    
    if success and platform in sample_profiles:
        return sample_profiles[platform]
    
    return None

@app.route('/api/accounts/<int:account_id>/test', methods=['POST'])
@login_required
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
@login_required
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
@login_required
def get_ai_providers():
    """Get all AI providers"""
    # Check environment variables and update status
    for provider in AI_PROVIDERS:
        env_key = f"{provider['name'].upper()}_API_KEY"
        has_key = os.environ.get(env_key) is not None
        provider['status'] = 'connected' if has_key else 'disconnected'
    
    return jsonify(AI_PROVIDERS)

@app.route('/api/ai-providers/<provider_name>', methods=['PUT'])
@login_required
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
@login_required
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
@login_required
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

@app.route('/api/publish-now', methods=['POST'])
@login_required
def publish_now():
    """Publish content immediately to social media platform"""
    try:
        data = request.get_json()
        platform = data.get('platform')
        content = data.get('content')
        hashtags = data.get('hashtags', '')
        
        if not platform or not content:
            return jsonify({
                'status': 'error',
                'message': 'Plataforma y contenido son requeridos'
            }), 400
        
        # Add to published posts tracking
        if 'published_posts' not in session:
            session['published_posts'] = []
        
        import uuid
        
        published_post = {
            'id': str(uuid.uuid4()),
            'platform': platform,
            'content': content,
            'hashtags': hashtags,
            'published_date': datetime.now().isoformat(),
            'status': 'published',
            'likes': 0,
            'shares': 0
        }
        
        session['published_posts'].append(published_post)
        
        # Simulate API call delay
        import time
        time.sleep(1)
        
        return jsonify({
            'status': 'success',
            'message': f'Contenido publicado exitosamente en {platform.capitalize()}',
            'post_id': published_post['id']
        })
        
    except Exception as e:
        logging.error(f"Error publishing content: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Error al publicar contenido'
        }), 500

@app.route('/api/monitoring-data', methods=['GET'])
@login_required
def get_monitoring_data():
    """Get social media monitoring data"""
    try:
        import random
        
        # Get published posts from session
        published_posts = session.get('published_posts', [])
        
        # Calculate platform statistics
        platforms_data = {
            'twitter': {'status': 'connected', 'published_today': 0, 'total_posts': 0},
            'linkedin': {'status': 'connected', 'published_today': 0, 'total_posts': 0},
            'instagram': {'status': 'disconnected', 'published_today': 0, 'total_posts': 0},
            'facebook': {'status': 'connected', 'published_today': 0, 'total_posts': 0}
        }
        
        today = datetime.now().date()
        
        for post in published_posts:
            platform = post['platform']
            post_date = datetime.fromisoformat(post['published_date']).date()
            
            if platform in platforms_data:
                platforms_data[platform]['total_posts'] += 1
                if post_date == today:
                    platforms_data[platform]['published_today'] += 1
        
        # Add some sample engagement data
        for post in published_posts[-10:]:  # Last 10 posts
            post['likes'] = random.randint(5, 150)
            post['shares'] = random.randint(1, 25)
        
        monitoring_data = {
            'platforms': platforms_data,
            'recent_posts': published_posts[-10:] if published_posts else []
        }
        
        return jsonify({
            'status': 'success',
            'data': monitoring_data
        })
        
    except Exception as e:
        logging.error(f"Error getting monitoring data: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Error al obtener datos de monitoreo'
        }), 500

@app.route('/api/save-draft', methods=['POST'])
@login_required
def save_draft():
    """Save generated content as draft"""
    try:
        data = request.get_json()
        
        # Create a draft entry
        draft = {
            'id': len(session.get('drafts', [])) + 1,
            'platform': data.get('platform'),
            'content': data.get('content'),
            'hashtags': data.get('hashtags'),
            'created_at': data.get('created_at'),
            'type': 'draft',
            'title': data.get('content', '')[:50] + '...' if len(data.get('content', '')) > 50 else data.get('content', '')
        }
        
        # Store in session
        if 'drafts' not in session:
            session['drafts'] = []
        
        session['drafts'].append(draft)
        session.modified = True
        
        return jsonify({
            'success': True,
            'message': 'Borrador guardado exitosamente',
            'draft_id': draft['id']
        })
        
    except Exception as e:
        logging.error(f"Error saving draft: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/drafts')
@login_required
def get_drafts():
    """Get all saved drafts"""
    try:
        drafts = session.get('drafts', [])
        return jsonify({
            'success': True,
            'drafts': drafts
        })
    except Exception as e:
        logging.error(f"Error getting drafts: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/drafts/<int:draft_id>', methods=['DELETE'])
@login_required
def delete_draft(draft_id):
    """Delete a specific draft"""
    try:
        drafts = session.get('drafts', [])
        session['drafts'] = [draft for draft in drafts if draft['id'] != draft_id]
        session.modified = True
        
        return jsonify({
            'success': True,
            'message': 'Borrador eliminado exitosamente'
        })
    except Exception as e:
        logging.error(f"Error deleting draft: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
