#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { XApiClient } from './services/x-client.js';
import { registerUserTools } from './tools/users.js';
import { registerTweetTools } from './tools/tweets.js';
import { registerBookmarkTools } from './tools/bookmarks.js';
import { registerLikeTools } from './tools/likes.js';
import { registerListTools } from './tools/lists.js';

const server = new McpServer({
  name: 'x-mcp',
  version: '2.0.0',
});

let api: XApiClient;
try {
  api = new XApiClient();
  console.error('X MCP Server: API client initialized');
} catch (error) {
  console.error('X MCP Server: Failed to initialize API client:', error);
  console.error('Run "pnpm run setup-auth" to configure authentication.');
  process.exit(1);
}

registerUserTools(server, api);
registerTweetTools(server, api);
registerBookmarkTools(server, api);
registerLikeTools(server, api);
registerListTools(server, api);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('X MCP Server running on stdio');
}

process.on('SIGINT', () => {
  console.error('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
