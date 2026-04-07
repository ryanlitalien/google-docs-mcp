import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getGmailClient } from '../../clients.js';

function decodeBody(data: string | undefined | null): string {
  if (!data) return '';
  return Buffer.from(data, 'base64url').toString('utf-8');
}

function extractTextFromParts(parts: any[]): string {
  let text = '';
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += decodeBody(part.body.data);
    } else if (part.parts) {
      text += extractTextFromParts(part.parts);
    }
  }
  return text;
}

export function register(server: FastMCP) {
  server.addTool({
    name: 'getMessage',
    description: 'Gets the full content of a Gmail message by ID. Returns headers and body text.',
    parameters: z.object({
      messageId: z.string().describe('The message ID.'),
    }),
    execute: async (args, { log }) => {
      const gmail = await getGmailClient();
      log.info(`Getting message: ${args.messageId}`);

      try {
        const response = await gmail.users.messages.get({
          userId: 'me',
          id: args.messageId,
          format: 'full',
        });

        const msg = response.data;
        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || null;

        let body = '';
        if (msg.payload?.body?.data) {
          body = decodeBody(msg.payload.body.data);
        } else if (msg.payload?.parts) {
          body = extractTextFromParts(msg.payload.parts);
        }

        const attachments = (msg.payload?.parts || [])
          .filter((p: any) => p.filename && p.filename.length > 0)
          .map((p: any) => ({
            filename: p.filename,
            mimeType: p.mimeType,
            size: p.body?.size,
          }));

        return JSON.stringify(
          {
            id: msg.id,
            threadId: msg.threadId,
            from: getHeader('From'),
            to: getHeader('To'),
            cc: getHeader('Cc'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            labelIds: msg.labelIds,
            body,
            attachments,
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error getting message: ${error.message || error}`);
        if (error.code === 404) throw new UserError(`Message not found: ${args.messageId}`);
        if (error.code === 403) throw new UserError('Permission denied.');
        throw new UserError(`Failed to get message: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
