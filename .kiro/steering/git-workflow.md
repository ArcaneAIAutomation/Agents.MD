# Git Workflow & Branch Management

## Branch Strategy

### Main Branch Development
- **Primary Development**: All work is done directly on the `main` branch
- **Direct commits**: Commit and push changes directly to main
- **Continuous deployment**: Changes to main trigger automatic Vercel deployments
- **Production branch**: Main branch is the live production branch

### Branch Commands
```bash
# Verify current branch (should always be main)
git branch --show-current

# Switch to main if needed
git checkout main

# Push changes to main branch
git push origin main

# Pull latest changes before starting work
git pull origin main
```

### Commit Guidelines
- **Descriptive messages**: Clear, concise commit messages describing changes
- **Feature-based commits**: Group related changes together
- **Mobile-first focus**: Emphasize mobile optimization and accessibility improvements
- **API integration**: Highlight API changes and fallback implementations
- **Deployment-ready**: Ensure all commits are production-ready

### Development Workflow
1. **Always verify branch**: Confirm working on main before making changes
2. **Pull before work**: Always pull latest changes before starting
3. **Regular commits**: Commit frequently with meaningful messages
4. **Push regularly**: Keep remote main branch updated
5. **Test before push**: Verify changes work locally before pushing

### Deployment Process
- **Automatic**: Vercel automatically deploys on push to main
- **Preview**: Each push creates a deployment preview
- **Production**: Successful builds go live immediately
- **Rollback**: Use Vercel dashboard to rollback if needed

### Emergency Procedures
- If deployment fails: Check Vercel dashboard for error logs
- If breaking changes: Use Vercel rollback feature immediately
- If conflicts on pull: Resolve locally before pushing
- If unsure about changes: Test thoroughly in local development first

## Integration with Other Steering Files
This git workflow applies to all development activities covered by:
- Mobile development guidelines
- API integration patterns  
- Component structure requirements
- Technology stack implementations
- Product feature development

All code changes, regardless of the steering file they relate to, follow this main branch workflow with automatic Vercel deployment.