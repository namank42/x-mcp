import { z } from 'zod';

export enum ResponseFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
}

export const responseFormatSchema = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' for human-readable or 'json' for structured data");

export const paginatedInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Maximum number of results to return (1-100)'),
  response_format: responseFormatSchema,
});

export const usernameSchema = z
  .string()
  .min(1)
  .max(15)
  .regex(/^[A-Za-z0-9_]+$/, 'Username must only contain letters, numbers, and underscores')
  .describe('X username (without @ symbol)');

export const tweetIdSchema = z
  .string()
  .min(1)
  .describe('The ID of the post');

export const listIdSchema = z
  .string()
  .min(1)
  .describe('The ID of the list');
