import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getCalendarClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'createEvent',
    description:
      'Creates a new event on a Google Calendar. Can include attendees, location, and description.',
    parameters: z.object({
      summary: z.string().describe('Title of the event.'),
      start: z.string().describe('Start time in RFC 3339 format (e.g. "2025-12-15T10:00:00-05:00").'),
      end: z.string().describe('End time in RFC 3339 format.'),
      description: z.string().optional().describe('Description or notes for the event.'),
      location: z.string().optional().describe('Location of the event.'),
      attendees: z
        .array(z.string())
        .optional()
        .describe('List of attendee email addresses.'),
      calendarId: z
        .string()
        .optional()
        .default('primary')
        .describe('Calendar ID. Defaults to primary calendar.'),
    }),
    execute: async (args, { log }) => {
      const calendar = await getCalendarClient();
      log.info(`Creating event: "${args.summary}" on calendar: ${args.calendarId}`);

      try {
        const response = await calendar.events.insert({
          calendarId: args.calendarId,
          requestBody: {
            summary: args.summary,
            description: args.description,
            location: args.location,
            start: { dateTime: args.start },
            end: { dateTime: args.end },
            attendees: args.attendees?.map((email) => ({ email })),
          },
        });

        return JSON.stringify(
          {
            id: response.data.id,
            summary: response.data.summary,
            start: response.data.start?.dateTime,
            end: response.data.end?.dateTime,
            htmlLink: response.data.htmlLink,
            hangoutLink: response.data.hangoutLink || null,
          },
          null,
          2
        );
      } catch (error: any) {
        log.error(`Error creating event: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError('Permission denied. You may need to re-authenticate.');
        throw new UserError(`Failed to create event: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
