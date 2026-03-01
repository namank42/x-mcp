import type { Client } from '@xdevplatform/xdk';

export interface XUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  verified?: boolean;
  created_at?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  };
}

export interface XTweet {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
    impression_count?: number;
  };
}

export interface XList {
  id: string;
  name: string;
  description?: string;
  private?: boolean;
  created_at?: string;
  member_count?: number;
  follower_count?: number;
  owner_id?: string;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export type XClient = Client;
