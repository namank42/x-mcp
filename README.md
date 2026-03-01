# x-mcp

A Model Context Protocol (MCP) server for the X (Twitter) API. Built with the official [@xdevplatform/xdk](https://github.com/xdevplatform/xdk) SDK and OAuth 2.0 PKCE authentication.

## Features

- **23 tools** across users, posts, bookmarks, likes, and lists
- **OAuth 2.0 PKCE** with automatic token refresh
- **Dual output**: markdown (human-readable) or JSON (structured)
- **MCP tool annotations**: `readOnlyHint`, `destructiveHint`, `idempotentHint`

## Prerequisites

- Node.js v18+
- pnpm
- X API OAuth 2.0 credentials (Client ID and Secret)

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   X_CLIENT_ID=your_oauth2_client_id
   X_CLIENT_SECRET=your_oauth2_client_secret
   X_REDIRECT_URI=http://localhost:3000/callback
   ```

3. **Authenticate**:
   ```bash
   pnpm run setup-auth
   ```

4. **Build**:
   ```bash
   pnpm run build
   ```

## Getting X API Credentials

1. Go to the [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a Project and App
3. Enable **OAuth 2.0** in app settings
4. Set app type to **Web App**
5. Add callback URL: `http://localhost:3000/callback`
6. Copy **Client ID** and **Client Secret** from the OAuth 2.0 section

## Claude Desktop Integration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "x-mcp": {
      "command": "node",
      "args": ["/path/to/x-mcp/dist/index.js"],
      "env": {
        "X_TOKENS_PATH": "/path/to/x-mcp/.tokens.json",
        "X_CLIENT_ID": "your_client_id",
        "X_CLIENT_SECRET": "your_client_secret",
        "X_REDIRECT_URI": "http://localhost:3000/callback"
      }
    }
  }
}
```

## Tools

### Users

| Tool | Description | Parameters |
|------|-------------|------------|
| `x_get_user_profile` | Fetch a user profile by username | `username`, `response_format` |
| `x_get_my_profile` | Get the authenticated user's profile | `response_format` |
| `x_get_followers` | Get a user's followers | `username`, `limit`, `response_format` |
| `x_get_following` | Get accounts a user follows | `username`, `limit`, `response_format` |

### Posts

| Tool | Description | Parameters |
|------|-------------|------------|
| `x_get_user_posts` | Fetch recent posts from a user (excludes retweets/replies) | `username`, `limit`, `response_format` |
| `x_get_my_timeline` | Get your home timeline (reverse chronological) | `limit`, `response_format` |
| `x_search_posts` | Search recent posts (last 7 days) | `query`, `limit`, `response_format` |

### Bookmarks

| Tool | Description | Parameters |
|------|-------------|------------|
| `x_get_my_bookmarks` | Fetch your bookmarked posts | `limit`, `response_format` |
| `x_add_bookmark` | Bookmark a post | `tweet_id` |
| `x_remove_bookmark` | Remove a bookmark | `tweet_id` |

### Likes

| Tool | Description | Parameters |
|------|-------------|------------|
| `x_get_my_likes` | Fetch your liked posts | `limit`, `response_format` |
| `x_like_post` | Like a post | `tweet_id` |
| `x_unlike_post` | Unlike a post | `tweet_id` |

### Lists

| Tool | Description | Parameters |
|------|-------------|------------|
| `x_get_my_lists` | Get your owned lists | `response_format` |
| `x_get_list` | Get list details by ID | `list_id`, `response_format` |
| `x_get_list_posts` | Get posts from a list | `list_id`, `limit`, `response_format` |
| `x_get_list_members` | Get members of a list | `list_id`, `limit`, `response_format` |
| `x_create_list` | Create a new list | `name`, `description`, `private` |
| `x_update_list` | Update a list | `list_id`, `name`, `description`, `private` |
| `x_delete_list` | Delete a list | `list_id` |
| `x_add_list_member` | Add a user to a list | `list_id`, `username` |
| `x_remove_list_member` | Remove a user from a list | `list_id`, `username` |

## Project Structure

```
src/
├── index.ts              # MCP server entry point
├── constants.ts          # Shared constants
├── types.ts              # TypeScript interfaces
├── setup-auth.ts         # OAuth 2.0 setup flow
├── schemas/
│   └── common.ts         # Shared Zod schemas
├── services/
│   ├── auth-manager.ts   # OAuth 2.0 token management
│   └── x-client.ts       # X API client wrapper
├── tools/
│   ├── users.ts          # User profile tools
│   ├── tweets.ts         # Post/timeline tools
│   ├── bookmarks.ts      # Bookmark tools
│   ├── likes.ts          # Like tools
│   └── lists.ts          # List management tools
└── utils/
    └── formatting.ts     # Response formatting helpers
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run build` | Compile TypeScript |
| `pnpm run dev` | Run in development mode |
| `pnpm start` | Run compiled server |
| `pnpm run setup-auth` | Authenticate with X |
| `pnpm run reset-auth` | Reset saved tokens |

## API Access Tiers

| Tier | What works |
|------|-----------|
| **Free** | Post creation, basic read access |
| **Basic** ($200/mo) | All read/write endpoints, followers/following |
| **Pro** ($5,000/mo) | Higher rate limits, full search |

## License

MIT
