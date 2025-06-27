import os
import logging
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Enable CORS for API endpoints
CORS(app)

# Mock data for the application
MOCK_POSTS = [
    {
        "id": 1,
        "title": "Anuncio de nuevo producto innovador",
        "content": "¡Estamos emocionados de presentar nuestro último producto que revolucionará la industria!",
        "platform": "linkedin",
        "scheduled_date": "2025-06-27T10:00:00",
        "status": "scheduled",
        "engagement": 245,
        "reach": 1250
    },
    {
        "id": 2,
        "title": "Tips para mejorar productividad",
        "content": "5 consejos que cambiarán tu forma de trabajar #ProductividadTips",
        "platform": "twitter",
        "scheduled_date": "2025-06-27T14:30:00",
        "status": "scheduled",
        "engagement": 189,
        "reach": 890
    },
    {
        "id": 3,
        "title": "Behind the scenes de nuestro equipo",
        "content": "Conoce a las personas increíbles que hacen posible nuestros proyectos",
        "platform": "instagram",
        "scheduled_date": "2025-06-27T18:00:00",
        "status": "scheduled",
        "engagement": 312,
        "reach": 1580
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
    return jsonify(MOCK_POSTS)

@app.route('/api/posts/today')
def get_today_posts():
    """Get posts scheduled for today"""
    today = datetime.now().date()
    today_posts = [
        post for post in MOCK_POSTS 
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

@app.route('/api/posts/generate', methods=['POST'])
def generate_content():
    """Mock content generation endpoint"""
    # In a real app, this would use AI to generate content
    mock_generated = {
        "linkedin": {
            "content": "Contenido profesional generado para LinkedIn con enfoque en networking y crecimiento profesional.",
            "hashtags": ["#LinkedIn", "#Profesional", "#Networking"]
        },
        "twitter": {
            "content": "Tweet conciso y atractivo con llamada a la acción efectiva.",
            "hashtags": ["#Twitter", "#SocialMedia", "#Marketing"]
        },
        "instagram": {
            "content": "Post visual atractivo para Instagram con descripción engaging y hashtags relevantes.",
            "hashtags": ["#Instagram", "#Visual", "#Content"]
        }
    }
    return jsonify(mock_generated)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
