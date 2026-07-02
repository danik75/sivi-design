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
} from '@nestjs/common';
import { BusinessProposalsService } from './business-proposals.service';
import { CreateBusinessProposalDto } from './dto/create-business-proposal.dto';
import { RefineBusinessProposalDto } from './dto/refine-business-proposal.dto';
import { UpdateBusinessProposalLifecycleDto } from './dto/update-business-proposal-lifecycle.dto';

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
