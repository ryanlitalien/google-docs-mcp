import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getCalendarClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'getEvent',
    description: 'Gets the full details of a specific calendar event by ID.',
    parameters: z.object({
      eventId: z.string().describe('The event ID.'),
      calendarId: z
        .string()
        .optional()
        .default('primary')
        .describe('Calendar ID. Defaults to primary calendar.'),
    }),
    execute: async (args, { log }) => {
      const calendar = await getCalendarClient();
      log.info(`Getting event ${args.eventId} from calendar: ${args.calendarId}`);

      try {
        const response = await calendar.events.get({
          calendarId: args.calendarId,
          eventId: args.eventId,
        });

        const event = response.data;
        return JSON.stringify(
          {
            id: event.id,
            summary: event.summary,
            description: event.description || null,
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location || null,
            attendees: (event.attendees || []).map((a) => ({
              email: a.email,
              displayName: a.displayName,
              responseStatus: a.responseStatus,
              organizer: a.organizer || false,
              self: a.self || false,
            })),
            organizer: event.organizer,
            hangoutLink: event.hangoutLink || null,
            htmlLink: event.htmlLink,
            status: event.status,
            recurrence: event.recurrence || null,
            reminders: event.reminders,
            created: event.created,
            updated: event.updated,
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error getting event: ${error.message || error}`);
        if (error.code === 404)
          throw new UserError(`Event not found: ${args.eventId}`);
        if (error.code === 403)
          throw new UserError('Permission denied.');
        throw new UserError(`Failed to get event: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
