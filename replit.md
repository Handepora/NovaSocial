# Social Media AI Dashboard

## Overview

This is a Flask-based web application that provides a social media management dashboard. The application is designed to help users manage, schedule, and analyze social media content across multiple platforms. It features a dark-themed, modern UI with mock data for demonstration purposes.

## System Architecture

The application follows a simple server-side rendered architecture with modern frontend enhancements:

- **Backend**: Flask web framework (Python)
- **Frontend**: Server-side rendered HTML templates with Bootstrap CSS framework
- **Styling**: Bootstrap 5 with custom CSS for dark theme
- **JavaScript**: Vanilla JavaScript for interactive features
- **Deployment**: Gunicorn WSGI server with autoscale deployment

## Key Components

### Backend Components
- **Flask Application**: Main web server handling routes and template rendering
- **Mock Data Layer**: In-memory mock data for social media posts (no database currently implemented)
- **CORS Support**: Flask-CORS for API endpoint access
- **Session Management**: Basic session handling with secret key configuration

### Frontend Components
- **Responsive Layout**: Bootstrap-based responsive design with fixed sidebar navigation
- **Dashboard Views**: Multiple view states managed by JavaScript
- **Chart Integration**: Chart.js for analytics visualization
- **Icon Library**: Font Awesome for UI icons
- **Typography**: Google Fonts (Inter) for modern typography

### Current Features
- Social media post scheduling interface
- Dashboard with key metrics display
- Calendar view for content planning
- Analytics visualization setup
- Dark theme UI with modern aesthetics

## Data Flow

1. **User Interaction**: User navigates through sidebar or interacts with dashboard elements
2. **Client-side Routing**: JavaScript manages view switching without page reloads
3. **Data Loading**: Mock data is served from Python backend via API endpoints
4. **Rendering**: Frontend dynamically updates content based on current view
5. **Analytics**: Chart.js renders data visualizations for performance metrics

## External Dependencies

### Python Dependencies
- **Flask**: Web framework and routing
- **Flask-CORS**: Cross-origin resource sharing
- **Flask-SQLAlchemy**: ORM (prepared for future database integration)
- **Gunicorn**: Production WSGI server
- **psycopg2-binary**: PostgreSQL adapter (prepared for future database integration)
- **email-validator**: Email validation utilities

### Frontend Dependencies (CDN)
- **Bootstrap 5**: CSS framework and components
- **Font Awesome**: Icon library
- **Chart.js**: Data visualization
- **Google Fonts**: Typography (Inter font family)

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Runtime**: Python 3.11 with Nix package management
- **Server**: Gunicorn with auto-reload for development
- **Port Configuration**: Bound to 0.0.0.0:5000 with port reuse
- **Scaling**: Autoscale deployment target configured
- **Environment**: PostgreSQL and OpenSSL packages available via Nix

### Development Workflow
- Hot reload enabled via Gunicorn's --reload flag
- Parallel workflow execution for efficient development
- Automatic port detection and binding

## Changelog

- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.