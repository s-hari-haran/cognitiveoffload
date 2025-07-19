# Cognitive Offload WorkOS - Complete Implementation Guide

## Overview

Cognitive Offload WorkOS is an AI-powered unified dashboard that addresses the modern information overload crisis faced by knowledge workers. The application integrates with multiple platforms (Gmail, Slack, Notion, Jira, Google Drive) and uses AI to intelligently classify, prioritize, and present communications in a contextual, actionable format.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Context with useReducer pattern for global state
- **Routing**: Wouter (lightweight client-side routing)
- **Animation**: Framer Motion for smooth transitions and interactions
- **HTTP Client**: TanStack React Query for server state management with custom fetch wrapper

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless database
- **AI Integration**: Google Gemini AI for content analysis and classification
- **Authentication**: JWT-based authentication with OAuth2 integration
- **Real-time Communication**: WebSocket implementation using native WebSocket API
- **Development Setup**: In-memory storage fallback for development environments

## Key Components

### Authentication System
- JWT token-based authentication
- OAuth2 integration for Gmail and Slack
- User registration and login endpoints
- Protected route middleware for API endpoints

### Work Item Management
- Centralized work item schema with comprehensive metadata
- AI-powered classification system (Urgent, FYI, Ignore)
- Rich contextual data including sentiment analysis, urgency scores, and business impact
- CRUD operations with real-time updates

### AI Analysis Engine
- Google Gemini AI integration for intelligent content processing
- Sentiment analysis and summarization capabilities
- Action item extraction and stakeholder identification
- Context tagging and business impact assessment

### Real-time Updates
- WebSocket service for live synchronization
- Automatic UI updates when work items change
- Connection status monitoring and reconnection handling

### UI Components
- Modern, responsive design with dark/light theme support
- Comprehensive filter system for work item categorization
- Interactive work item cards with action buttons
- Landing page with feature highlights and integration showcase

## Data Flow

1. **Authentication Flow**: User registers/logs in → JWT token generated → Stored in context → Used for API requests
2. **OAuth Integration**: User connects services → OAuth flow → Tokens stored → Service integration enabled
3. **Data Ingestion**: External services → API endpoints → AI processing → Database storage → Real-time updates
4. **UI Updates**: Database changes → WebSocket notifications → React Query cache invalidation → UI re-render

## External Dependencies

### Core Framework Dependencies
- React 18 ecosystem (React Query, React Hook Form, Framer Motion)
- Radix UI primitives for accessible component foundations
- Tailwind CSS for utility-first styling

### Backend Dependencies
- Express.js for API server
- Drizzle ORM with PostgreSQL support
- Google Gemini AI for content analysis
- JWT and OAuth2 libraries for authentication

### Third-party Integrations
- Gmail API for email processing
- Slack Web API for message handling
- Notion API for workspace integration
- Jira API for project management
- Google Drive API for document access

### Development Tools
- Vite for fast development and building
- TypeScript for type safety
- ESBuild for production bundling
- Replit-specific plugins for development environment

## Deployment Strategy

### Database Strategy
- Uses Drizzle ORM with PostgreSQL dialect
- Schema defined in shared directory for type safety
- Database migrations managed through Drizzle Kit
- Environment variable required for DATABASE_URL

### Build Process
- Frontend: Vite builds client to dist/public
- Backend: ESBuild bundles server to dist/index.js
- Shared schema ensures type consistency between frontend and backend

### Development Environment
- In-memory storage implementation for development
- WebSocket integration with development server
- Replit-specific optimizations and error handling
- Hot module replacement for fast development cycles

### Production Considerations
- Separate build commands for frontend and backend
- Environment-based configuration
- WebSocket server integration with HTTP server
- Static file serving for built frontend assets

The architecture follows a monorepo structure with clear separation between client, server, and shared code, enabling efficient development while maintaining type safety and code reusability across the full stack.