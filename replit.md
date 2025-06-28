# Nova - Social Media AI Dashboard

## Overview

This is a Flask-based web application that provides a comprehensive social media management dashboard for Nova. The application is designed to help users manage, schedule, and analyze social media content across multiple platforms using AI-powered content generation. It features a dark/light theme toggle, real AI integration, and complete content adaptation capabilities.

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
- June 27, 2025. Added dark/light theme toggle functionality with Nova Praxis-inspired light theme design
- June 27, 2025. Fixed theme-specific styling issues:
  - Improved calendar button group visibility in light mode
  - Fixed analytics table contrast and readability
  - Corrected button hover effects for better text visibility
  - Fixed sidebar navigation highlighting for programmatic navigation
- June 27, 2025. Implemented comprehensive real-time scheduling functionality:
  - Added complete scheduling API endpoints (create, update, delete, calendar view)
  - Built interactive scheduling modals with form validation and timezone support
  - Enhanced calendar with month navigation, event display, and clickable posts
  - Created upcoming posts sidebar with statistics and post management
  - Integrated content generation workflow with direct scheduling capability
  - Added edit functionality for generated content before scheduling
  - Implemented seamless content-to-calendar workflow for AI-generated posts
- June 27, 2025. Added comprehensive social media account management and API key configuration:
  - Built complete account management interface with add/edit/delete functionality
  - Implemented API credentials configuration with platform-specific instructions
  - Added password visibility toggles and credential validation testing
  - Created detailed API setup instructions modal for all major social platforms
  - Integrated account status tracking (connected, pending, error) with connection testing
  - Added account statistics dashboard and auto-posting configuration
  - Connected account management to scheduling system for seamless workflow
- June 27, 2025. Implemented secure AI content generation with encrypted API key management:
  - Created Fernet-based encryption system for secure API key storage using PBKDF2HMAC
  - Built unified AI content generator supporting OpenAI GPT-4o, Google Gemini 2.5 Flash, and Perplexity Sonar
  - Added platform-specific content optimization (character limits, tone, hashtags for each social platform)
  - Implemented comprehensive AI provider management interface with secure credential storage
  - Added real-time content generation with provider selection and error handling
  - Integrated AI provider testing, connection status tracking, and default provider management
  - Enhanced content generation endpoint to use real AI providers instead of mock data
  - Fixed endpoint routing and platform selection issues for content generation
  - Added diagnostic tools and improved error messages for easier troubleshooting
  - Improved Twitter content generation with enhanced prompt engineering and content cleaning
- June 27, 2025. Added customizable AI prompt configuration system:
  - Created comprehensive prompt management interface with tabbed organization
  - Implemented system prompt configuration for overall AI behavior control
  - Added platform-specific prompt customization (Twitter, LinkedIn, Instagram, Web/Blog)
  - Built tone configuration system (Professional, Casual, Humorous, Inspirational)
  - Added API endpoints for saving, loading, and resetting prompt configurations
  - Integrated prompt settings into configuration dashboard with real-time updates
  - Included validation and error handling for prompt management operations
- June 27, 2025. Implemented comprehensive content adaptation feature:
  - Created new "Adaptar Contenido" section with complete user interface
  - Built content adaptation API endpoint with multi-platform support
  - Added style options (summary, highlights, questions, story, tips) and focus settings
  - Integrated with all AI providers (OpenAI, Gemini, Perplexity) for content adaptation
  - Created tabbed interface for displaying adapted content by platform
  - Added scheduling, editing, and copying functionality for adapted content
  - Fixed content processing issues to ensure proper text extraction and hashtag handling
- June 27, 2025. Rebranded application to Nova with visual identity integration:
  - Updated application title and branding to Nova throughout the interface
  - Added Nova logo to sidebar and navigation elements
  - Integrated Nova logo as icon for "Crear Contenido" navigation item
  - Fixed dark mode contrast issues for content preview areas
  - Enhanced styling for better text visibility in both light and dark themes
  - Updated "Crear Contenido" button to use "+" icon instead of Nova logo per user preference
- June 27, 2025. Added comprehensive "Publicar Ahora" functionality and social media monitoring:
  - Implemented "Publicar Ahora" buttons in both content generation and adaptation workflows
  - Created new "Monitoreo de Redes Sociales" section with platform statistics and recent posts tracking
  - Built backend endpoints for immediate publishing and monitoring data retrieval
  - Added real-time post tracking with engagement metrics and status monitoring
  - Integrated monitoring view with automatic data loading and refresh capabilities
  - Fixed session handling issues for proper post tracking and data persistence
- June 27, 2025. Added confirmation popups for account and provider deletion:
  - Implemented Bootstrap modals for confirming social media account deletion
  - Added confirmation popup for disconnecting AI providers with credential warnings
  - Enhanced user experience with detailed information display in confirmation dialogs
  - Replaced basic JavaScript confirm() with professional modal interfaces
- June 28, 2025. Implemented smooth transition animations between dashboard sections:
  - Added comprehensive CSS animation system with fade-in, slide, and scale effects
  - Implemented staggered animations for cards, content sections, and table rows
  - Enhanced view transitions with smooth fade-out/fade-in between sections
  - Added hover animations for cards, buttons, and interactive elements
  - Created animated notification system for success/error messages
  - Implemented loading state animations for buttons and content areas
  - Added smooth scrolling to top when changing views
  - Included accessibility support for users who prefer reduced motion
- June 28, 2025. Configured Madrid timezone as default for scheduling:
  - Set Europe/Madrid as the default timezone selection in scheduling modal
  - Updated setDefaultScheduleDateTime to calculate dates using Madrid timezone
  - Modified scheduleGeneratedContent to use Madrid time for content scheduling
  - Updated scheduleAdaptedContent to default to Madrid timezone
  - All scheduling functions now default to Madrid time (CET/CEST) instead of UTC
- June 28, 2025. Implemented automatic field completion from social media APIs:
  - Created verify-credentials endpoint to fetch profile data from social media APIs
  - Added automatic completion of account name and display name fields after API verification
  - Integrated profile information display (follower count, verification status) in credential testing
  - Enhanced user experience with visual verification status showing account details
  - Updated resetAccountForm to clear verification status when opening new account modals
  - Improved error handling and loading states for credential verification process
  - Added detection system for real vs demo API credentials with appropriate messaging
  - Implemented consistent profile data generation based on API key hash for stable results
  - Created clear distinction between demo mode and real API integration requirements
- June 28, 2025. Implemented authentication system with login protection:
  - Added Flask-Login dependency for user session management
  - Created simple authentication system with Admin/Admin credentials
  - Built professional login page with Nova branding and gradient design
  - Protected all dashboard routes and API endpoints with login_required decorator
  - Added user dropdown menu in sidebar with logout functionality
  - Implemented session management with proper redirect handling after login
  - Added flash messages for authentication feedback and error handling
- June 28, 2025. Added smooth transitions between login and dashboard:
  - Implemented animated login page with fadeInUp entrance effect
  - Created transition overlay with loading spinner and progressive text updates
  - Added dashboard entrance animations with staggered card and navigation appearances
  - Built smooth fadeOutScale effect for login form on successful authentication
  - Implemented slideInFromLeft animation for sidebar and slideInFromRight for main content
  - Added CSS keyframe animations with professional easing and timing
  - Enhanced user experience with visual feedback during authentication process
- June 28, 2025. Fixed deployment visualization issues and improved JavaScript stability:
  - Created comprehensive safe-utils.js library for robust DOM operations
  - Implemented global error handling to prevent visualization crashes
  - Added safeDOM utilities for secure element operations without null reference errors
  - Refactored all critical JavaScript functions to use safe element access patterns
  - Enhanced navigation, calendar, and dashboard loading with error-resistant code
  - Replaced direct DOM access with validated operations using fallback mechanisms
  - Eliminated deployment errors while maintaining all functionality and user experience
- June 28, 2025. Fixed sidebar consistency and layout issues across preview and deployment:
  - Implemented consistent sidebar positioning with fixed layout and proper shadow rendering
  - Added integrated theme toggle button in sidebar footer with Madrid-style text alignment
  - Created multi-line navigation text for "Monitoreo de Redes" with proper vertical alignment
  - Enhanced CSS specificity with !important declarations to override Bootstrap conflicts
  - Fixed main content positioning and width calculations for stable layout
  - Added robust container and row overrides to prevent layout shifts in deployment
  - Ensured consistent sidebar behavior across all dashboard sections and views
- June 28, 2025. Implemented clean slate user experience with enhanced calendar functionality:
  - Removed all mock data from posts, accounts, and pending content - application starts empty
  - Fixed spacing issues in validation section when rejecting posts
  - Emptied social media accounts by default requiring manual setup
  - Created clickable calendar days with modal for creating new publications
  - Added dual action buttons: "Publicar Ahora" and "Programar" in calendar modal
  - Implemented comprehensive post creation workflow from calendar interface
  - Enhanced calendar styling with hover effects and clear visual feedback
  - Configured Perplexity AI integration with proper API key authentication
- June 28, 2025. Added comprehensive button feedback system with visual states:
  - Implemented "Guardar" button in content generation results area
  - Created backend endpoints for saving, retrieving, and deleting drafts
  - Added draft management system with calendar integration for selecting saved content
  - Enhanced all action buttons (Guardar, Publicar Ahora, Programar, Copiar) with loading states
  - Implemented visual feedback with spinner animations, success states, and auto-reset
  - Added CSS animations for button states including success pulse and error shake
  - Fixed content processing for Web/Blog platform to properly extract and display content
  - Integrated draft selection functionality in calendar modal for easy content reuse
- June 28, 2025. Implemented automatic logout and removed all dummy data:
  - Added automatic logout on browser/tab close using navigator.sendBeacon
  - Configured session timeout after 30 minutes of inactivity
  - Enhanced logout endpoint to support both GET and POST requests
  - Removed all mock analytics data - charts now show empty states
  - Eliminated dummy top posts - table shows real published content or empty state
  - Fixed hover movement issues in charts and cards with stable CSS transitions
  - Application now starts completely clean with authentic data only
- June 28, 2025. Fixed deployment layout issues and eliminated phantom elements:
  - Resolved sidebar height problems by implementing JavaScript-based structure correction
  - Eliminated duplicate theme toggle button and positioned single button at sidebar bottom
  - Fixed configuration section styling inconsistencies with deployment-specific CSS
  - Removed phantom/ghost elements in configuration view that caused selection issues
  - Applied z-index layering and pointer-events fixes to prevent invisible overlays
  - Enhanced deployment-fixes.css with maximum specificity for consistent layout
  - Implemented automated fixes that run on page load and view changes
- June 28, 2025. Resolved critical sidebar visibility issues and implemented complete navigation system:
  - Solved persistent sidebar navigation visibility problems in deployment environment
  - Created JavaScript-generated sidebar with HTML strings to bypass CSS conflicts
  - Implemented complete navigation system with proper active state management
  - Added real Nova logo integration with theme-responsive background
  - Built comprehensive theme switching system affecting entire sidebar and content
  - Created sticky sidebar layout that scrolls with page content using flexbox
  - Optimized spacing between sidebar and main content for compact professional layout
  - Disabled authentication temporarily for easier development and testing
- June 28, 2025. Enhanced calendar functionality and improved user feedback systems:
  - Implemented complete calendar view switching (day/week/month) with interactive grids
  - Added time slot scheduling for day and week views with hover interactions
  - Created generateQuickContent() function for "Crear Rápida" with default platform selection
  - Enhanced button feedback with loading states, success animations, and auto-reset
  - Fixed light theme contrast issues with comprehensive CSS overrides for all components
  - Added JavaScript-based background correction for persistent dark elements in light mode
  - Improved visual feedback for content generation with spinner, success states, and error handling

## User Preferences

Preferred communication style: Simple, everyday language.
Design preferences: Light theme should match Nova Praxis website design (coral/orange accents, clean professional styling).