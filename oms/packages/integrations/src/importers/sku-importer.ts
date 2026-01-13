import { parseSKUCSV, SKUCSVRow, CSVParseResult } from './csv-parser';

export interface SKUImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: SKUImportError[];
  createdSKUs: string[];
  updatedSKUs: string[];
  skippedSKUs: string[];
}

export interface SKUImportError {
  row: number;
  skuCode?: string;
  field?: string;
  message: string;
  rawData?: Record<string, string>;
}

export interface SKUCreateData {
  code: string;
  name: string;
  description?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  hsn?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  mrp?: number;
  costPrice?: number;
  sellingPrice?: number;
  taxRate?: number;
  barcodes?: string[];
  reorderLevel?: number;
  reorderQty?: number;
  companyId: string;
}

export interface SKUImporterConfig {
  companyId: string;
  updateExisting?: boolean;
  skipDuplicates?: boolean;
  defaultCategory?: string;
  defaultTaxRate?: number;
  onProgress?: (processed: number, total: number) => void;
}

export interface ExistingSKUResult {
  exists: boolean;
  skuMap: Map<string, { id: string; name: string }>;
}

export type SKUExistenceChecker = (skuCodes: string[]) => Promise<ExistingSKUResult>;
export type SKUCreator = (sku: SKUCreateData) => Promise<{ success: boolean; skuId?: string; error?: string }>;
export type SKUUpdater = (skuCode: string, data: Partial<SKUCreateData>) => Promise<{ success: boolean; error?: string }>;

export class SKUImporter {
  private config: SKUImporterConfig;
  private skuCreator: SKUCreator;
  private skuUpdater?: SKUUpdater;
  private existenceChecker?: SKUExistenceChecker;

  constructor(
    config: SKUImporterConfig,
    skuCreator: SKUCreator,
    skuUpdater?: SKUUpdater,
    existenceChecker?: SKUExistenceChecker
  ) {
    this.config = config;
    this.skuCreator = skuCreator;
    this.skuUpdater = skuUpdater;
    this.existenceChecker = existenceChecker;
  }

  async importFromCSV(csvContent: string): Promise<SKUImportResult> {
    const result: SKUImportResult = {
      success: false,
      totalRows: 0,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      errors: [],
      createdSKUs: [],
      updatedSKUs: [],
      skippedSKUs: [],
    };

    // Parse CSV
    const parseResult: CSVParseResult<SKUCSVRow> = await parseSKUCSV(csvContent);

    if (!parseResult.success || !parseResult.data) {
      result.errors = parseResult.errors?.map((e) => ({
        row: e.row,
        field: e.field,
        message: e.message,
        rawData: e.rawData,
      })) || [{ row: 0, message: 'Failed to parse CSV' }];
      result.errorCount = result.errors.length;
      return result;
    }

    result.totalRows = parseResult.totalRows || parseResult.data.length;

    // Check existing SKUs
    let existingSKUs = new Map<string, { id: string; name: string }>();
    if (this.existenceChecker) {
      const skuCodes = parseResult.data.map((row) => row.code);
      const existenceResult = await this.existenceChecker(skuCodes);
      existingSKUs = existenceResult.skuMap;
    }

    // Process each SKU
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNum = i + 2; // +2 for header and 0-index
      result.processedRows++;

      // Check if SKU exists
      const existing = existingSKUs.get(row.code);

      if (existing) {
        if (this.config.skipDuplicates) {
          result.skippedCount++;
          result.skippedSKUs.push(row.code);
          continue;
        }

        if (this.config.updateExisting && this.skuUpdater) {
          try {
            const updateData = this.convertRowToSKUData(row);
            const updateResult = await this.skuUpdater(row.code, updateData);

            if (updateResult.success) {
              result.successCount++;
              result.updatedSKUs.push(row.code);
            } else {
              result.errorCount++;
              result.errors.push({
                row: rowNum,
                skuCode: row.code,
                message: updateResult.error || 'Failed to update SKU',
              });
            }
          } catch (error) {
            result.errorCount++;
            result.errors.push({
              row: rowNum,
              skuCode: row.code,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
          continue;
        }

        // Skip if no update config
        result.skippedCount++;
        result.skippedSKUs.push(row.code);
        continue;
      }

      // Create new SKU
      try {
        const skuData = this.convertRowToSKUData(row);
        const createResult = await this.skuCreator(skuData);

        if (createResult.success && createResult.skuId) {
          result.successCount++;
          result.createdSKUs.push(createResult.skuId);
        } else {
          result.errorCount++;
          result.errors.push({
            row: rowNum,
            skuCode: row.code,
            message: createResult.error || 'Failed to create SKU',
          });
        }
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rowNum,
          skuCode: row.code,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Report progress
      if (this.config.onProgress) {
        this.config.onProgress(result.processedRows, result.totalRows);
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  private convertRowToSKUData(row: SKUCSVRow): SKUCreateData {
    return {
      code: row.code,
      name: row.name,
      description: row.description || undefined,
      category: row.category || this.config.defaultCategory,
      subCategory: row.sub_category || undefined,
      brand: row.brand || undefined,
      hsn: row.hsn || undefined,
      weight: row.weight || undefined,
      length: row.length || undefined,
      width: row.width || undefined,
      height: row.height || undefined,
      mrp: row.mrp || undefined,
      costPrice: row.cost_price || undefined,
      sellingPrice: row.selling_price || undefined,
      taxRate: row.tax_rate ?? this.config.defaultTaxRate,
      barcodes: row.barcode ? [row.barcode] : undefined,
      reorderLevel: row.reorder_level || undefined,
      reorderQty: row.reorder_qty || undefined,
      companyId: this.config.companyId,
    };
  }
}

// Utility function to validate SKU data before import
export function validateSKUData(rows: SKUCSVRow[]): SKUImportError[] {
  const errors: SKUImportError[] = [];
  const seenCodes = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header

    if (!row.code) {
      errors.push({ row: rowNum, field: 'code', message: 'SKU code is required' });
    } else {
      // Check for duplicates within the file
      if (seenCodes.has(row.code)) {
        errors.push({
          row: rowNum,
          field: 'code',
          skuCode: row.code,
          message: `Duplicate SKU code in file: ${row.code}`,
        });
      }
      seenCodes.add(row.code);
    }

    if (!row.name) {
      errors.push({
        row: rowNum,
        field: 'name',
        skuCode: row.code,
        message: 'SKU name is required',
      });
    }

    if (row.mrp !== undefined && row.mrp < 0) {
      errors.push({
        row: rowNum,
        field: 'mrp',
        skuCode: row.code,
        message: 'MRP cannot be negative',
      });
    }

    if (row.cost_price !== undefined && row.cost_price < 0) {
      errors.push({
        row: rowNum,
        field: 'cost_price',
        skuCode: row.code,
        message: 'Cost price cannot be negative',
      });
    }

    if (row.selling_price !== undefined && row.selling_price < 0) {
      errors.push({
        row: rowNum,
        field: 'selling_price',
        skuCode: row.code,
        message: 'Selling price cannot be negative',
      });
    }

    if (row.tax_rate !== undefined && (row.tax_rate < 0 || row.tax_rate > 100)) {
      errors.push({
        row: rowNum,
        field: 'tax_rate',
        skuCode: row.code,
        message: 'Tax rate must be between 0 and 100',
      });
    }

    if (row.weight !== undefined && row.weight < 0) {
      errors.push({
        row: rowNum,
        field: 'weight',
        skuCode: row.code,
        message: 'Weight cannot be negative',
      });
    }
  });

  return errors;
}

// Generate sample SKU CSV template
export function generateSKUCSVTemplate(): string {
  const headers = [
    'code',
    'name',
    'description',
    'category',
    'sub_category',
    'brand',
    'hsn',
    'weight',
    'length',
    'width',
    'height',
    'mrp',
    'cost_price',
    'selling_price',
    'tax_rate',
    'barcode',
    'reorder_level',
    'reorder_qty',
  ];

  const sampleRow = [
    'SKU-001',
    'Blue T-Shirt Size M',
    'Cotton T-Shirt Blue Color Medium Size',
    'Apparel',
    'T-Shirts',
    'Fashion Brand',
    '62052030',
    '0.2',
    '30',
    '20',
    '2',
    '999',
    '400',
    '799',
    '18',
    '8901234567890',
    '10',
    '50',
  ];

  return headers.join(',') + '\n' + sampleRow.join(',');
}

// Factory function
export function createSKUImporter(
  config: SKUImporterConfig,
  skuCreator: SKUCreator,
  skuUpdater?: SKUUpdater,
  existenceChecker?: SKUExistenceChecker
): SKUImporter {
  return new SKUImporter(config, skuCreator, skuUpdater, existenceChecker);
}
