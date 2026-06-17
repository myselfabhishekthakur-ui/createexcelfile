import { Injectable, Logger } from '@nestjs/common';

export type OperationType =
  | 'ADD_COLUMN'
  | 'ADD_DATA'
  | 'INSERT_SHEET'
  | 'UPDATE_ROWS'
  | 'DELETE_COLUMN'
  | 'DELETE_ROW'
  | 'RENAME_SHEET';

export interface ExcelOperation {
  type: OperationType;
  target: string;
  data?: string[][];
  value?: string;
  condition?: string;
  sheetName?: string;
}

@Injectable()
export class InstructionParser {
  private readonly logger = new Logger(InstructionParser.name);

  parse(instructions: string): ExcelOperation[] {
    const lines = instructions
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const operations: ExcelOperation[] = [];

    for (const line of lines) {
      const op = this.parseLine(line);
      if (op) {
        operations.push(op);
        this.logger.log(`Parsed instruction: ${op.type} -> ${op.target}`);
      } else {
        this.logger.warn(`Could not parse instruction: "${line}"`);
      }
    }

    return operations;
  }

  private parseLine(line: string): ExcelOperation | null {
    const normalized = line.toLowerCase();

    // Add a new column
    // e.g., "Add a new column named Status" or "Add column 'Status'"
    const addColMatch = line.match(
      /add\s+(?:a\s+)?(?:new\s+)?column\s+(?:named|called|"([^"]+)"|'([^']+)'|(\S+))(?:\s+with\s+(?:default\s+)?(?:value\s+)?(?:"([^"]+)"|'([^']+)'|(\S+)))?/i,
    );
    if (addColMatch) {
      const target =
        addColMatch[1] || addColMatch[2] || addColMatch[3] || '';
      const defaultValue =
        addColMatch[4] || addColMatch[5] || addColMatch[6] || '';
      return {
        type: 'ADD_COLUMN',
        target: target.replace(/['"]/g, ''),
        value: defaultValue,
      };
    }

    // Add data to a column
    // e.g., "Add this data to Column A: value1, value2, value3"
    const addDataMatch = line.match(
      /add\s+(?:this\s+)?data\s+to\s+(?:column\s+)?(?:"([^"]+)"|'([^']+)'|(\S+))(?:\s*:\s*(.+))?/i,
    );
    if (addDataMatch) {
      const target =
        addDataMatch[1] || addDataMatch[2] || addDataMatch[3] || '';
      const rawData = addDataMatch[4] || '';
      const data = rawData
        ? rawData.split(/,\s*/).map((v) => [v.trim()])
        : [];
      return {
        type: 'ADD_DATA',
        target: target.replace(/['"]/g, ''),
        data,
      };
    }

    // Insert a new sheet
    // e.g., "Insert a new sheet named Summary" or "Insert a new sheet with these records"
    const insertSheetMatch = line.match(
      /insert\s+(?:a\s+)?(?:new\s+)?sheet\s+(?:named|called|with\s+name)?\s*(?:"([^"]+)"|'([^']+)'|(\S+))?/i,
    );
    if (insertSheetMatch) {
      const target =
        insertSheetMatch[1] ||
        insertSheetMatch[2] ||
        insertSheetMatch[3] ||
        'NewSheet';
      return {
        type: 'INSERT_SHEET',
        target: target.replace(/['"]/g, ''),
      };
    }

    // Update rows
    // e.g., "Update rows where Name is John" or "Update row 5"
    const updateMatch = line.match(
      /update\s+(?:rows?(?:\s+(\d+))?)\s+(?:where|based\s+on|if)\s+(.+)/i,
    );
    if (updateMatch) {
      return {
        type: 'UPDATE_ROWS',
        target: updateMatch[1] || '',
        condition: updateMatch[2],
      };
    }

    // Delete column
    // e.g., "Delete column C" or "Remove column 'Status'"
    const deleteColMatch = line.match(
      /(?:delete|remove)\s+column\s+(?:"([^"]+)"|'([^']+)'|(\S+))/i,
    );
    if (deleteColMatch) {
      const target =
        deleteColMatch[1] || deleteColMatch[2] || deleteColMatch[3] || '';
      return {
        type: 'DELETE_COLUMN',
        target: target.replace(/['"]/g, ''),
      };
    }

    // Delete row
    // e.g., "Delete row 5"
    const deleteRowMatch = line.match(
      /(?:delete|remove)\s+row\s+(\d+)/i,
    );
    if (deleteRowMatch) {
      return {
        type: 'DELETE_ROW',
        target: deleteRowMatch[1],
      };
    }

    // Rename sheet
    // e.g., "Rename sheet Sheet1 to Summary"
    const renameMatch = line.match(
      /rename\s+sheet\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s+to\s+(?:"([^"]+)"|'([^']+)'|(\S+))/i,
    );
    if (renameMatch) {
      const source =
        renameMatch[1] || renameMatch[2] || renameMatch[3] || '';
      const target =
        renameMatch[4] || renameMatch[5] || renameMatch[6] || '';
      return {
        type: 'RENAME_SHEET',
        target: target.replace(/['"]/g, ''),
        sheetName: source.replace(/['"]/g, ''),
      };
    }

    return null;
  }
}
