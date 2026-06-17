# ExcelWeb — Full-Stack Excel Processing Application

Transform text, documents, and data into professional Excel spreadsheets. Edit existing Excel files with simple natural-language instructions.

## Architecture

```
excel-web/
├── frontend/          # Next.js 15 (App Router, TypeScript)
├── backend/           # NestJS (TypeScript, ExcelJS, PostgreSQL)
└── docker-compose.yml # PostgreSQL database
```

## Quick Start

### 1. Start the Database

```bash
docker-compose up -d
```

### 2. Start the Backend

```bash
cd backend
npm run start:dev
```

The API will be available at `http://localhost:3001`.
Swagger docs at `http://localhost:3001/api/docs`.

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`.

## Features

- **Text to Excel**: Paste CSV, TSV, or delimited text → auto-detect format → generate styled .xlsx
- **Document to Excel**: Upload DOC/DOCX → extract tables/text → generate .xlsx
- **Edit Excel**: Upload .xlsx → give instructions (add column, insert sheet, etc.) → download modified file

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/processing/text` | Process pasted text → generate Excel |
| POST | `/api/processing/document` | Process uploaded DOC/DOCX → generate Excel |
| POST | `/api/excel/preview` | Preview uploaded XLSX structure |
| POST | `/api/excel/modify` | Modify XLSX with instructions |
| GET | `/api/files/:id/download` | Download generated/modified file |
| GET | `/api/files/:id/info` | Get file metadata |

## Tech Stack

- **Frontend**: Next.js 15, React, Framer Motion, Axios, react-dropzone
- **Backend**: NestJS, ExcelJS, Mammoth, TypeORM, PostgreSQL
- **Styling**: Vanilla CSS with glassmorphic dark theme
