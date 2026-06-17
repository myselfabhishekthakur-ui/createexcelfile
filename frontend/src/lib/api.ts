import axios, { AxiosError } from 'axios';
import type { ProcessResult, ExcelPreview, ApiResponse, ApiError } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 60000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export async function processText(text: string): Promise<ProcessResult> {
  const response = await api.post<ApiResponse<ProcessResult>>(
    '/api/processing/text',
    { text }
  );
  return response.data.data;
}

export async function uploadDocument(file: File): Promise<ProcessResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ApiResponse<ProcessResult>>(
    '/api/processing/document',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.data;
}

export async function previewExcel(file: File): Promise<ExcelPreview> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ApiResponse<ExcelPreview>>(
    '/api/excel/preview',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.data;
}

export async function modifyExcel(
  file: File,
  instructions: string
): Promise<ProcessResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('instructions', instructions);
  const response = await api.post<ApiResponse<ProcessResult>>(
    '/api/excel/modify',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.data;
}

export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await api.get(`/api/files/${fileId}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
