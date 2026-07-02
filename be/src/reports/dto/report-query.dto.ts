import { BadRequestException } from '@nestjs/common';

export class ReportQueryDto {
  period: 'monthly' | 'yearly' | 'range';
  year?: number;
  month?: number;
  from?: string;
  to?: string;
  customerId?: string;

  static from(raw: Record<string, string>): ReportQueryDto {
    const dto = new ReportQueryDto();
    const period = raw.period ?? 'monthly';

    if (!['monthly', 'yearly', 'range'].includes(period)) {
      throw new BadRequestException('period must be monthly, yearly, or range');
    }
    dto.period = period as ReportQueryDto['period'];

    if (period === 'range') {
      if (!raw.from || !raw.to) {
        throw new BadRequestException('from and to are required for range period');
      }
      dto.from = raw.from;
      dto.to = raw.to;
    } else {
      const year = parseInt(raw.year, 10);
      if (!raw.year || isNaN(year) || year < 2000 || year > 2100) {
        throw new BadRequestException('year must be between 2000 and 2100');
      }
      dto.year = year;

      if (period === 'monthly') {
        const month = parseInt(raw.month, 10);
        if (!raw.month || isNaN(month) || month < 1 || month > 12) {
          throw new BadRequestException('month must be 1–12 for monthly period');
        }
        dto.month = month;
      }
    }

    if (raw.customerId) dto.customerId = raw.customerId;
    return dto;
  }

  getBounds(): { startDate: string; endDate: string } {
    if (this.period === 'range') {
      return { startDate: this.from!, endDate: this.to! };
    }
    if (this.period === 'monthly') {
      const mm = String(this.month).padStart(2, '0');
      const lastDay = new Date(this.year!, this.month!, 0).getDate();
      return {
        startDate: `${this.year}-${mm}-01`,
        endDate: `${this.year}-${mm}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    return { startDate: `${this.year}-01-01`, endDate: `${this.year}-12-31` };
  }

  // Returns label for the current period
  getPeriodLabel(): string {
    if (this.period === 'range') return `${this.from} – ${this.to}`;
    if (this.period === 'yearly') return String(this.year);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[this.month! - 1]} ${this.year}`;
  }
}
