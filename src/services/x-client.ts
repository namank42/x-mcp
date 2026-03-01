import { Client } from '@xdevplatform/xdk';
import { OAuth2AuthManager } from './auth-manager.js';
import { USER_FIELDS, TWEET_FIELDS, LIST_FIELDS } from '../constants.js';
import type { XUser, XTweet, XList } from '../types.js';

export class XApiClient {
  private authManager: OAuth2AuthManager;
  private cachedUserId: string | null = null;

  constructor() {
    this.authManager = new OAuth2AuthManager();
  }

  private async getClient(): Promise<Client> {
    const client = await this.authManager.getAuthenticatedClient();
    if (!client) {
      throw new Error('Not authenticated. Run "pnpm run setup-auth" to authenticate.');
    }
    return client;
  }

  async getMyUserId(): Promise<string> {
    if (this.cachedUserId) return this.cachedUserId;
    const profile = await this.getMyProfile();
    this.cachedUserId = profile.id;
    return this.cachedUserId;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.authManager.isAuthenticated();
  }

  // ── Users ──────────────────────────────────────────────────────────

  async getUserByUsername(username: string): Promise<XUser | null> {
    const client = await this.getClient();
    const res = await client.users.getByUsername(username, {
      userFields: [...USER_FIELDS],
    });
    return (res.data as XUser) ?? null;
  }

  async getMyProfile(): Promise<XUser> {
    const client = await this.getClient();
    const res = await client.users.getMe({
      userFields: [...USER_FIELDS],
    });
    if (!res.data) throw new Error('Failed to fetch authenticated user profile');
    return res.data as XUser;
  }

  async getFollowers(userId: string, maxResults: number): Promise<XUser[]> {
    const client = await this.getClient();
    const res = await client.users.getFollowers(userId, {
      maxResults: Math.min(maxResults, 100),
      userFields: [...USER_FIELDS],
    });
    return (res.data as XUser[]) ?? [];
  }

  async getFollowing(userId: string, maxResults: number): Promise<XUser[]> {
    const client = await this.getClient();
    const res = await client.users.getFollowing(userId, {
      maxResults: Math.min(maxResults, 100),
      userFields: [...USER_FIELDS],
    });
    return (res.data as XUser[]) ?? [];
  }

  // ── Posts / Tweets ─────────────────────────────────────────────────

  async getUserPosts(userId: string, maxResults: number): Promise<XTweet[]> {
    const client = await this.getClient();
    const res = await client.users.getPosts(userId, {
      maxResults: Math.min(maxResults, 100),
      tweetFields: [...TWEET_FIELDS],
      exclude: ['retweets', 'replies'],
    });
    return (res.data as XTweet[]) ?? [];
  }

  async getTimeline(userId: string, maxResults: number): Promise<XTweet[]> {
    const client = await this.getClient();
    const res = await client.users.getTimeline(userId, {
      maxResults: Math.min(maxResults, 100),
      tweetFields: [...TWEET_FIELDS],
      expansions: ['author_id'],
    });
    return (res.data as XTweet[]) ?? [];
  }

  async searchRecentPosts(query: string, maxResults: number): Promise<XTweet[]> {
    const client = await this.getClient();
    const res = await client.posts.searchRecent(query, {
      maxResults: Math.min(maxResults, 100),
      tweetFields: [...TWEET_FIELDS],
    });
    return (res.data as XTweet[]) ?? [];
  }

  // ── Bookmarks ──────────────────────────────────────────────────────

  async getBookmarks(maxResults: number): Promise<XTweet[]> {
    const client = await this.getClient();
    const userId = await this.getMyUserId();
    const res = await client.users.getBookmarks(userId, {
      maxResults: Math.min(maxResults, 100),
      tweetFields: [...TWEET_FIELDS],
      expansions: ['author_id'],
    });
    return (res.data as XTweet[]) ?? [];
  }

  async addBookmark(tweetId: string): Promise<boolean> {
    const client = await this.getClient();
    const userId = await this.getMyUserId();
    const res = await client.users.createBookmark(userId, { tweetId });
    return !!res.data;
  }

  async removeBookmark(tweetId: string): Promise<boolean> {
    const client = await this.getClient();
    const userId = await this.getMyUserId();
    const res = await client.users.deleteBookmark(userId, tweetId);
    return !!res.data;
  }

  // ── Likes ──────────────────────────────────────────────────────────

  async getLikedPosts(maxResults: number): Promise<XTweet[]> {
    const client = await this.getClient();
    const userId = await this.getMyUserId();
    const res = await client.users.getLikedPosts(userId, {
      maxResults: Math.min(maxResults, 100),
      tweetFields: [...TWEET_FIELDS],
      expansions: ['author_id'],
    });
    return (res.data as XTweet[]) ?? [];
  }

  async likePost(tweetId: string): Promise<boolean> {
    const client = await this.getClient();
    const userId = await this.getMyUserId();
    const res = await client.users.likePost(userId, { body: { tweetId } });
    return !!res.data;
  }

  async unlikePost(tweetId: string): Promise<boolean> {
    const client = await this.getClient();
    const userId = await this.getMyUserId();
    const res = await client.users.unlikePost(userId, tweetId);
    return !!res.data;
  }

  // ── Lists ──────────────────────────────────────────────────────────

  async getOwnedLists(maxResults: number): Promise<XList[]> {
    const client = await this.getClient();
    const userId = await this.getMyUserId();
    const res = await client.users.getOwnedLists(userId, {
      maxResults: Math.min(maxResults, 100),
      listFields: [...LIST_FIELDS],
    });
    return (res.data as XList[]) ?? [];
  }

  async getListById(listId: string): Promise<XList | null> {
    const client = await this.getClient();
    const res = await client.lists.getById(listId, {
      listFields: [...LIST_FIELDS],
    });
    return (res.data as XList) ?? null;
  }

  async getListPosts(listId: string, maxResults: number): Promise<XTweet[]> {
    const client = await this.getClient();
    const res = await client.lists.getPosts(listId, {
      maxResults: Math.min(maxResults, 100),
      tweetFields: [...TWEET_FIELDS],
      expansions: ['author_id'],
    });
    return (res.data as XTweet[]) ?? [];
  }

  async getListMembers(listId: string, maxResults: number): Promise<XUser[]> {
    const client = await this.getClient();
    const res = await client.lists.getMembers(listId, {
      maxResults: Math.min(maxResults, 100),
      userFields: [...USER_FIELDS],
    });
    return (res.data as XUser[]) ?? [];
  }

  async createList(
    name: string,
    description?: string,
    isPrivate: boolean = false
  ): Promise<XList> {
    const client = await this.getClient();
    const res = await client.lists.create({
      body: { name, description, private: isPrivate },
    });
    if (!res.data) throw new Error('Failed to create list');
    return res.data as XList;
  }

  async updateList(
    listId: string,
    updates: { name?: string; description?: string; private?: boolean }
  ): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.lists.update(listId, { body: updates });
    return !!res.data;
  }

  async deleteList(listId: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.lists.delete(listId);
    return !!res.data;
  }

  async addListMember(listId: string, userId: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.lists.addMember(listId, {
      body: { userId },
    });
    return !!res.data;
  }

  async removeListMember(listId: string, userId: string): Promise<boolean> {
    const client = await this.getClient();
    const res = await client.lists.removeMemberByUserId(listId, userId);
    return !!res.data;
  }

  // Helper: resolve username to user ID
  async resolveUserId(username: string): Promise<string> {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error(`User @${username} not found`);
    return user.id;
  }
}
