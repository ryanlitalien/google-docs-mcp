import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getTasksClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'updateTask',
    description:
      'Updates a task in Google Tasks. Can change title, notes, due date, or toggle completion status.',
    parameters: z.object({
      taskId: z.string().describe('ID of the task to update.'),
      title: z.string().optional().describe('New title for the task.'),
      notes: z.string().optional().describe('New notes for the task.'),
      due: z
        .string()
        .optional()
        .describe('New due date in RFC 3339 format (e.g., "2025-12-31T00:00:00.000Z").'),
      status: z
        .enum(['needsAction', 'completed'])
        .optional()
        .describe('Set task status: "needsAction" (incomplete) or "completed".'),
      taskListId: z
        .string()
        .optional()
        .default('@default')
        .describe('Task list ID. Defaults to the primary task list.'),
    }),
    execute: async (args, { log }) => {
      const tasks = await getTasksClient();
      log.info(`Updating task ${args.taskId} in list: ${args.taskListId}`);

      const requestBody: Record<string, string> = {};
      if (args.title !== undefined) requestBody.title = args.title;
      if (args.notes !== undefined) requestBody.notes = args.notes;
      if (args.due !== undefined) requestBody.due = args.due;
      if (args.status !== undefined) requestBody.status = args.status;

      try {
        const response = await tasks.tasks.patch({
          tasklist: args.taskListId,
          task: args.taskId,
          requestBody,
        });

        return JSON.stringify(
          {
            id: response.data.id,
            title: response.data.title,
            status: response.data.status,
            notes: response.data.notes || null,
            due: response.data.due || null,
            updated: response.data.updated,
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error updating task: ${error.message || error}`);
        if (error.code === 404)
          throw new UserError(`Task not found: ${args.taskId}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Google Tasks access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to update task: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
