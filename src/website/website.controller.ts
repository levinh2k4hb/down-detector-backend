import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { WebsiteService } from './website.service';
import { Website } from './website.entity';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  findAll(): Promise<Website[]> {
    return this.websiteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Website | null> {
    return this.websiteService.findOne(+id);
  }

  @Post()
  create(@Body() website: Partial<Website>): Promise<Website> {
    return this.websiteService.create(website);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() website: Partial<Website>,
  ): Promise<Website | null> {
    return this.websiteService.update(+id, website);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.websiteService.remove(+id);
  }
}
