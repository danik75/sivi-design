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
  Put,
  Query,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { TransitionStatusDto } from './dto/transition-status.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get('prefill/:contractId')
  prefill(@Param('contractId') contractId: string) {
    return this.service.prefill(contractId);
  }

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('contractId') contractId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(customerId, contractId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInvoiceDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  transitionStatus(@Param('id') id: string, @Body() dto: TransitionStatusDto) {
    return this.service.transitionStatus(id, dto);
  }
}
