import {
  Client,
  OAuth2,
  generateCodeVerifier,
  generateCodeChallenge,
} from '@xdevplatform/xdk';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { OAUTH_SCOPES } from '../constants.js';
import type { OAuth2Tokens, OAuth2Config } from '../types.js';

dotenv.config();

export class OAuth2AuthManager {
  private config: OAuth2Config;
  private tokensPath: string;

  constructor() {
    this.config = this.getConfig();
    this.tokensPath = this.getTokensPath();
  }

  private getTokensPath(): string {
    const customPath = process.env.X_TOKENS_PATH;
    if (customPath) return customPath;

    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const projectDir = path.resolve(currentDir, '..', '..');
    return path.join(projectDir, '.tokens.json');
  }

  private getConfig(): OAuth2Config {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    const redirectUri = process.env.X_REDIRECT_URI || 'http://localhost:3000/callback';

    if (!clientId || !clientSecret) {
      throw new Error(
        'OAuth 2.0 credentials not found. Set X_CLIENT_ID and X_CLIENT_SECRET environment variables.'
      );
    }

    return { clientId, clientSecret, redirectUri };
  }

  async generateAuthLink(): Promise<{ url: string; codeVerifier: string; state: string }> {
    const oauth2 = new OAuth2({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      scope: [...OAUTH_SCOPES],
    });

    const state = `x-mcp-${Date.now()}`;
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    oauth2.setPkceParameters(codeVerifier, codeChallenge);
    const url = await oauth2.getAuthorizationUrl(state);

    return { url, codeVerifier, state };
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuth2Tokens> {
    const oauth2 = new OAuth2({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      scope: [...OAUTH_SCOPES],
    });

    try {
      const tokenResponse = await oauth2.exchangeCode(code, codeVerifier);
      const tokens: OAuth2Tokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + (tokenResponse.expires_in ? tokenResponse.expires_in * 1000 : 7200 * 1000),
      };

      await this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      throw new Error(
        `Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuth2Tokens> {
    const oauth2 = new OAuth2({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      scope: [...OAUTH_SCOPES],
    });

    try {
      const tokenResponse = await oauth2.refreshToken(refreshToken);

      const tokens: OAuth2Tokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? refreshToken,
        expiresAt: Date.now() + ((tokenResponse.expires_in ?? 7200) * 1000),
      };

      await this.saveTokens(tokens);
      return tokens;
    } catch (error) {
      throw new Error(
        `Failed to refresh tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getValidTokens(): Promise<OAuth2Tokens | null> {
    try {
      const tokens = await this.loadTokens();
      if (!tokens) return null;

      // Refresh if expiring within 5 minutes
      if (tokens.expiresAt && tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
        if (tokens.refreshToken) {
          console.error('Access token expiring soon, refreshing...');
          return await this.refreshTokens(tokens.refreshToken);
        }
        console.error('Access token expired and no refresh token available');
        return null;
      }

      return tokens;
    } catch (error) {
      console.error('Failed to get valid tokens:', error);
      return null;
    }
  }

  async saveTokens(tokens: OAuth2Tokens): Promise<void> {
    await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2));
    console.error('Tokens saved successfully');
  }

  async loadTokens(): Promise<OAuth2Tokens | null> {
    try {
      if (!existsSync(this.tokensPath)) return null;
      const data = await fs.readFile(this.tokensPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      console.error('Failed to load tokens');
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    if (existsSync(this.tokensPath)) {
      await fs.unlink(this.tokensPath);
      console.error('Tokens cleared');
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getValidTokens()) !== null;
  }

  async getAuthenticatedClient(): Promise<Client | null> {
    const tokens = await this.getValidTokens();
    if (!tokens) return null;
    return new Client({ accessToken: tokens.accessToken });
  }
}
