import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { XApiClient } from '../services/x-client.js';
import { ResponseFormat, responseFormatSchema, usernameSchema, paginatedInputSchema } from '../schemas/common.js';
import { formatTweets, handleApiError, truncateIfNeeded } from '../utils/formatting.js';

export function registerTweetTools(server: McpServer, api: XApiClient) {
  server.registerTool(
    'x_get_user_posts',
    {
      title: 'Get User Posts',
      description:
        'Fetch recent posts from a user\'s timeline by username. Excludes retweets and replies.',
      inputSchema: {
        username: usernameSchema,
        ...paginatedInputSchema.shape,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ username, limit, response_format }) => {
      try {
        const userId = await api.resolveUserId(username);
        const posts = await api.getUserPosts(userId, limit);
        if (!posts.length) {
          return { content: [{ type: 'text', text: `No recent posts from @${username}.` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ count: posts.length, posts }, null, 2)
            : `# Recent posts from @${username} (${posts.length})\n\n${formatTweets(posts)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, posts.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_get_my_timeline',
    {
      title: 'Get My Timeline',
      description:
        'Get the authenticated user\'s home timeline (reverse chronological). Includes posts from accounts you follow.',
      inputSchema: paginatedInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ limit, response_format }) => {
      try {
        const userId = await api.getMyUserId();
        const posts = await api.getTimeline(userId, limit);
        if (!posts.length) {
          return { content: [{ type: 'text', text: 'No posts in your timeline.' }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ count: posts.length, posts }, null, 2)
            : `# Your Timeline (${posts.length} posts)\n\n${formatTweets(posts)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, posts.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_search_posts',
    {
      title: 'Search Posts',
      description:
        'Search for recent posts (last 7 days) matching a query. Supports keywords, hashtags, and X search operators.',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .max(512)
          .describe('Search query (keywords, hashtags, X search operators)'),
        ...paginatedInputSchema.shape,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ query, limit, response_format }) => {
      try {
        const posts = await api.searchRecentPosts(query, limit);
        if (!posts.length) {
          return { content: [{ type: 'text', text: `No posts found for: "${query}"` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ query, count: posts.length, posts }, null, 2)
            : `# Search: "${query}" (${posts.length} results)\n\n${formatTweets(posts)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, posts.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );
}
