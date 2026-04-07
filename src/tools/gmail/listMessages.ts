import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getGmailClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'listMessages',
    description:
      'Lists Gmail messages matching a query. Returns message IDs and snippets. Use Gmail search syntax (e.g. "from:alice subject:meeting is:unread").',
    parameters: z.object({
      query: z
        .string()
        .optional()
        .default('')
        .describe('Gmail search query (same syntax as the Gmail search bar).'),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .describe('Maximum number of messages to return (1-100).'),
      labelIds: z
        .array(z.string())
        .optional()
        .describe('Filter by label IDs (e.g. ["INBOX", "UNREAD"]).'),
    }),
    execute: async (args, { log }) => {
      const gmail = await getGmailClient();
      log.info(`Listing messages. Query: "${args.query}", Max: ${args.maxResults}`);

      try {
        const listResponse = await gmail.users.messages.list({
          userId: 'me',
          q: args.query,
          maxResults: args.maxResults,
          labelIds: args.labelIds,
        });

        const messageIds = listResponse.data.messages || [];
        if (messageIds.length === 0) {
          return JSON.stringify({ messages: [], resultSizeEstimate: 0 }, null, 2);
        }

        // Fetch metadata for each message
        const messages = await Promise.all(
          messageIds.map(async (msg) => {
            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id!,
              format: 'metadata',
              metadataHeaders: ['From', 'To', 'Subject', 'Date'],
            });
            const headers = detail.data.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || null;

            return {
              id: detail.data.id,
              threadId: detail.data.threadId,
              snippet: detail.data.snippet,
              from: getHeader('From'),
              to: getHeader('To'),
              subject: getHeader('Subject'),
              date: getHeader('Date'),
              labelIds: detail.data.labelIds,
            };
          })
        );

        return JSON.stringify(
          { messages, resultSizeEstimate: listResponse.data.resultSizeEstimate },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error listing messages: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Gmail access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to list messages: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
