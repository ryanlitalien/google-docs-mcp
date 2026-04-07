import type { FastMCP } from 'fastmcp';
import { register as listMessages } from './listMessages.js';
import { register as getMessage } from './getMessage.js';
import { register as sendMessage } from './sendMessage.js';
import { register as listLabels } from './listLabels.js';
import { register as modifyLabels } from './modifyLabels.js';

export function registerGmailTools(server: FastMCP) {
  listMessages(server);
  getMessage(server);
  sendMessage(server);
  listLabels(server);
  modifyLabels(server);
}
