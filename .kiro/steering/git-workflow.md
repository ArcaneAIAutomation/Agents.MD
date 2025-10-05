# Git Workflow & Branch Management

## Branch Strategy

### AgentMDC Development Branch
- **Primary Development**: All work must be done on the `AgentMDC` branch
- **Never update main**: The main branch should remain untouched without explicit permission
- **Commit Strategy**: All commits, pushes, and development work stays on AgentMDC
- **Protection**: Always ask before any merge operations to main branch

### Branch Commands
```bash
# Verify current branch (should always be AgentMDC)
git branch --show-current

# Switch to AgentMDC if needed
git checkout AgentMDC

# Push changes to AgentMDC branch
git push origin AgentMDC

# NEVER do this without permission:
# git checkout main
# git merge AgentMDC
```

### Commit Guidelines
- **Descriptive messages**: Clear, concise commit messages describing changes
- **Feature-based commits**: Group related changes together
- **Mobile-first focus**: Emphasize mobile optimization and accessibility improvements
- **API integration**: Highlight API changes and fallback implementations

### Development Workflow
1. **Always verify branch**: Confirm working on AgentMDC before making changes
2. **Regular commits**: Commit frequently with meaningful messages
3. **Push regularly**: Keep remote AgentMDC branch updated
4. **No main branch access**: Never switch to or modify main without explicit permission
5. **Pull request preparation**: Prepare for eventual PR to main when requested

### Branch Protection Rules
- **AgentMDC**: Active development branch for all cryptocurrency platform enhancements
- **Main**: Protected branch requiring explicit permission for any updates
- **Feature isolation**: Keep all mobile optimization, API integration, and component development on AgentMDC
- **Safe experimentation**: AgentMDC allows for safe testing and iteration without affecting production

### Emergency Procedures
- If accidentally on main branch: Immediately switch back to AgentMDC
- If changes made to main: Stop and ask for guidance before proceeding
- If merge conflicts: Resolve on AgentMDC branch, never force merge to main
- If branch confusion: Always verify with `git branch --show-current`

## Integration with Other Steering Files
This git workflow applies to all development activities covered by:
- Mobile development guidelines
- API integration patterns  
- Component structure requirements
- Technology stack implementations
- Product feature development

All code changes, regardless of the steering file they relate to, must follow this AgentMDC branch workflow.