import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { GetAllQueryDTO } from '@DTO/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async getAll(@Query() queryDto: GetAllQueryDTO) {
    return this.searchService.getAllPagedData(queryDto);
  }
}
