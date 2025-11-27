import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IncubatorsService } from './incubators.service';
import { CreateIncubatorDto } from './dto/create-incubator.dto';
import { UpdateIncubatorDto } from './dto/update-incubator.dto';

@Controller('incubators')
export class IncubatorsController {
  constructor(private readonly incubatorsService: IncubatorsService) {}

  @Post()
  create(@Body() createIncubatorDto: CreateIncubatorDto) {
    return this.incubatorsService.create(createIncubatorDto);
  }

  @Get()
  findAll() {
    return this.incubatorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incubatorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncubatorDto: UpdateIncubatorDto) {
    return this.incubatorsService.update(+id, updateIncubatorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incubatorsService.remove(+id);
  }
}
