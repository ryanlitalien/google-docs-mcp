import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getGmailClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'sendMessage',
    description:
      'Sends an email from the authenticated Gmail account. Supports To, CC, BCC, subject, and plain text body.',
    parameters: z.object({
      to: z.string().describe('Recipient email address (or comma-separated list).'),
      subject: z.string().describe('Email subject line.'),
      body: z.string().describe('Plain text email body.'),
      cc: z.string().optional().describe('CC recipients (comma-separated).'),
      bcc: z.string().optional().describe('BCC recipients (comma-separated).'),
      threadId: z
        .string()
        .optional()
        .describe('Thread ID to reply to (adds the message to an existing thread).'),
    }),
    execute: async (args, { log }) => {
      const gmail = await getGmailClient();
      log.info(`Sending email to: ${args.to}, subject: "${args.subject}"`);

      try {
        const headers = [
          `To: ${args.to}`,
          `Subject: ${args.subject}`,
          'Content-Type: text/plain; charset=utf-8',
        ];
        if (args.cc) headers.push(`Cc: ${args.cc}`);
        if (args.bcc) headers.push(`Bcc: ${args.bcc}`);

        const rawMessage = [...headers, '', args.body].join('\r\n');
        const encodedMessage = Buffer.from(rawMessage).toString('base64url');

        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
            threadId: args.threadId,
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
        log.error(`Error sending message: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError('Permission denied. You may need to re-authenticate.');
        throw new UserError(`Failed to send message: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
