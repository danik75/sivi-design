import { Injectable } from '@nestjs/common';
import { BusinessProposalRepository } from './business-proposal.repository';
import { CreateBusinessProposalDto } from './dto/create-business-proposal.dto';
import { RefineBusinessProposalDto } from './dto/refine-business-proposal.dto';
import { UpdateBusinessProposalLifecycleDto } from './dto/update-business-proposal-lifecycle.dto';
import { ContentJson } from './proposal-template';

@Injectable()
export class BusinessProposalsService {
  constructor(private readonly repo: BusinessProposalRepository) {}

  findAll(customerId?: string, status?: string) {
    return this.repo.findAll(customerId, status);
  }

  findOne(id: string) {
    return this.repo.findOne(id);
  }

  async create(dto: CreateBusinessProposalDto) {
    const created = await this.repo.create(dto);
    this.runGeneration(created.id);
    return { id: created.id, status: created.status, createdAt: created.createdAt };
  }

  async resubmit(id: string) {
    const queued = await this.repo.resubmit(id);
    this.runGeneration(queued.id);
    return queued;
  }

  async refine(id: string, dto: RefineBusinessProposalDto) {
    const queued = await this.repo.refine(id);
    this.runGeneration(queued.id, dto.refinementText.trim());
    return queued;
  }

  updateLifecycle(id: string, dto: UpdateBusinessProposalLifecycleDto) {
    return this.repo.updateLifecycle(id, dto.lifecycleStatus);
  }

  updateContent(id: string, contentJson: ContentJson) {
    return this.repo.updateContent(id, contentJson);
  }

  async getPdfBuffer(id: string): Promise<Buffer> {
    return this.repo.generatePdfBuffer(id);
  }

  remove(id: string) {
    return this.repo.remove(id);
  }

  private runGeneration(id: string, refinementText?: string) {
    void this.repo.processGeneration(id, refinementText).catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`business-proposal-generation failed for ${id}`, error);
    });
  }
}
