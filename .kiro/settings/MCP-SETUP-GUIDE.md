# MCP Server Configuration Guide

**Last Updated**: January 27, 2025  
**Status**: ✅ Configured with 5 active servers

---

## Active MCP Servers

### ✅ 1. Filesystem Server
**Status**: Enabled  
**Purpose**: Read and navigate project files

**Capabilities**:
- Read single or multiple files
- List directory contents
- Search for files
- Get file information

**Auto-approved tools**:
- `read_file`
- `read_multiple_files`
- `list_directory`
- `search_files`
- `get_file_info`

**Configuration**:
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\OriK.Projects\\Agents.MD\\Agents.MD"]
}
```

---

### ✅ 2. PostgreSQL Server
**Status**: Enabled  
**Purpose**: Query Supabase database directly

**Capabilities**:
- Run SQL queries
- List all tables
- Describe table structure
- View table data

**Auto-approved tools**:
- `query`
- `list_tables`
- `describe_table`

**Configuration**:
```json
{
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"
  ]
}
```

**Example Usage**:
```sql
-- List all UCIE tables
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'ucie_%';

-- Check user count
SELECT COUNT(*) FROM users;

-- View recent analyses
SELECT * FROM ucie_analysis_history ORDER BY created_at DESC LIMIT 10;
```

---

### ✅ 3. Fetch Server
**Status**: Enabled  
**Purpose**: Fetch web content and APIs

**Capabilities**:
- Fetch URLs and convert to markdown
- Access external APIs
- Scrape web content
- Get documentation

**Auto-approved tools**:
- `fetch`

**Configuration**:
```json
{
  "command": "uvx",
  "args": ["mcp-server-fetch"]
}
```

**Requirements**:
- Python's `uv` package manager must be installed
- Install: `pip install uv` or `brew install uv`

**Example Usage**:
- Fetch API documentation
- Get cryptocurrency prices from external APIs
- Scrape news articles
- Access GitHub raw files

---

### ✅ 4. Memory Server
**Status**: Enabled  
**Purpose**: Knowledge graph for context retention

**Capabilities**:
- Create entities (people, projects, concepts)
- Create relations between entities
- Add observations to entities
- Search knowledge graph
- Read entire graph

**Auto-approved tools**:
- `create_entities`
- `create_relations`
- `add_observations`
- `search_nodes`
- `open_nodes`
- `read_graph`

**Configuration**:
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```

**Example Usage**:
- Remember project decisions
- Track feature implementations
- Store API integration details
- Maintain development context

---

### ✅ 5. Sequential Thinking Server
**Status**: Enabled  
**Purpose**: Complex problem-solving with step-by-step reasoning

**Capabilities**:
- Break down complex problems
- Multi-step reasoning
- Hypothesis generation and verification
- Adaptive thinking process

**Configuration**:
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
}
```

**Example Usage**:
- Debug complex issues
- Plan multi-phase implementations
- Analyze architectural decisions
- Solve algorithmic problems

---

## Disabled MCP Servers

### ⚠️ GitHub Server
**Status**: Disabled (requires token)  
**Purpose**: Interact with GitHub repositories

**To Enable**:
1. Create GitHub Personal Access Token: https://github.com/settings/tokens
2. Update `GITHUB_PERSONAL_ACCESS_TOKEN` in config
3. Set `"disabled": false`

**Capabilities**:
- Create/update issues
- Create/update pull requests
- Search repositories
- Manage branches

---

### ⚠️ Brave Search Server
**Status**: Disabled (requires API key)  
**Purpose**: Web search capabilities

**To Enable**:
1. Get Brave Search API key: https://brave.com/search/api/
2. Update `BRAVE_API_KEY` in config
3. Set `"disabled": false`

**Capabilities**:
- Web search
- News search
- Image search

---

### ⚠️ Puppeteer Server
**Status**: Disabled (resource intensive)  
**Purpose**: Browser automation and screenshots

**To Enable**:
1. Set `"disabled": false`
2. Note: Requires Chrome/Chromium installation

**Capabilities**:
- Take screenshots
- Navigate web pages
- Click elements
- Fill forms

---

### ⚠️ Slack Server
**Status**: Disabled (requires workspace)  
**Purpose**: Send Slack messages

**To Enable**:
1. Create Slack Bot: https://api.slack.com/apps
2. Update `SLACK_BOT_TOKEN` and `SLACK_TEAM_ID`
3. Set `"disabled": false`

**Capabilities**:
- Send messages to channels
- List channels
- Get channel history

---

## Troubleshooting

### Server Won't Start

**Issue**: `npm error 404 Not Found`
```
npm error 404  '@modelcontextprotocol/server-xyz@*' is not in this registry.
```

**Solution**: The package doesn't exist. Remove it from config or check package name.

---

**Issue**: `uvx: command not found`
```
'uvx' is not recognized as an internal or external command
```

**Solution**: Install Python's `uv` package manager:
```bash
# Windows (with pip)
pip install uv

# macOS (with Homebrew)
brew install uv

# Or use pipx
pipx install uv
```

---

**Issue**: Connection timeout
```
Error connecting to MCP server: Connection timeout
```

**Solution**:
1. Check internet connection
2. Verify package name is correct
3. Try running command manually: `npx -y @modelcontextprotocol/server-memory`

---

### Server Permissions

**Issue**: Tools require approval every time

**Solution**: Add tool names to `autoApprove` array in config:
```json
{
  "autoApprove": [
    "read_file",
    "query",
    "fetch"
  ]
}
```

---

### Database Connection Issues

**Issue**: PostgreSQL server can't connect
```
Error: Connection refused
```

**Solution**:
1. Verify DATABASE_URL is correct
2. Check Supabase database is running
3. Verify firewall allows connection
4. Test connection: `psql $DATABASE_URL`

---

## Best Practices

### Security
- ✅ Never commit API keys to git
- ✅ Use environment variables for sensitive data
- ✅ Disable unused servers
- ✅ Review auto-approved tools carefully

### Performance
- ✅ Disable resource-intensive servers (Puppeteer)
- ✅ Use auto-approve for frequently used tools
- ✅ Keep server count reasonable (<10)

### Maintenance
- ✅ Update servers regularly: `npx -y @modelcontextprotocol/server-memory@latest`
- ✅ Check MCP logs for errors
- ✅ Remove unused servers
- ✅ Document custom configurations

---

## Useful Commands

### Test MCP Server
```bash
# Test filesystem server
npx -y @modelcontextprotocol/server-filesystem "C:\OriK.Projects\Agents.MD\Agents.MD"

# Test postgres server
npx -y @modelcontextprotocol/server-postgres "postgres://..."

# Test memory server
npx -y @modelcontextprotocol/server-memory
```

### View MCP Logs
1. Open Kiro IDE
2. View → Output
3. Select "MCP Logs" from dropdown

### Reconnect MCP Servers
1. Open Command Palette (Ctrl+Shift+P)
2. Search: "MCP: Reconnect All Servers"
3. Or restart Kiro IDE

---

## Adding New MCP Servers

### 1. Find Available Servers
- Official: https://github.com/modelcontextprotocol/servers
- Community: https://github.com/topics/mcp-server

### 2. Add to Config
```json
{
  "mcpServers": {
    "new-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-new"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 3. Test Connection
- Save config file
- MCP servers auto-reconnect
- Check MCP logs for errors

---

## Current Configuration Summary

| Server | Status | Purpose | Auto-Approve |
|--------|--------|---------|--------------|
| **filesystem** | ✅ Active | File operations | Yes (5 tools) |
| **postgres** | ✅ Active | Database queries | Yes (3 tools) |
| **fetch** | ✅ Active | Web content | Yes (1 tool) |
| **memory** | ✅ Active | Knowledge graph | Yes (6 tools) |
| **sequential-thinking** | ✅ Active | Problem solving | No |
| github | ⚠️ Disabled | GitHub API | - |
| brave-search | ⚠️ Disabled | Web search | - |
| puppeteer | ⚠️ Disabled | Browser automation | - |
| slack | ⚠️ Disabled | Slack messaging | - |

**Total Active**: 5 servers  
**Total Disabled**: 4 servers

---

## Support

### Documentation
- MCP Protocol: https://modelcontextprotocol.io/
- Server List: https://github.com/modelcontextprotocol/servers
- Kiro MCP Guide: Check steering files

### Getting Help
1. Check MCP logs for errors
2. Test server manually with `npx`
3. Verify package exists on npm
4. Check server documentation

---

**Status**: ✅ MCP Configuration Complete

**Active Servers**: 5 (filesystem, postgres, fetch, memory, sequential-thinking)

**Next Steps**: Servers will auto-connect on Kiro IDE restart

---

**Last Updated**: January 27, 2025  
**Configuration File**: `.kiro/settings/mcp.json`
