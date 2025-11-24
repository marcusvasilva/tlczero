# Supabase MCP Integration Guide

## What is Supabase MCP?

The Supabase MCP (Model Context Protocol) server provides Claude with direct access to your Supabase projects, allowing it to:
- Query and modify database tables
- Execute SQL queries
- Manage database schemas
- Access project metadata
- Work with Supabase Storage
- Manage authentication users

## Installation Status

✅ **Successfully Installed!**

The Supabase MCP server has been configured with your access token and is ready to use.

## Available Commands

When working with Claude, you can now ask it to:

### Database Operations
- List all tables in your Supabase project
- Query data from specific tables
- Insert, update, or delete records
- Create or modify table schemas
- Execute custom SQL queries

### Example Requests
```
"Show me all the tables in my Supabase database"
"Query the first 10 records from the accounts table"
"Create a new table called notifications"
"Update the status field for user ID 123"
"Execute this SQL query: SELECT * FROM collections WHERE created_at > '2024-01-01'"
```

### Storage Operations
- List buckets and files
- Upload or download files
- Manage file permissions

### Auth Operations
- List users
- Create or update user accounts
- Manage user metadata

## Current Project Configuration

Your TLC Zero project is already configured to use Supabase with:
- **Project URL**: https://nfditawexkrwwhzbqfjt.supabase.co
- **Database Tables**: accounts, users, spaces, collections, operators, reports
- **Authentication**: Email/password with role-based access control

## Security Notes

⚠️ **Important**: Your Supabase access token is stored in your local Claude configuration. This token has full access to your Supabase project, so:
- Never share your `.claude.json` file
- Regenerate the token if you suspect it's been compromised
- The token is only accessible to Claude running on your local machine

## Using MCP with Your App

The MCP server complements your existing app by allowing Claude to:
1. **Debug Issues**: Query the database directly to investigate problems
2. **Data Analysis**: Run complex queries without writing code
3. **Quick Fixes**: Update data or fix issues directly
4. **Schema Changes**: Modify database structure when needed

## Troubleshooting

If MCP commands aren't working:
1. Restart Claude Code
2. Check if the token is still valid in your Supabase dashboard
3. Ensure you have internet connectivity

## Example Workflow

1. **Investigate an issue**:
   ```
   "Check if there are any accounts with status='inactive' in the database"
   ```

2. **Fix data**:
   ```
   "Update all collections with weight=0 to have weight=0.1"
   ```

3. **Add new features**:
   ```
   "Create a new table for storing app notifications with fields: id, user_id, title, message, read, created_at"
   ```

## Next Steps

You can now use natural language to interact with your Supabase database directly through Claude. This makes debugging, data analysis, and quick fixes much easier without leaving your conversation.