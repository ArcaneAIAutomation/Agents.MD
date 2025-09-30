# Contributing to Agents.MD

Thank you for your interest in contributing to Agents.MD! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Git
- Basic knowledge of Next.js, TypeScript, and React

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/ArcaneAIAutomation/Agents.MD.git
   cd Agents.MD
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🎯 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include browser/OS information
- Add screenshots if applicable

### Feature Requests
- Check existing issues first
- Provide clear use case description
- Explain expected behavior
- Consider implementation complexity

### Pull Requests

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run build
   npm run test
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new trading indicator analysis"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for functions
- Use Prettier for formatting
- Follow ESLint rules

### Component Structure
```typescript
// components/ExampleComponent.tsx
import React from 'react';

interface ExampleProps {
  title: string;
  data: any[];
}

export default function ExampleComponent({ title, data }: ExampleProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {/* Component content */}
    </div>
  );
}
```

### API Route Structure
```typescript
// pages/api/example.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // API logic here
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
```

## 🔧 Technical Areas

### High Priority
- **Real-time data accuracy** - Ensure all market data is live and validated
- **Performance optimization** - Minimize API calls and improve loading times
- **Error handling** - Robust error recovery and user feedback
- **Mobile responsiveness** - Ensure all features work on mobile devices

### Medium Priority
- **Additional trading pairs** - Support for more cryptocurrencies
- **Advanced indicators** - New technical analysis tools
- **User preferences** - Customizable dashboards and settings
- **Data export** - CSV/JSON export functionality

### Documentation
- Update README.md for new features
- Add inline code comments
- Create API documentation
- Update CHANGELOG.md

## 🧪 Testing

### Manual Testing
- Test all timeframes (1H, 4H, 1D)
- Verify real-time data updates
- Check mobile responsiveness
- Test error scenarios

### Automated Testing
```bash
# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📝 Commit Message Format

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

Examples:
```
feat: add whale movement detection for ETH
fix: resolve CORS issue in trading chart API
docs: update installation instructions
style: format trading chart component
refactor: optimize market data fetching
test: add unit tests for price prediction
chore: update dependencies to latest versions
```

## 🚀 Release Process

### Version Numbering
- **Major (x.0.0)** - Breaking changes or major new features
- **Minor (1.x.0)** - New features, backward compatible
- **Patch (1.1.x)** - Bug fixes, backward compatible

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Deployment tested

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers learn
- Focus on technical merit

### Communication
- Use GitHub issues for bug reports
- Use GitHub discussions for questions
- Be clear and concise in communications
- Provide context and examples

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://reactjs.org/docs)

### APIs Used
- [Binance API](https://binance-docs.github.io/apidocs/)
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- [OpenAI API](https://platform.openai.com/docs)

## ❓ Questions?

If you have questions about contributing:
1. Check existing GitHub issues
2. Create a new issue with the "question" label
3. Join our community discussions

Thank you for contributing to Agents.MD! 🚀