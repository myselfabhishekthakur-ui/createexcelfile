import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FileEntity } from './file.entity';

@Entity('processing_history')
export class ProcessingHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_file_id', nullable: true })
  sourceFileId: string;

  @Column({ name: 'result_file_id', nullable: true })
  resultFileId: string;

  @Column({ name: 'operation_type' })
  operationType: 'TEXT_TO_EXCEL' | 'DOC_TO_EXCEL' | 'MODIFY_EXCEL';

  @Column({ name: 'input_summary', type: 'text', nullable: true })
  inputSummary: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'processing_time_ms', nullable: true })
  processingTimeMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => FileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_file_id' })
  sourceFile: FileEntity;

  @ManyToOne(() => FileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'result_file_id' })
  resultFile: FileEntity;
}
