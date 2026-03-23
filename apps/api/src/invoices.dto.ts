import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency!: string;

  @IsDateString()
  issueDate!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AiInvoiceDraftRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  customerName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AiCanvasGenerateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt!: string;
}

export class InvoiceLineItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  description!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  quantity!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  unitPrice!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  taxPercentage?: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;
}

export class InvoicePaletteDto {
  @IsString()
  @IsHexColor()
  primary!: string;

  @IsString()
  @IsHexColor()
  secondary!: string;

  @IsString()
  @IsHexColor()
  surface!: string;

  @IsString()
  @IsHexColor()
  surfaceAlt!: string;

  @IsString()
  @IsHexColor()
  text!: string;

  @IsString()
  @IsHexColor()
  muted!: string;

  @IsString()
  @IsHexColor()
  accent!: string;
}

export class InvoiceStyleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  templateId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  styleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  accentLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  hierarchyStyle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  lineItemPresentation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  footerStyle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trustBadge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  previewSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  headerTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  heroCopy?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoicePaletteDto)
  palette?: InvoicePaletteDto;
}

export class FinalizeGeneratedInvoiceDto extends CreateInvoiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  issuerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  issuerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  issuerAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  accentLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  taxPercentage?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  discountPercentage?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems?: InvoiceLineItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceStyleDto)
  style?: InvoiceStyleDto;
}

export class InvoiceCanvasBindingDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  key?: string;
}

export class InvoiceCanvasBlockStyleDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fontSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  fontWeight?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  background?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  align?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;
}

export class InvoiceCanvasBlockDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  type!: string;

  @Type(() => Number)
  @IsNumber()
  x!: number;

  @Type(() => Number)
  @IsNumber()
  y!: number;

  @Type(() => Number)
  @IsNumber()
  w!: number;

  @Type(() => Number)
  @IsNumber()
  h!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  z?: number;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsBoolean()
  editable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceCanvasBindingDto)
  binding?: InvoiceCanvasBindingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceCanvasBlockStyleDto)
  style?: InvoiceCanvasBlockStyleDto;
}

export class CanvasDraftRequestDto extends FinalizeGeneratedInvoiceDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoicePaletteDto)
  palette?: InvoicePaletteDto;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  styleDirection?: string;
}

export class FinalizeCanvasInvoiceDto extends FinalizeGeneratedInvoiceDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoicePaletteDto)
  palette?: InvoicePaletteDto;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  selectedTemplateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200000)
  logoDataUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => InvoiceCanvasBlockDto)
  canvasBlocks?: InvoiceCanvasBlockDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  attachmentNames?: string[];
}
