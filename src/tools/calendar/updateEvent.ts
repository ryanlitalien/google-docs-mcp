import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getCalendarClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'updateEvent',
    description: 'Updates an existing calendar event. Only the fields you provide will be changed.',
    parameters: z.object({
      eventId: z.string().describe('The event ID to update.'),
      summary: z.string().optional().describe('New title for the event.'),
      start: z.string().optional().describe('New start time in RFC 3339 format.'),
      end: z.string().optional().describe('New end time in RFC 3339 format.'),
      description: z.string().optional().describe('New description.'),
      location: z.string().optional().describe('New location.'),
      calendarId: z
        .string()
        .optional()
        .default('primary')
        .describe('Calendar ID. Defaults to primary calendar.'),
    }),
    execute: async (args, { log }) => {
      const calendar = await getCalendarClient();
      log.info(`Updating event ${args.eventId} on calendar: ${args.calendarId}`);

      const requestBody: Record<string, any> = {};
      if (args.summary !== undefined) requestBody.summary = args.summary;
      if (args.description !== undefined) requestBody.description = args.description;
      if (args.location !== undefined) requestBody.location = args.location;
      if (args.start !== undefined) requestBody.start = { dateTime: args.start };
      if (args.end !== undefined) requestBody.end = { dateTime: args.end };

      try {
        const response = await calendar.events.patch({
          calendarId: args.calendarId,
          eventId: args.eventId,
          requestBody,
        });

        return JSON.stringify(
          {
            id: response.data.id,
            summary: response.data.summary,
            start: response.data.start?.dateTime || response.data.start?.date,
            end: response.data.end?.dateTime || response.data.end?.date,
            htmlLink: response.data.htmlLink,
            updated: response.data.updated,
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error updating event: ${error.message || error}`);
        if (error.code === 404) throw new UserError(`Event not found: ${args.eventId}`);
        if (error.code === 403) throw new UserError('Permission denied.');
        throw new UserError(`Failed to update event: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
