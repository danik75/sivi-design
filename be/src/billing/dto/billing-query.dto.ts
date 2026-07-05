import { BadRequestException } from '@nestjs/common';

export class BillingQueryDto {
  period: 'monthly' | 'yearly';
  year: number;
  month?: number;

  static from(raw: Record<string, string>): BillingQueryDto {
    const dto = new BillingQueryDto();
    if (!raw.period || !['monthly', 'yearly'].includes(raw.period)) {
      throw new BadRequestException('period must be "monthly" or "yearly"');
    }
    dto.period = raw.period as 'monthly' | 'yearly';

    const year = parseInt(raw.year, 10);
    if (!raw.year || isNaN(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('year must be a number between 2000 and 2100');
    }
    dto.year = year;

    if (dto.period === 'monthly') {
      const month = parseInt(raw.month, 10);
      if (!raw.month || isNaN(month) || month < 1 || month > 12) {
        throw new BadRequestException('month must be between 1 and 12 for monthly period');
      }
      dto.month = month;
    }

    return dto;
  }

  getBounds(): { startDate: string; endDate: string } {
    if (this.period === 'monthly') {
      // Year-to-date: from Jan 1 of the tax year through the end of the
      // selected month (cumulative from the start of the year).
      const mm = String(this.month).padStart(2, '0');
      const lastDay = new Date(this.year, this.month!, 0).getDate();
      return {
        startDate: `${this.year}-01-01`,
        endDate: `${this.year}-${mm}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    return { startDate: `${this.year}-01-01`, endDate: `${this.year}-12-31` };
  }
}
