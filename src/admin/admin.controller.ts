import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Admin } from './admin.entity';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAll(): Promise<Admin[]> {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Admin | null> {
    return this.adminService.findOne(+id);
  }

  @Post()
  create(@Body() admin: Partial<Admin>): Promise<Admin> {
    return this.adminService.create(admin);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() admin: Partial<Admin>,
  ): Promise<Admin | null> {
    return this.adminService.update(+id, admin);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.adminService.remove(+id);
  }
}
