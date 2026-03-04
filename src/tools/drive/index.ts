import type { FastMCP } from 'fastmcp';
import { register as listGoogleDocs } from './listGoogleDocs.js';
import { register as searchGoogleDocs } from './searchGoogleDocs.js';
import { register as getDocumentInfo } from './getDocumentInfo.js';
import { register as listFolderContents } from './listFolderContents.js';
import { register as getFolderInfo } from './getFolderInfo.js';

// Removed write/destructive tools (require drive write scope):
// createFolder, moveFile, copyFile, renameFile, deleteFile, createDocument, createFromTemplate

export function registerDriveTools(server: FastMCP) {
  listGoogleDocs(server);
  searchGoogleDocs(server);
  getDocumentInfo(server);
  listFolderContents(server);
  getFolderInfo(server);
}
