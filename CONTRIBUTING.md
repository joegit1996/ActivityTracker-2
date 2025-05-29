# Contributing to Activity Streak Web App

Thank you for your interest in contributing to the Activity Streak Web App! This document provides guidelines and information for contributors.

## Development Setup

1. Follow the installation instructions in README.md
2. Ensure you have the development environment configured
3. Run `npm run dev` to start the development server

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting patterns
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## Database Changes

- Never directly modify the database schema in production
- All schema changes should go through the Drizzle ORM
- Test database changes locally before submitting

## Internationalization

- All user-facing text must support both English and Arabic
- Use the i18next translation system
- Test both LTR and RTL layouts

## Testing

- Test all changes in both languages (English/Arabic)
- Verify mobile responsiveness
- Test admin functionality if making backend changes

## Pull Request Process

1. Create a feature branch from main
2. Make your changes
3. Test thoroughly
4. Submit a pull request with a clear description
5. Wait for review and address any feedback

## Security

- Never commit sensitive data like API keys or passwords
- Use environment variables for configuration
- Follow secure coding practices