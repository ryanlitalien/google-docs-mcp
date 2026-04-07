import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getGmailClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'listLabels',
    description:
      'Lists all Gmail labels. Use this to discover label IDs for filtering messages.',
    parameters: z.object({}),
    execute: async (_args, { log }) => {
      const gmail = await getGmailClient();
      log.info('Listing Gmail labels');

      try {
        const response = await gmail.users.labels.list({ userId: 'me' });
        const labels = (response.data.labels || []).map((label) => ({
          id: label.id,
          name: label.name,
          type: label.type,
        }));

        return JSON.stringify({ labels }, null, 2);
      } catch (error: any) {
        log.error(`Error listing labels: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Gmail access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to list labels: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
