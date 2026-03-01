#!/usr/bin/env node

import { OAuth2AuthManager } from './services/auth-manager.js';
import { XApiClient } from './services/x-client.js';
import { createServer } from 'http';
import { parse } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class OAuthSetup {
  private authManager: OAuth2AuthManager;
  private codeVerifier: string = '';
  private state: string = '';

  constructor() {
    try {
      this.authManager = new OAuth2AuthManager();
    } catch (error) {
      console.error('Failed to initialize OAuth manager:', error);
      process.exit(1);
    }
  }

  async setup(): Promise<void> {
    console.log('X MCP Server - OAuth 2.0 Setup');
    console.log('==============================\n');

    try {
      const isAuthenticated = await this.authManager.isAuthenticated();
      if (isAuthenticated) {
        console.log('You are already authenticated!');
        await this.testAuthentication();
        return;
      }

      console.log('This setup will:\n');
      console.log('  1. Generate an OAuth 2.0 authorization URL');
      console.log('  2. Open your web browser');
      console.log('  3. Start a local callback server');
      console.log('  4. Exchange the authorization code for tokens');
      console.log('  5. Save tokens for future use\n');

      console.log('Generating authorization link...');
      const { url, codeVerifier, state } = await this.authManager.generateAuthLink();
      this.codeVerifier = codeVerifier;
      this.state = state;

      console.log(`\nAuthorization URL: ${url}\n`);

      await this.startCallbackServer();

      console.log('Opening browser...');
      await this.openBrowser(url);

      console.log('Waiting for authorization...\n');
      console.log('Complete the authorization in your browser.');
      console.log("If the browser doesn't open, copy and paste the URL above.\n");
    } catch (error) {
      console.error('Setup failed:', error);
      process.exit(1);
    }
  }

  private async startCallbackServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url || '', true);

          if (parsedUrl.pathname === '/callback') {
            const { code, state, error } = parsedUrl.query;

            if (error) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`<html><body><h1>Authorization Failed</h1><p>${error}</p></body></html>`);
              server.close();
              reject(new Error(`Authorization failed: ${error}`));
              return;
            }

            if (!code || !state || state !== this.state) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('<html><body><h1>Invalid Request</h1></body></html>');
              server.close();
              reject(new Error('Invalid authorization parameters'));
              return;
            }

            try {
              console.log('\nExchanging authorization code for tokens...');
              await this.authManager.exchangeCodeForTokens(code as string, this.codeVerifier);

              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(
                '<html><body><h1>Authorization Successful!</h1><p>You can close this window.</p></body></html>'
              );
              server.close();

              console.log('Authentication successful!');
              await this.testAuthentication();
              resolve();
            } catch (authError) {
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(
                `<html><body><h1>Token Exchange Failed</h1><p>${authError instanceof Error ? authError.message : 'Unknown'}</p></body></html>`
              );
              server.close();
              reject(authError);
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
          }
        } catch (error) {
          server.close();
          reject(error);
        }
      });

      server.listen(3000, 'localhost', () => {
        console.log('Callback server started on http://localhost:3000');
        resolve();
      });

      server.on('error', reject);

      setTimeout(() => {
        server.close();
        reject(new Error('Authorization timeout (5 minutes) - please try again'));
      }, 5 * 60 * 1000);
    });
  }

  private async openBrowser(url: string): Promise<void> {
    try {
      const cmd =
        process.platform === 'darwin'
          ? `open "${url}"`
          : process.platform === 'win32'
            ? `start "" "${url}"`
            : `xdg-open "${url}"`;
      await execAsync(cmd);
    } catch {
      console.warn('Failed to open browser automatically. Copy and paste the URL above.');
    }
  }

  private async testAuthentication(): Promise<void> {
    try {
      console.log('\nTesting authentication...');
      const client = new XApiClient();
      const profile = await client.getMyProfile();

      console.log(`Authenticated as @${profile.username} (${profile.name})`);
      console.log(`Followers: ${profile.public_metrics?.followers_count?.toLocaleString() ?? 'N/A'}`);
      console.log('\nSetup complete! Available tools:');
      console.log('  x_get_user_profile, x_get_my_profile, x_get_followers, x_get_following');
      console.log('  x_get_user_posts, x_get_my_timeline, x_search_posts');
      console.log('  x_get_my_bookmarks, x_add_bookmark, x_remove_bookmark');
      console.log('  x_get_my_likes, x_like_post, x_unlike_post');
      console.log('  x_get_my_lists, x_get_list, x_create_list, x_update_list, x_delete_list');
      console.log('  x_get_list_posts, x_get_list_members, x_add_list_member, x_remove_list_member');
    } catch (error) {
      console.warn('Authentication saved but test failed:', error);
      console.log('Tools may work once the MCP server starts.');
    }
  }

  async reset(): Promise<void> {
    console.log('Resetting authentication...');
    await this.authManager.clearTokens();
    console.log('Authentication cleared. Run setup again to re-authenticate.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const setup = new OAuthSetup();

  if (args.includes('--reset') || args.includes('-r')) {
    await setup.reset();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('X MCP Server - OAuth 2.0 Setup\n');
    console.log('Usage:');
    console.log('  setup-auth           Set up OAuth 2.0 authentication');
    console.log('  setup-auth --reset   Clear existing authentication');
    console.log('  setup-auth --help    Show this help message');
  } else {
    await setup.setup();
  }
}

main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
