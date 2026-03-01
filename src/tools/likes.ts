import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { XApiClient } from '../services/x-client.js';
import { ResponseFormat, responseFormatSchema, paginatedInputSchema, tweetIdSchema } from '../schemas/common.js';
import { formatTweets, handleApiError, truncateIfNeeded } from '../utils/formatting.js';

export function registerLikeTools(server: McpServer, api: XApiClient) {
  server.registerTool(
    'x_get_my_likes',
    {
      title: 'Get My Liked Posts',
      description:
        'Fetch posts liked by the authenticated user. Returns post text, engagement metrics, and timestamps.',
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
        const likes = await api.getLikedPosts(limit);
        if (!likes.length) {
          return { content: [{ type: 'text', text: 'No liked posts found.' }] };
        }
        const text =
          response_format === ResponseFormat.JSON
            ? JSON.stringify({ count: likes.length, likes }, null, 2)
            : `# Your Liked Posts (${likes.length})\n\n${formatTweets(likes)}`;
        return { content: [{ type: 'text', text: truncateIfNeeded(text, likes.length) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_like_post',
    {
      title: 'Like Post',
      description: 'Like a post by its ID on behalf of the authenticated user.',
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
        const success = await api.likePost(tweet_id);
        const text = success
          ? `Successfully liked post ${tweet_id}.`
          : `Failed to like post ${tweet_id}.`;
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    'x_unlike_post',
    {
      title: 'Unlike Post',
      description: 'Remove a like from a post by its ID on behalf of the authenticated user.',
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
        const success = await api.unlikePost(tweet_id);
        const text = success
          ? `Successfully unliked post ${tweet_id}.`
          : `Failed to unlike post ${tweet_id}.`;
        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: handleApiError(error) }] };
      }
    }
  );
}
