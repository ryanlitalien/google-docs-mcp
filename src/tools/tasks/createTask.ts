import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getTasksClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'createTask',
    description: 'Creates a new task in a Google Tasks task list.',
    parameters: z.object({
      title: z.string().describe('Title of the task.'),
      notes: z.string().optional().describe('Additional notes or description for the task.'),
      due: z
        .string()
        .optional()
        .describe('Due date in RFC 3339 format (e.g., "2025-12-31T00:00:00.000Z").'),
      taskListId: z
        .string()
        .optional()
        .default('@default')
        .describe('Task list ID. Defaults to the primary task list.'),
    }),
    execute: async (args, { log }) => {
      const tasks = await getTasksClient();
      log.info(`Creating task: "${args.title}" in list: ${args.taskListId}`);

      try {
        const response = await tasks.tasks.insert({
          tasklist: args.taskListId,
          requestBody: {
            title: args.title,
            notes: args.notes,
            due: args.due,
          },
        });

        return JSON.stringify(
          {
            id: response.data.id,
            title: response.data.title,
            status: response.data.status,
            selfLink: response.data.selfLink,
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error creating task: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Google Tasks access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to create task: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
