import { AsyncLocalStorage } from 'node:async_hooks';
import type { docs_v1, drive_v3, sheets_v4, script_v1 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export interface RequestClients {
  auth: OAuth2Client;
  docs: docs_v1.Docs;
  sheets: sheets_v4.Sheets;
  drive: drive_v3.Drive;
  script: script_v1.Script;
}

export const requestClients = new AsyncLocalStorage<RequestClients>();
