import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { BusinessProposalsService } from './business-proposals.service';
import { CreateBusinessProposalDto } from './dto/create-business-proposal.dto';
import { RefineBusinessProposalDto } from './dto/refine-business-proposal.dto';
import { UpdateBusinessProposalLifecycleDto } from './dto/update-business-proposal-lifecycle.dto';
import { ContentJson } from './proposal-template';

@Controller('business-proposals')
export class BusinessProposalsController {
  constructor(private readonly service: BusinessProposalsService) {}

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(customerId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.getPdfBuffer(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="proposal-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Body() dto: CreateBusinessProposalDto) {
    return this.service.create(dto);
  }

  @Patch(':id/resubmit')
  @HttpCode(HttpStatus.ACCEPTED)
  resubmit(@Param('id') id: string) {
    return this.service.resubmit(id);
  }

  @Patch(':id/refine')
  @HttpCode(HttpStatus.ACCEPTED)
  refine(
    @Param('id') id: string,
    @Body() dto: RefineBusinessProposalDto,
  ) {
    return this.service.refine(id, dto);
  }

  @Patch(':id/content')
  @HttpCode(HttpStatus.OK)
  updateContent(
    @Param('id') id: string,
    @Body() body: { contentJson: ContentJson },
  ) {
    return this.service.updateContent(id, body.contentJson);
  }

  @Patch(':id/lifecycle')
  @HttpCode(HttpStatus.OK)
  updateLifecycle(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessProposalLifecycleDto,
  ) {
    return this.service.updateLifecycle(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
