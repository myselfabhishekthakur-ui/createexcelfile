export interface ProcessResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  sheetsCount: number;
  rowsCount: number;
  columnsCount: number;
  message: string;
}

export interface FileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  fileType: 'UPLOAD' | 'GENERATED' | 'MODIFIED';
  createdAt: string;
}

export interface ExcelPreview {
  sheets: SheetPreview[];
  totalRows: number;
}

export interface SheetPreview {
  name: string;
  columns: string[];
  rowCount: number;
  sampleData: string[][];
}

export interface ProcessingHistoryItem {
  id: string;
  operationType: 'TEXT_TO_EXCEL' | 'DOC_TO_EXCEL' | 'MODIFY_EXCEL';
  inputSummary: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  processingTimeMs?: number;
  createdAt: string;
  resultFileId?: string;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}
