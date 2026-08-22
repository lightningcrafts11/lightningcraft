export {
  HISTORY_LIMIT,
  HISTORY_COALESCE_MS,
  cloneDocument,
  recordDocumentChange,
  undoDocument,
  redoDocument,
  historyFlags,
  isUndoShortcut,
  isRedoShortcut,
} from './documentHistory';
export type { DocumentHistory, HistoryApplyResult } from './documentHistory';
