import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getCalendarClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'listEvents',
    description:
      'Lists events from a Google Calendar. Defaults to upcoming events from the primary calendar. Supports time range filtering and search.',
    parameters: z.object({
      calendarId: z
        .string()
        .optional()
        .default('primary')
        .describe('Calendar ID. Defaults to primary calendar.'),
      timeMin: z
        .string()
        .optional()
        .describe(
          'Start of time range (RFC 3339, e.g. "2025-12-01T00:00:00Z"). Defaults to now.'
        ),
      timeMax: z
        .string()
        .optional()
        .describe('End of time range (RFC 3339). Defaults to 7 days from now.'),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(250)
        .optional()
        .default(25)
        .describe('Maximum number of events to return (1-250).'),
      query: z
        .string()
        .optional()
        .describe('Free text search query to filter events.'),
    }),
    execute: async (args, { log }) => {
      const calendar = await getCalendarClient();
      const now = new Date().toISOString();
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      log.info(`Listing events from calendar: ${args.calendarId}`);

      try {
        const response = await calendar.events.list({
          calendarId: args.calendarId,
          timeMin: args.timeMin || now,
          timeMax: args.timeMax || weekFromNow,
          maxResults: args.maxResults,
          singleEvents: true,
          orderBy: 'startTime',
          q: args.query,
        });

        const events = (response.data.items || []).map((event) => ({
          id: event.id,
          summary: event.summary,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location || null,
          description: event.description || null,
          attendees: (event.attendees || []).map((a) => ({
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus,
            organizer: a.organizer || false,
          })),
          hangoutLink: event.hangoutLink || null,
          htmlLink: event.htmlLink,
          status: event.status,
        }));

        return JSON.stringify({ events }, null, 2);
      } catch (error: any) {
        log.error(`Error listing events: ${error.message || error}`);
        if (error.code === 404)
          throw new UserError(`Calendar not found: ${args.calendarId}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Google Calendar access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to list events: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
