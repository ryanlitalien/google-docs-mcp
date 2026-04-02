import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getTasksClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'listTasks',
    description:
      'Lists tasks from a Google Tasks task list. Returns task titles, IDs, statuses, notes, and due dates.',
    parameters: z.object({
      taskListId: z
        .string()
        .optional()
        .default('@default')
        .describe('Task list ID. Defaults to the primary task list.'),
      showCompleted: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to include completed tasks.'),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(50)
        .describe('Maximum number of tasks to return (1-100).'),
    }),
    execute: async (args, { log }) => {
      const tasks = await getTasksClient();
      log.info(`Listing tasks from list: ${args.taskListId}`);

      try {
        const response = await tasks.tasks.list({
          tasklist: args.taskListId,
          showCompleted: args.showCompleted,
          maxResults: args.maxResults,
        });

        const items = (response.data.items || []).map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          notes: task.notes || null,
          due: task.due || null,
          updated: task.updated,
        }));

        return JSON.stringify({ tasks: items }, null, 2);
      } catch (error: any) {
        log.error(`Error listing tasks: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Google Tasks access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to list tasks: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
