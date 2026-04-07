import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getCalendarClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'deleteEvent',
    description: 'Deletes a calendar event.',
    parameters: z.object({
      eventId: z.string().describe('The event ID to delete.'),
      calendarId: z
        .string()
        .optional()
        .default('primary')
        .describe('Calendar ID. Defaults to primary calendar.'),
    }),
    execute: async (args, { log }) => {
      const calendar = await getCalendarClient();
      log.info(`Deleting event ${args.eventId} from calendar: ${args.calendarId}`);

      try {
        await calendar.events.delete({
          calendarId: args.calendarId,
          eventId: args.eventId,
        });

        return JSON.stringify({ deleted: true, eventId: args.eventId }, null, 2);
      } catch (error: any) {
        log.error(`Error deleting event: ${error.message || error}`);
        if (error.code === 404) throw new UserError(`Event not found: ${args.eventId}`);
        if (error.code === 403) throw new UserError('Permission denied.');
        throw new UserError(`Failed to delete event: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
