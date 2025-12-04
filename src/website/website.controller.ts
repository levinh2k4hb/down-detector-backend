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
import { MonitoringService } from '../monitoring/monitoring.service';

@Controller('websites')
export class WebsiteController {
  constructor(
    private readonly websiteService: WebsiteService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get()
  findAll(): Promise<Website[]> {
    return this.websiteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Website | null> {
    return this.websiteService.findOne(+id);
  }

  @Post()
  async create(@Body() website: Partial<Website>): Promise<Website> {
    const createdWebsite = await this.websiteService.create(website);
    
    // Kiểm tra website ngay sau khi tạo
    try {
      await this.monitoringService.checkWebsite(createdWebsite.id);
    } catch (error) {
      console.error(`Error checking website ${createdWebsite.domain}:`, error.message);
    }
    
    // Lấy lại website sau khi đã kiểm tra để có status mới
    const updatedWebsite = await this.websiteService.findOne(createdWebsite.id);
    return updatedWebsite || createdWebsite;
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
