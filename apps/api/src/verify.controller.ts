import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('verify')
export class VerifyController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':publicVerifyId')
  async getByVerifyId(@Param('publicVerifyId') publicVerifyId: string) {
    const result = await this.invoicesService.getByVerifyId(publicVerifyId);
    if (!result) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'VERIFY_NOT_FOUND',
          message: 'Verification record not found',
        },
      });
    }

    return {
      success: true,
      data: result,
    };
  }
}
