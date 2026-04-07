import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getGmailClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'modifyLabels',
    description:
      'Adds or removes labels from a Gmail message. Use this to archive (remove INBOX), mark read (remove UNREAD), star, etc.',
    parameters: z.object({
      messageId: z.string().describe('The message ID.'),
      addLabelIds: z
        .array(z.string())
        .optional()
        .describe('Label IDs to add (e.g. ["STARRED", "IMPORTANT"]).'),
      removeLabelIds: z
        .array(z.string())
        .optional()
        .describe('Label IDs to remove (e.g. ["UNREAD", "INBOX"]).'),
    }),
    execute: async (args, { log }) => {
      const gmail = await getGmailClient();
      log.info(`Modifying labels on message: ${args.messageId}`);

      try {
        const response = await gmail.users.messages.modify({
          userId: 'me',
          id: args.messageId,
          requestBody: {
            addLabelIds: args.addLabelIds,
            removeLabelIds: args.removeLabelIds,
          },
        });

        return JSON.stringify(
          {
            id: response.data.id,
            threadId: response.data.threadId,
            labelIds: response.data.labelIds,
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error modifying labels: ${error.message || error}`);
        if (error.code === 404) throw new UserError(`Message not found: ${args.messageId}`);
        if (error.code === 403) throw new UserError('Permission denied.');
        throw new UserError(`Failed to modify labels: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
