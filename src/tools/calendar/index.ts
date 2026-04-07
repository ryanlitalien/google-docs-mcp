import type { FastMCP } from 'fastmcp';
import { register as listCalendars } from './listCalendars.js';
import { register as listEvents } from './listEvents.js';
import { register as getEvent } from './getEvent.js';
import { register as createEvent } from './createEvent.js';
import { register as updateEvent } from './updateEvent.js';
import { register as deleteEvent } from './deleteEvent.js';
import { register as checkAvailability } from './checkAvailability.js';

export function registerCalendarTools(server: FastMCP) {
  listCalendars(server);
  listEvents(server);
  getEvent(server);
  createEvent(server);
  updateEvent(server);
  deleteEvent(server);
  checkAvailability(server);
}
