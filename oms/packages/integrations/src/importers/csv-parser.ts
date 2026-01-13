import { parse } from 'csv-parse';
import { z } from 'zod';

// CSV Row schema for order import
export const OrderCSVRowSchema = z.object({
  order_no: z.string().min(1, 'Order number is required'),
  order_date: z.string().min(1, 'Order date is required'),
  channel: z.enum(['AMAZON', 'FLIPKART', 'MYNTRA', 'AJIO', 'MEESHO', 'SHOPIFY', 'WOOCOMMERCE', 'WEBSITE', 'MANUAL']).optional().default('MANUAL'),
  payment_mode: z.enum(['PREPAID', 'COD']),

  // Customer info
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().min(10, 'Valid phone number is required'),
  customer_email: z.string().email().optional().or(z.literal('')),

  // Shipping address
  shipping_address_line1: z.string().min(1, 'Address is required'),
  shipping_address_line2: z.string().optional(),
  shipping_city: z.string().min(1, 'City is required'),
  shipping_state: z.string().min(1, 'State is required'),
  shipping_pincode: z.string().min(6, 'Pincode is required'),

  // Item details
  sku_code: z.string().min(1, 'SKU code is required'),
  quantity: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1)),
  unit_price: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0)),

  // Optional amounts
  tax_amount: z.string().transform((val) => parseFloat(val || '0')).pipe(z.number()).optional(),
  discount: z.string().transform((val) => parseFloat(val || '0')).pipe(z.number()).optional(),
  shipping_charges: z.string().transform((val) => parseFloat(val || '0')).pipe(z.number()).optional(),
  cod_charges: z.string().transform((val) => parseFloat(val || '0')).pipe(z.number()).optional(),

  // Optional fields
  external_order_no: z.string().optional(),
  remarks: z.string().optional(),
  priority: z.string().transform((val) => parseInt(val || '0', 10)).pipe(z.number()).optional(),
});

export type OrderCSVRow = z.infer<typeof OrderCSVRowSchema>;

export interface CSVParseResult<T> {
  success: boolean;
  data?: T[];
  errors?: {
    row: number;
    field?: string;
    message: string;
    rawData?: Record<string, string>;
  }[];
  totalRows?: number;
  validRows?: number;
  errorRows?: number;
}

export interface CSVParserOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimFields?: boolean;
  headers?: boolean;
}

export async function parseCSV<TOutput, TInput = TOutput>(
  content: string,
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>,
  options: CSVParserOptions = {}
): Promise<CSVParseResult<TOutput>> {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    trimFields = true,
    headers = true,
  } = options;

  return new Promise((resolve) => {
    const data: TOutput[] = [];
    const errors: CSVParseResult<TOutput>['errors'] = [];
    let rowIndex = 0;

    const parser = parse({
      delimiter,
      skip_empty_lines: skipEmptyLines,
      trim: trimFields,
      columns: headers,
      relax_column_count: true,
    });

    parser.on('data', (row: Record<string, string>) => {
      rowIndex++;

      // Skip empty rows
      if (Object.values(row).every((v) => !v || v.trim() === '')) {
        return;
      }

      try {
        const parsed = schema.parse(row);
        data.push(parsed);
      } catch (error) {
        if (error instanceof z.ZodError) {
          for (const issue of error.issues) {
            errors.push({
              row: rowIndex,
              field: issue.path.join('.'),
              message: issue.message,
              rawData: row,
            });
          }
        } else {
          errors.push({
            row: rowIndex,
            message: error instanceof Error ? error.message : 'Unknown error',
            rawData: row,
          });
        }
      }
    });

    parser.on('error', (error) => {
      resolve({
        success: false,
        errors: [{
          row: rowIndex,
          message: `CSV parsing error: ${error.message}`,
        }],
      });
    });

    parser.on('end', () => {
      resolve({
        success: errors.length === 0,
        data,
        errors: errors.length > 0 ? errors : undefined,
        totalRows: rowIndex,
        validRows: data.length,
        errorRows: errors.length,
      });
    });

    parser.write(content);
    parser.end();
  });
}

// Convenience function for parsing order CSV
export async function parseOrderCSV(content: string): Promise<CSVParseResult<OrderCSVRow>> {
  return parseCSV(content, OrderCSVRowSchema);
}

// Generate sample CSV template
export function generateOrderCSVTemplate(): string {
  const headers = [
    'order_no',
    'order_date',
    'channel',
    'payment_mode',
    'customer_name',
    'customer_phone',
    'customer_email',
    'shipping_address_line1',
    'shipping_address_line2',
    'shipping_city',
    'shipping_state',
    'shipping_pincode',
    'sku_code',
    'quantity',
    'unit_price',
    'tax_amount',
    'discount',
    'shipping_charges',
    'cod_charges',
    'external_order_no',
    'remarks',
    'priority',
  ];

  const sampleRow = [
    'ORD-001',
    '2024-01-15',
    'MANUAL',
    'COD',
    'John Doe',
    '9876543210',
    'john@example.com',
    '123 Main Street',
    'Apt 4B',
    'Mumbai',
    'Maharashtra',
    '400001',
    'SKU-001',
    '2',
    '500.00',
    '90.00',
    '50.00',
    '40.00',
    '25.00',
    'EXT-ORD-001',
    'Handle with care',
    '1',
  ];

  return headers.join(',') + '\n' + sampleRow.join(',');
}

// Helper for optional number parsing
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : parseFloat(String(val))),
  z.number().optional()
);

const optionalInt = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : parseInt(String(val), 10)),
  z.number().int().optional()
);

// SKU CSV schema for bulk import
export const SKUCSVRowSchema = z.object({
  code: z.string().min(1, 'SKU code is required'),
  name: z.string().min(1, 'SKU name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  sub_category: z.string().optional(),
  brand: z.string().optional(),
  hsn: z.string().optional(),
  weight: optionalNumber,
  length: optionalNumber,
  width: optionalNumber,
  height: optionalNumber,
  mrp: optionalNumber,
  cost_price: optionalNumber,
  selling_price: optionalNumber,
  tax_rate: optionalNumber,
  barcode: z.string().optional(),
  reorder_level: optionalInt,
  reorder_qty: optionalInt,
});

export type SKUCSVRow = z.infer<typeof SKUCSVRowSchema>;

export async function parseSKUCSV(content: string): Promise<CSVParseResult<SKUCSVRow>> {
  return parseCSV(content, SKUCSVRowSchema);
}
