import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Website } from './website.entity';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Website)
    private websiteRepository: Repository<Website>,
  ) {}

  findAll(): Promise<Website[]> {
    return this.websiteRepository.find();
  }

  findOne(id: number): Promise<Website | null> {
    return this.websiteRepository.findOneBy({ id });
  }

  create(website: Partial<Website>): Promise<Website> {
    const newWebsite = this.websiteRepository.create(website);
    return this.websiteRepository.save(newWebsite);
  }

  async update(id: number, website: Partial<Website>): Promise<Website | null> {
    await this.websiteRepository.update(id, website);
    return this.websiteRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.websiteRepository.delete(id);
  }
}
