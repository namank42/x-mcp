export const CHARACTER_LIMIT = 25_000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_TWEETS = 100;
export const MAX_USERS = 100;
export const MAX_LISTS = 100;

export const USER_FIELDS = [
  'id', 'name', 'username', 'description',
  'public_metrics', 'verified', 'created_at', 'profile_image_url',
] as const;

export const TWEET_FIELDS = [
  'id', 'text', 'created_at', 'public_metrics', 'author_id',
] as const;

export const LIST_FIELDS = [
  'description', 'member_count', 'follower_count', 'private', 'created_at',
] as const;

export const OAUTH_SCOPES = [
  'tweet.read',
  'users.read',
  'bookmark.read',
  'bookmark.write',
  'like.read',
  'like.write',
  'list.read',
  'list.write',
  'offline.access',
] as const;
