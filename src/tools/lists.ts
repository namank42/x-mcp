import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { XApiClient } from '../services/x-client.js';
import {
  ResponseFormat,
  responseFormatSchema,
  paginatedInputSchema,
  listIdSchema,
  usernameSchema,
} from '../schemas/common.js';
import {
  formatList,
  formatLists,
  formatTweets,
  formatUsers,
  handleApiError,
  truncateIfNeeded,
} from '../utils/formatting.js';

export function registerListTools(server: McpServer, api: XApiClient) {
  server.registerTool(
    'x_get_my_lists',
    {
      title: 'Get My Lists',
      description:
        'Get lists owned by the authenticated user. Returns list name, description, member/follower counts, and privacy.',
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
        const lists = await api.getOwnedLists(100);
        if (!lists.length) {
          return { content: [{ type: 'text', text: 'You have no lists.' }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ count: lists.length, lists }, null, 2)
            : `# Your Lists (${lists.length})\n\n${formatLists(lists)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, lists.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_get_list',
    {
      title: 'Get List Details',
      description:
        'Get details of a specific list by its ID. Returns name, description, member/follower counts, and privacy.',
      inputSchema: {
        list_id: listIdSchema,
        response_format: responseFormatSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ list_id, response_format }) => {
      try {
        const list = await api.getListById(list_id);
        if (!list) {
          return { content: [{ type: 'text', text: `List ${list_id} not found.` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify(list, null, 2)
            : formatList(list);
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_get_list_posts',
    {
      title: 'Get List Posts',
      description: 'Get recent posts from a specific list by its ID.',
      inputSchema: {
        list_id: listIdSchema,
        ...paginatedInputSchema.shape,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ list_id, limit, response_format }) => {
      try {
        const posts = await api.getListPosts(list_id, limit);
        if (!posts.length) {
          return { content: [{ type: 'text', text: `No posts found in list ${list_id}.` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ list_id, count: posts.length, posts }, null, 2)
            : `# Posts from List (${posts.length})\n\n${formatTweets(posts)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, posts.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_get_list_members',
    {
      title: 'Get List Members',
      description: 'Get members of a specific list by its ID.',
      inputSchema: {
        list_id: listIdSchema,
        ...paginatedInputSchema.shape,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ list_id, limit, response_format }) => {
      try {
        const members = await api.getListMembers(list_id, limit);
        if (!members.length) {
          return { content: [{ type: 'text', text: `No members in list ${list_id}.` }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ list_id, count: members.length, members }, null, 2)
            : `# List Members (${members.length})\n\n${formatUsers(members)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, members.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_create_list',
    {
      title: 'Create List',
      description: 'Create a new X list with a name, optional description, and privacy setting.',
      inputSchema: {
        name: z.string().min(1).max(25).describe('List name (max 25 characters)'),
        description: z.string().max(100).optional().describe('List description (max 100 characters)'),
        private: z.boolean().default(false).describe('Whether the list should be private'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ name, description, private: isPrivate }) => {
      try {
        const list = await api.createList(name, description, isPrivate);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created list "${name}" (ID: ${list.id}). Privacy: ${isPrivate ? 'Private' : 'Public'}.`,
            },
          ],
        };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_update_list',
    {
      title: 'Update List',
      description:
        'Update an existing list\'s name, description, or privacy. Provide at least one field to change.',
      inputSchema: {
        list_id: listIdSchema,
        name: z.string().min(1).max(25).optional().describe('New list name'),
        description: z.string().max(100).optional().describe('New list description'),
        private: z.boolean().optional().describe('New privacy setting'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ list_id, name, description, private: isPrivate }) => {
      try {
        if (!name && description === undefined && isPrivate === undefined) {
          return {
            content: [{ type: 'text', text: 'No changes provided. Specify name, description, or private.' }],
          };
        }
        const updates: { name?: string; description?: string; private?: boolean } = {};
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (isPrivate !== undefined) updates.private = isPrivate;

        await api.updateList(list_id, updates);
        const changes = Object.entries(updates)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ');
        return { content: [{ type: 'text', text: `Updated list ${list_id}: ${changes}` }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_delete_list',
    {
      title: 'Delete List',
      description: 'Permanently delete a list by its ID. This cannot be undone.',
      inputSchema: { list_id: listIdSchema },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ list_id }) => {
      try {
        const success = await api.deleteList(list_id);
        const text = success
          ? `Successfully deleted list ${list_id}.`
          : `Failed to delete list ${list_id}.`;
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_add_list_member',
    {
      title: 'Add List Member',
      description: 'Add a user to a list by their username and the list ID.',
      inputSchema: {
        list_id: listIdSchema,
        username: usernameSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ list_id, username }) => {
      try {
        const userId = await api.resolveUserId(username);
        const success = await api.addListMember(list_id, userId);
        const text = success
          ? `Added @${username} to list ${list_id}.`
          : `Failed to add @${username} to list ${list_id}.`;
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_remove_list_member',
    {
      title: 'Remove List Member',
      description: 'Remove a user from a list by their username and the list ID.',
      inputSchema: {
        list_id: listIdSchema,
        username: usernameSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ list_id, username }) => {
      try {
        const userId = await api.resolveUserId(username);
        const success = await api.removeListMember(list_id, userId);
        const text = success
          ? `Removed @${username} from list ${list_id}.`
          : `Failed to remove @${username} from list ${list_id}.`;
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );
}
