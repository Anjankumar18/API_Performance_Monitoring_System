import { Controller, Get } from '@nestjs/common';

@Controller('sample')
export class SampleController {
  @Get()
  fast() {
    return { message: 'Fast response' };
  }

  @Get('slow')
  async slow() {
    await new Promise(res => setTimeout(res, 500));
    return { message: 'Slow response' };
  }
}
