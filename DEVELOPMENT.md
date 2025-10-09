# Development Branch

This is the active development branch for Agents.MD. All new features and improvements are developed here before being merged to main.

## Design System

All development follows the **Bitcoin Sovereign Technology** design system:
- **Pure Black Backgrounds** (#000000) - The digital canvas
- **Bitcoin Orange Accents** (#F7931A) - CTAs and emphasis
- **Thin Orange Borders** (1-2px) - Signature visual element
- **Typography**: Inter (UI) + Roboto Mono (data)
- **Mobile-First** with progressive enhancement
- **WCAG 2.1 AA Compliant** accessibility standards

See `.kiro/steering/bitcoin-sovereign-design.md` for complete design guidelines.

## Branch Strategy

- **main** - Production-ready releases (v1.1.0+)
- **development** - Active development and testing
- **feature/** - Individual feature branches
- **hotfix/** - Critical bug fixes

## Current Development Status

### Version 1.2.0 Development
- [ ] Additional cryptocurrency support (ETH, ADA, SOL)
- [ ] Advanced portfolio tracking
- [ ] Custom alert system
- [ ] Enhanced mobile experience
- [ ] API rate optimization

### Active Features in Development
- Enhanced trading zone algorithms
- Improved real-time data processing
- Mobile-responsive design improvements
- Additional technical indicators

## Development Workflow

1. **Feature Development**
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   # Create PR to development branch
   ```

2. **Testing**
   - All features tested in development branch
   - Manual testing across timeframes (1H, 4H, 1D)
   - API integration testing
   - Mobile responsiveness testing

3. **Release Process**
   ```bash
   # When ready for release
   git checkout main
   git merge development
   git tag -a v1.x.x -m "Version 1.x.x release"
   git push origin main --tags
   ```

## Development Environment

### Required Setup
- Node.js 18+
- All API keys configured in .env.local
- Development server running on localhost:3000

### Testing Checklist
- [ ] All timeframes working (1H, 4H, 1D)
- [ ] Real-time data loading correctly
- [ ] Trading zones displaying properly
- [ ] Mobile responsive design
- [ ] Error handling working
- [ ] API rate limits respected

## Current Development Focus

### Performance Optimizations
- Reducing API call frequency
- Implementing better caching strategies
- Optimizing component re-renders

### User Experience Improvements
- Faster loading times
- Better error messages
- Improved mobile interface with Bitcoin Sovereign aesthetic
- Enhanced visual feedback with orange glow effects
- Thin orange borders on all card components
- Minimalist, clean layouts with single-column mobile stacks

### Technical Debt
- Code refactoring for maintainability
- TypeScript strict mode compliance
- Test coverage improvements
- Documentation updates

## Development Notes

Last Updated: September 30, 2025
Current Version: 1.1.0
Next Target: 1.2.0

### Recent Changes
- Professional repository setup completed
- Comprehensive documentation added
- Security guidelines implemented
- Community contribution framework established