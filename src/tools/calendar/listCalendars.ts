import type { FastMCP } from 'fastmcp';
import { UserError } from 'fastmcp';
import { z } from 'zod';
import { getCalendarClient } from '../../clients.js';

export function register(server: FastMCP) {
  server.addTool({
    name: 'listCalendars',
    description:
      'Lists all calendars the user has access to. Use this to discover calendar IDs for use with other calendar tools.',
    parameters: z.object({}),
    execute: async (_args, { log }) => {
      const calendar = await getCalendarClient();
      log.info('Listing calendars');

      try {
        const response = await calendar.calendarList.list();
        const calendars = (response.data.items || []).map((cal) => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary || false,
          accessRole: cal.accessRole,
          backgroundColor: cal.backgroundColor,
        }));

        return JSON.stringify({ calendars }, null, 2);
      } catch (error: any) {
        log.error(`Error listing calendars: ${error.message || error}`);
        if (error.code === 403)
          throw new UserError(
            'Permission denied. Make sure you have granted Google Calendar access. You may need to re-authenticate.'
          );
        throw new UserError(`Failed to list calendars: ${error.message || 'Unknown error'}`);
      }
    },
  });
}
