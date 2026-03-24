import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TransactionFilterDto extends PaginationDto {
  @IsString()
  regionId: string;

  @IsOptional()
  @IsIn(['villa', 'officetel', 'all'])
  propertyType?: string = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  periodMonths?: number = 12;

  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  minArea?: number;

  @IsOptional()
  @Type(() => Number)
  maxArea?: number;

  @IsOptional()
  @Type(() => Number)
  minBuildYear?: number;

  @IsOptional()
  @Type(() => Number)
  maxBuildYear?: number;

  @IsOptional()
  @IsIn(['dealDate', 'price', 'pricePerPyeong', 'area'])
  sort?: string = 'dealDate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: string = 'desc';
}
