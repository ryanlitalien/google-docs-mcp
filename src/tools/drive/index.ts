import type { FastMCP } from 'fastmcp';
import { register as listGoogleDocs } from './listGoogleDocs.js';
import { register as searchGoogleDocs } from './searchGoogleDocs.js';
import { register as listDriveFiles } from './listDriveFiles.js';
import { register as searchDriveFiles } from './searchDriveFiles.js';
import { register as getDocumentInfo } from './getDocumentInfo.js';
import { register as listFolderContents } from './listFolderContents.js';
import { register as getFolderInfo } from './getFolderInfo.js';
import { register as createFolder } from './createFolder.js';
import { register as downloadFile } from './downloadFile.js';

// Removed destructive Drive tools (hardening — require drive write scope):
// moveFile, copyFile, renameFile, deleteFile, createDocument, createFromTemplate

export function registerDriveTools(server: FastMCP) {
  listGoogleDocs(server);
  searchGoogleDocs(server);
  listDriveFiles(server);
  searchDriveFiles(server);
  getDocumentInfo(server);
  listFolderContents(server);
  getFolderInfo(server);
  createFolder(server);
  downloadFile(server);
}
