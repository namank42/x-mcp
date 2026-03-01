import { CHARACTER_LIMIT } from '../constants.js';
import type { XUser, XTweet, XList } from '../types.js';

export function formatUser(user: XUser): string {
  const m = user.public_metrics;
  const lines = [
    `## ${user.name} (@${user.username})`,
    user.description || '_No bio_',
    '',
    `- **Followers**: ${m?.followers_count?.toLocaleString() ?? 'N/A'}`,
    `- **Following**: ${m?.following_count?.toLocaleString() ?? 'N/A'}`,
    `- **Posts**: ${m?.tweet_count?.toLocaleString() ?? 'N/A'}`,
    `- **Listed**: ${m?.listed_count?.toLocaleString() ?? 'N/A'}`,
    `- **Created**: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}`,
  ];
  return lines.join('\n');
}

export function formatUsers(users: XUser[]): string {
  if (!users.length) return 'No users found.';
  return users
    .map((u) => {
      const m = u.public_metrics;
      return `**${u.name}** (@${u.username}) — ${m?.followers_count?.toLocaleString() ?? '?'} followers\n${u.description ?? ''}`;
    })
    .join('\n\n---\n\n');
}

export function formatTweet(tweet: XTweet): string {
  const m = tweet.public_metrics;
  return [
    `**Post ${tweet.id}**`,
    tweet.created_at ? `_${new Date(tweet.created_at).toLocaleString()}_` : '',
    tweet.text,
    `Likes: ${m?.like_count ?? 0} | Reposts: ${m?.retweet_count ?? 0} | Replies: ${m?.reply_count ?? 0}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatTweets(tweets: XTweet[]): string {
  if (!tweets.length) return 'No posts found.';
  return tweets.map(formatTweet).join('\n\n---\n\n');
}

export function formatList(list: XList): string {
  return [
    `## ${list.name} (ID: ${list.id})`,
    list.description || '_No description_',
    '',
    `- **Members**: ${list.member_count ?? 0}`,
    `- **Followers**: ${list.follower_count ?? 0}`,
    `- **Privacy**: ${list.private ? 'Private' : 'Public'}`,
    `- **Created**: ${list.created_at ? new Date(list.created_at).toLocaleDateString() : 'N/A'}`,
  ].join('\n');
}

export function formatLists(lists: XList[]): string {
  if (!lists.length) return 'No lists found.';
  return lists.map(formatList).join('\n\n---\n\n');
}

export function truncateIfNeeded(text: string, itemCount?: number): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  const truncated = text.slice(0, CHARACTER_LIMIT);
  const msg = itemCount
    ? `\n\n_Response truncated. Use limit/offset to paginate through ${itemCount} total results._`
    : '\n\n_Response truncated due to size._';
  return truncated + msg;
}

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('401') || msg.includes('Unauthorized')) {
      return 'Error: Authentication failed. Run "pnpm run setup-auth" to re-authenticate.';
    }
    if (msg.includes('403') || msg.includes('Forbidden')) {
      return 'Error: Permission denied. Your API plan may not support this operation.';
    }
    if (msg.includes('404') || msg.includes('Not Found')) {
      return 'Error: Resource not found. Verify the ID or username is correct.';
    }
    if (msg.includes('429') || msg.includes('Rate limit')) {
      return 'Error: Rate limit exceeded. Wait a few minutes before retrying.';
    }
    return `Error: ${msg}`;
  }
  return `Error: An unexpected error occurred: ${String(error)}`;
}

export function paginationMeta(total: number, count: number, offset: number) {
  return {
    total,
    count,
    offset,
    has_more: total > offset + count,
    ...(total > offset + count ? { next_offset: offset + count } : {}),
  };
}
