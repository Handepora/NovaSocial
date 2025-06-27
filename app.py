import os
import logging
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import uuid

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Enable CORS for API endpoints
CORS(app)

# In-memory storage for scheduled posts (in production, use a database)
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
