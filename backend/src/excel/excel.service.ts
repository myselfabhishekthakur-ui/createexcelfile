import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import {
  ExcelOperation,
  InstructionParser,
} from './instruction-parser';
import { ParsedData } from '../processing/parsers/text-parser';

export interface ExcelGenerationResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  sheetsCount: number;
  rowsCount: number;
  columnsCount: number;
}

export interface SheetPreview {
  name: string;
  columns: string[];
  rowCount: number;
  sampleData: string[][];
}

export interface ExcelPreviewResult {
  sheets: SheetPreview[];
  totalRows: number;
}

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);
  private readonly generatedDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly instructionParser: InstructionParser,
  ) {
    this.generatedDir =
      this.configService.get<string>('storage.generatedDir') ||
      './storage/generated';
    fs.mkdirSync(this.generatedDir, { recursive: true });
  }

  async generateFromParsedData(
    parsedData: ParsedData,
    originalName?: string,
  ): Promise<ExcelGenerationResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ExcelWeb';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Data');

    // Add headers with styling
    if (parsedData.headers.length > 0) {
      const headerRow = worksheet.addRow(parsedData.headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }

    // Add data rows
    for (const row of parsedData.rows) {
      const dataRow = worksheet.addRow(row);
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        };
        cell.alignment = { vertical: 'middle' };
      });
    }

    // Auto-size columns
    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = Math.min(cellLength, 50);
        }
      });
      col.width = maxLength + 4;
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add auto-filter
    if (parsedData.headers.length > 0 && parsedData.rows.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: parsedData.headers.length },
      };
    }

    // Save file
    const baseName = originalName
      ? path.parse(originalName).name
      : 'generated';
    const fileName = `${baseName}_${uuid().slice(0, 8)}.xlsx`;
    const filePath = path.join(this.generatedDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    const stats = fs.statSync(filePath);

    this.logger.log(`Generated Excel: ${fileName} (${stats.size} bytes)`);

    return {
      filePath,
      fileName,
      fileSize: stats.size,
      sheetsCount: workbook.worksheets.length,
      rowsCount: parsedData.rows.length,
      columnsCount: parsedData.headers.length,
    };
  }

  async previewExcel(buffer: Buffer): Promise<ExcelPreviewResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheets: SheetPreview[] = [];
    let totalRows = 0;

    workbook.eachSheet((worksheet) => {
      const columns: string[] = [];
      const sampleData: string[][] = [];

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell({ includeEmpty: false }, (cell) => {
        columns.push(cell.value?.toString() || `Col ${cell.col}`);
      });

      // Get sample data (up to 5 rows)
      const rowCount = worksheet.rowCount - 1; // minus header
      for (let r = 2; r <= Math.min(worksheet.rowCount, 6); r++) {
        const row = worksheet.getRow(r);
        const rowData: string[] = [];
        for (let c = 1; c <= columns.length; c++) {
          rowData.push(row.getCell(c).value?.toString() || '');
        }
        sampleData.push(rowData);
      }

      totalRows += Math.max(0, rowCount);

      sheets.push({
        name: worksheet.name,
        columns,
        rowCount: Math.max(0, rowCount),
        sampleData,
      });
    });

    return { sheets, totalRows };
  }

  async modifyExcel(
    buffer: Buffer,
    instructions: string,
    originalName: string,
  ): Promise<ExcelGenerationResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const operations = this.instructionParser.parse(instructions);
    this.logger.log(`Applying ${operations.length} operations...`);

    for (const op of operations) {
      this.applyOperation(workbook, op);
    }

    // Save modified file
    const baseName = path.parse(originalName).name;
    const fileName = `${baseName}_modified_${uuid().slice(0, 8)}.xlsx`;
    const filePath = path.join(this.generatedDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    const stats = fs.statSync(filePath);

    // Calculate totals
    let totalRows = 0;
    let maxCols = 0;
    workbook.eachSheet((ws) => {
      totalRows += Math.max(0, ws.rowCount - 1);
      if (ws.columnCount > maxCols) maxCols = ws.columnCount;
    });

    return {
      filePath,
      fileName,
      fileSize: stats.size,
      sheetsCount: workbook.worksheets.length,
      rowsCount: totalRows,
      columnsCount: maxCols,
    };
  }

  private applyOperation(
    workbook: ExcelJS.Workbook,
    op: ExcelOperation,
  ): void {
    const worksheet = workbook.worksheets[0]; // Default to first sheet

    switch (op.type) {
      case 'ADD_COLUMN': {
        if (!worksheet) break;
        const newColIndex = worksheet.columnCount + 1;
        const headerRow = worksheet.getRow(1);
        headerRow.getCell(newColIndex).value = op.target;
        headerRow.getCell(newColIndex).font = { bold: true };

        // Fill default value if provided
        if (op.value) {
          for (let r = 2; r <= worksheet.rowCount; r++) {
            worksheet.getRow(r).getCell(newColIndex).value = op.value;
          }
        }
        this.logger.log(`Added column "${op.target}"`);
        break;
      }

      case 'ADD_DATA': {
        if (!worksheet || !op.data) break;
        // Find column by name
        const headerRow = worksheet.getRow(1);
        let colIndex = -1;
        headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
          if (
            cell.value?.toString().toLowerCase() ===
            op.target.toLowerCase()
          ) {
            colIndex = col;
          }
        });

        if (colIndex === -1) {
          // Column doesn't exist, create it
          colIndex = worksheet.columnCount + 1;
          headerRow.getCell(colIndex).value = op.target;
          headerRow.getCell(colIndex).font = { bold: true };
        }

        // Add data starting after existing data
        let startRow = worksheet.rowCount + 1;
        for (const dataRow of op.data) {
          worksheet.getRow(startRow).getCell(colIndex).value =
            dataRow[0] || '';
          startRow++;
        }
        this.logger.log(
          `Added ${op.data.length} entries to column "${op.target}"`,
        );
        break;
      }

      case 'INSERT_SHEET': {
        workbook.addWorksheet(op.target);
        this.logger.log(`Inserted new sheet "${op.target}"`);
        break;
      }

      case 'DELETE_COLUMN': {
        if (!worksheet) break;
        const headerRow2 = worksheet.getRow(1);
        let targetCol = -1;

        // Find by name first
        headerRow2.eachCell({ includeEmpty: false }, (cell, col) => {
          if (
            cell.value?.toString().toLowerCase() ===
            op.target.toLowerCase()
          ) {
            targetCol = col;
          }
        });

        // Try letter-based column (A=1, B=2, etc.)
        if (targetCol === -1 && op.target.length <= 2) {
          const colLetter = op.target.toUpperCase();
          targetCol = this.letterToColumn(colLetter);
        }

        if (targetCol > 0) {
          worksheet.spliceColumns(targetCol, 1);
          this.logger.log(`Deleted column "${op.target}"`);
        }
        break;
      }

      case 'DELETE_ROW': {
        if (!worksheet) break;
        const rowNum = parseInt(op.target, 10);
        if (!isNaN(rowNum) && rowNum > 0) {
          worksheet.spliceRows(rowNum + 1, 1); // +1 because user counts from data, not header
          this.logger.log(`Deleted row ${rowNum}`);
        }
        break;
      }

      case 'RENAME_SHEET': {
        const targetSheet = workbook.worksheets.find(
          (ws) =>
            ws.name.toLowerCase() === (op.sheetName || '').toLowerCase(),
        );
        if (targetSheet) {
          targetSheet.name = op.target;
          this.logger.log(
            `Renamed sheet "${op.sheetName}" to "${op.target}"`,
          );
        }
        break;
      }

      case 'UPDATE_ROWS': {
        if (!worksheet || !op.condition) break;
        // Parse condition like "Name is John" or "Column A = value"
        const conditionMatch = op.condition.match(
          /(\S+)\s+(?:is|=|equals)\s+(.+)/i,
        );
        if (!conditionMatch) break;

        const condCol = conditionMatch[1];
        const condValue = conditionMatch[2].replace(/['"]/g, '').trim();

        // Find column index
        const hr = worksheet.getRow(1);
        let condColIndex = -1;
        hr.eachCell({ includeEmpty: false }, (cell, col) => {
          if (
            cell.value?.toString().toLowerCase() ===
            condCol.toLowerCase()
          ) {
            condColIndex = col;
          }
        });

        if (condColIndex > 0) {
          let updated = 0;
          for (let r = 2; r <= worksheet.rowCount; r++) {
            const cellValue = worksheet
              .getRow(r)
              .getCell(condColIndex)
              .value?.toString();
            if (
              cellValue?.toLowerCase() === condValue.toLowerCase()
            ) {
              // Mark the row (highlight it) — actual value updates would need more complex parsing
              const row = worksheet.getRow(r);
              row.eachCell((cell) => {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFFF00' },
                };
              });
              updated++;
            }
          }
          this.logger.log(
            `Updated ${updated} rows matching ${condCol}=${condValue}`,
          );
        }
        break;
      }
    }
  }

  private letterToColumn(letter: string): number {
    let col = 0;
    for (let i = 0; i < letter.length; i++) {
      col = col * 26 + (letter.charCodeAt(i) - 64);
    }
    return col;
  }
}
