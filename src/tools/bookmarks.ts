import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { XApiClient } from '../services/x-client.js';
import { ResponseFormat, responseFormatSchema, paginatedInputSchema, tweetIdSchema } from '../schemas/common.js';
import { formatTweets, handleApiError, truncateIfNeeded } from '../utils/formatting.js';

export function registerBookmarkTools(server: McpServer, api: XApiClient) {
  server.registerTool(
    'x_get_my_bookmarks',
    {
      title: 'Get My Bookmarks',
      description:
        'Fetch posts bookmarked by the authenticated user. Returns post text, engagement metrics, and timestamps.',
      inputSchema: paginatedInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ limit, response_format }) => {
      try {
        const bookmarks = await api.getBookmarks(limit);
        if (!bookmarks.length) {
          return { content: [{ type: 'text', text: 'No bookmarks found.' }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ count: bookmarks.length, bookmarks }, null, 2)
            : `# Your Bookmarks (${bookmarks.length})\n\n${formatTweets(bookmarks)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, bookmarks.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_add_bookmark',
    {
      title: 'Bookmark Post',
      description: 'Add a post to the authenticated user\'s bookmarks by its ID.',
      inputSchema: { tweet_id: tweetIdSchema },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ tweet_id }) => {
      try {
        const success = await api.addBookmark(tweet_id);
        const text = success
          ? `Successfully bookmarked post ${tweet_id}.`
          : `Failed to bookmark post ${tweet_id}.`;
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_remove_bookmark',
    {
      title: 'Remove Bookmark',
      description: 'Remove a post from the authenticated user\'s bookmarks by its ID.',
      inputSchema: { tweet_id: tweetIdSchema },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ tweet_id }) => {
      try {
        const success = await api.removeBookmark(tweet_id);
        const text = success
          ? `Successfully removed bookmark for post ${tweet_id}.`
          : `Failed to remove bookmark for post ${tweet_id}.`;
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );
}
