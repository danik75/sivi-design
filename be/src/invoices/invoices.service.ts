import { Injectable } from '@nestjs/common';
import { CreateInvoiceAttachmentDto } from './dto/create-invoice-attachment.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { TransitionStatusDto } from './dto/transition-status.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceRepository } from './invoice.repository';

@Injectable()
export class InvoicesService {
  constructor(private readonly repo: InvoiceRepository) {}

  findAll(customerId?: string, contractId?: string, status?: string) {
    return this.repo.findAll(customerId, contractId, status);
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  create(dto: CreateInvoiceDto) {
    return this.repo.create(dto);
  }

  update(id: string, dto: UpdateInvoiceDto) {
    return this.repo.update(id, dto);
  }

  remove(id: string) {
    return this.repo.remove(id);
  }

  transitionStatus(id: string, dto: TransitionStatusDto) {
    return this.repo.transitionStatus(id, dto.status);
  }

  prefill(contractId: string) {
    return this.repo.prefill(contractId);
  }

  availableTasks(customerId: string, excludeInvoiceId?: string) {
    return this.repo.getAvailableTasks(customerId, excludeInvoiceId);
  }

  availableExpenses(customerId: string, excludeInvoiceId?: string, search?: string) {
    return this.repo.getAvailableExpenses(customerId, excludeInvoiceId, search);
  }

  listAttachments(invoiceId: string) {
    return this.repo.listAttachments(invoiceId);
  }

  getAttachment(attachmentId: string) {
    return this.repo.getAttachment(attachmentId);
  }

  addAttachment(invoiceId: string, dto: CreateInvoiceAttachmentDto) {
    return this.repo.addAttachment(invoiceId, dto);
  }

  deleteAttachment(attachmentId: string) {
    return this.repo.deleteAttachment(attachmentId);
  }
}
