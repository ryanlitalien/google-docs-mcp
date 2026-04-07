import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getCalendarClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'checkAvailability',
    description:
      'Checks free/busy availability for one or more people. Useful for finding meeting times.',
    parameters: z.object({
      emails: z
        .array(z.string())
        .describe('List of email addresses to check availability for.'),
      timeMin: z.string().describe('Start of time range (RFC 3339).'),
      timeMax: z.string().describe('End of time range (RFC 3339).'),
    }),
    execute: async (args, { log }) => {
      const calendar = await getCalendarClient();
      log.info(`Checking availability for ${args.emails.length} people`);

      try {
        const response = await calendar.freebusy.query({
          requestBody: {
            timeMin: args.timeMin,
            timeMax: args.timeMax,
            items: args.emails.map((email) => ({ id: email })),
          },
        });

        const availability: Record<string, any> = {};
        const calendars = response.data.calendars || {};
        for (const email of args.emails) {
          const cal = calendars[email];
          if (cal) {
            availability[email] = {
              busy: (cal.busy || []).map((b) => ({ start: b.start, end: b.end })),
              errors: cal.errors || [],
            };
          }
        }

        return JSON.stringify({ availability }, null, 2);
      } catch (error: any) {
        log.error(`Error checking availability: ${error.message || error}`);
        if (error.code === 403) throw new UserError('Permission denied.');
        throw new UserError(`Failed to check availability: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
