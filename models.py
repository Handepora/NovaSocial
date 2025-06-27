from app import db
from datetime import datetime
from sqlalchemy import Enum
import enum

class PostStatus(enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Platform(enum.Enum):
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    WEB = "web"

class SocialMediaPost(db.Model):
    __tablename__ = 'social_media_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    platform = db.Column(Enum(Platform), nullable=False)
    status = db.Column(Enum(PostStatus), nullable=False, default=PostStatus.DRAFT)
    
    # Scheduling information
    scheduled_date = db.Column(db.DateTime, nullable=True)
    published_date = db.Column(db.DateTime, nullable=True)
    
    # Analytics data
    engagement = db.Column(db.Integer, default=0)
    reach = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)
    
    # Generation metadata
    topic = db.Column(db.String(500), nullable=True)
    tone = db.Column(db.String(50), nullable=True)
    hashtags = db.Column(db.Text, nullable=True)  # JSON string of hashtags
    
    # Timestamps
    created_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'platform': self.platform.value if self.platform else None,
            'status': self.status.value if self.status else None,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'published_date': self.published_date.isoformat() if self.published_date else None,
            'engagement': self.engagement,
            'reach': self.reach,
            'clicks': self.clicks,
            'topic': self.topic,
            'tone': self.tone,
            'hashtags': self.hashtags,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None
        }

class Analytics(db.Model):
    __tablename__ = 'analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    platform = db.Column(Enum(Platform), nullable=False)
    
    # Follower metrics
    followers_count = db.Column(db.Integer, default=0)
    followers_growth = db.Column(db.Integer, default=0)
    
    # Engagement metrics
    total_interactions = db.Column(db.Integer, default=0)
    engagement_rate = db.Column(db.Float, default=0.0)
    
    # Reach metrics
    total_reach = db.Column(db.Integer, default=0)
    impressions = db.Column(db.Integer, default=0)
    
    created_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'platform': self.platform.value if self.platform else None,
            'followers_count': self.followers_count,
            'followers_growth': self.followers_growth,
            'total_interactions': self.total_interactions,
            'engagement_rate': self.engagement_rate,
            'total_reach': self.total_reach,
            'impressions': self.impressions,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }