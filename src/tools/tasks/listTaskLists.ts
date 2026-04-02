import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getTasksClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'listTaskLists',
    description:
      'Lists all Google Tasks task lists for the authenticated user. Use this to discover task list IDs for use with other task tools.',
    parameters: z.object({}),
    execute: async (_args, { log }) => {
      const tasks = await getTasksClient();
      log.info('Listing task lists');

      try {
        const response = await tasks.tasklists.list({ maxResults: 100 });

        const lists = (response.data.items || []).map((list) => ({
          id: list.id,
          title: list.title,
          updated: list.updated,
        }));

        return JSON.stringify({ taskLists: lists }, null, 2);
      } catch (error: any) {
        log.error(`Error listing task lists: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Google Tasks access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to list task lists: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
