import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { XApiClient } from '../services/x-client.js';
import { ResponseFormat, responseFormatSchema, usernameSchema, paginatedInputSchema } from '../schemas/common.js';
import { formatUser, formatUsers, handleApiError, truncateIfNeeded } from '../utils/formatting.js';

export function registerUserTools(server: McpServer, api: XApiClient) {
  server.registerTool(
    'x_get_user_profile',
    {
      title: 'Get X User Profile',
      description:
        'Fetch an X user profile by username. Returns bio, follower/following counts, post count, and account creation date.',
      inputSchema: {
        username: usernameSchema,
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ username, response_format }) => {
      try {
        const user = await api.getUserByUsername(username);
        if (!user) {
          return { content: [{ type: 'text', text: `User @${username} not found.` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify(user, null, 2)
            : formatUser(user);
        return { content: [{ type: 'text', text: truncateIfNeeded(text) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_get_my_profile',
    {
      title: 'Get My X Profile',
      description:
        'Get the authenticated user\'s X profile including bio, metrics, and account info.',
      inputSchema: {
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ response_format }) => {
      try {
        const user = await api.getMyProfile();
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify(user, null, 2)
            : `# Your Profile\n\n${formatUser(user)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_get_followers',
    {
      title: 'Get X User Followers',
      description:
        'Get a list of users who follow a specified account. Returns usernames, bios, and follower counts.',
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
        const followers = await api.getFollowers(userId, limit);
        if (!followers.length) {
          return { content: [{ type: 'text', text: `No followers found for @${username}.` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ count: followers.length, users: followers }, null, 2)
            : `# Followers of @${username} (${followers.length})\n\n${formatUsers(followers)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, followers.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_get_following',
    {
      title: 'Get X User Following',
      description:
        'Get a list of users that a specified account follows. Returns usernames, bios, and follower counts.',
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
        const following = await api.getFollowing(userId, limit);
        if (!following.length) {
          return { content: [{ type: 'text', text: `@${username} is not following anyone.` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ count: following.length, users: following }, null, 2)
            : `# Accounts followed by @${username} (${following.length})\n\n${formatUsers(following)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, following.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );
}
