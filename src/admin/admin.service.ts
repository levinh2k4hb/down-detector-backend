import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  findAll(): Promise<Admin[]> {
    return this.adminRepository.find();
  }

  findOne(id: number): Promise<Admin | null> {
    return this.adminRepository.findOneBy({ id });
  }

  create(admin: Partial<Admin>): Promise<Admin> {
    const newAdmin = this.adminRepository.create(admin);
    return this.adminRepository.save(newAdmin);
  }

  async update(id: number, admin: Partial<Admin>): Promise<Admin | null> {
    await this.adminRepository.update(id, admin);
    return this.adminRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.adminRepository.delete(id);
  }
}
