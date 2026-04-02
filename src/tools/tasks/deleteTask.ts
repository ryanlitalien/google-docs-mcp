import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getTasksClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'deleteTask',
    description: 'Deletes a task from a Google Tasks task list.',
    parameters: z.object({
      taskId: z.string().describe('ID of the task to delete.'),
      taskListId: z
        .string()
        .optional()
        .default('@default')
        .describe('Task list ID. Defaults to the primary task list.'),
    }),
    execute: async (args, { log }) => {
      const tasks = await getTasksClient();
      log.info(`Deleting task ${args.taskId} from list: ${args.taskListId}`);

      try {
        await tasks.tasks.delete({
          tasklist: args.taskListId,
          task: args.taskId,
        });

        return JSON.stringify({ deleted: true, taskId: args.taskId }, null, 2);
      } catch (error: any) {
        log.error(`Error deleting task: ${error.message || error}`);
        if (error.code === 404)
          throw new UserError(`Task not found: ${args.taskId}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Google Tasks access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to delete task: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
