import { parseOrderCSV, OrderCSVRow, CSVParseResult } from './csv-parser';

export interface OrderImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  createdOrders: string[];
  skippedOrders: string[];
}

export interface ImportError {
  row: number;
  orderNo?: string;
  field?: string;
  message: string;
  rawData?: Record<string, string>;
}

export type ChannelType = 'AMAZON' | 'FLIPKART' | 'MYNTRA' | 'AJIO' | 'MEESHO' | 'SHOPIFY' | 'WOOCOMMERCE' | 'WEBSITE' | 'MANUAL';

export interface OrderCreateData {
  orderNo: string;
  externalOrderNo?: string;
  channel: ChannelType;
  orderType: 'B2C' | 'B2B';
  paymentMode: 'PREPAID' | 'COD';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  billingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: {
    skuCode: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    discount: number;
  }[];
  subtotal: number;
  taxAmount: number;
  shippingCharges: number;
  codCharges: number;
  discount: number;
  totalAmount: number;
  orderDate: Date;
  remarks?: string;
  priority?: number;
  locationId: string;
  importId: string;
  csvLineNumber: number;
}

export interface OrderImporterConfig {
  locationId: string;
  importId: string;
  defaultChannel?: string;
  validateSKUs?: boolean;
  skipDuplicates?: boolean;
  onProgress?: (processed: number, total: number) => void;
}

export interface SKUValidationResult {
  valid: boolean;
  skuMap: Map<string, { id: string; name: string }>;
  invalidSKUs: string[];
}

export type SKUValidator = (skuCodes: string[]) => Promise<SKUValidationResult>;
export type OrderCreator = (order: OrderCreateData) => Promise<{ success: boolean; orderId?: string; error?: string }>;
export type DuplicateChecker = (orderNos: string[]) => Promise<Set<string>>;

export class OrderImporter {
  private config: OrderImporterConfig;
  private skuValidator?: SKUValidator;
  private orderCreator: OrderCreator;
  private duplicateChecker?: DuplicateChecker;

  constructor(
    config: OrderImporterConfig,
    orderCreator: OrderCreator,
    skuValidator?: SKUValidator,
    duplicateChecker?: DuplicateChecker
  ) {
    this.config = config;
    this.orderCreator = orderCreator;
    this.skuValidator = skuValidator;
    this.duplicateChecker = duplicateChecker;
  }

  async importFromCSV(csvContent: string): Promise<OrderImportResult> {
    const result: OrderImportResult = {
      success: false,
      totalRows: 0,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      createdOrders: [],
      skippedOrders: [],
    };

    // Parse CSV
    const parseResult: CSVParseResult<OrderCSVRow> = await parseOrderCSV(csvContent);

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

    // Group rows by order number (multi-line items)
    const orderGroups = this.groupRowsByOrder(parseResult.data);

    // Check for duplicates if enabled
    let existingOrderNos = new Set<string>();
    if (this.config.skipDuplicates && this.duplicateChecker) {
      const orderNos = Array.from(orderGroups.keys());
      existingOrderNos = await this.duplicateChecker(orderNos);
    }

    // Validate SKUs if enabled
    let skuValidation: SKUValidationResult | undefined;
    if (this.config.validateSKUs && this.skuValidator) {
      const allSKUs = new Set<string>();
      parseResult.data.forEach((row) => allSKUs.add(row.sku_code));
      skuValidation = await this.skuValidator(Array.from(allSKUs));

      if (skuValidation.invalidSKUs.length > 0) {
        // Add errors for invalid SKUs
        parseResult.data.forEach((row, index) => {
          if (skuValidation!.invalidSKUs.includes(row.sku_code)) {
            result.errors.push({
              row: index + 2, // +2 for header row and 0-index
              orderNo: row.order_no,
              field: 'sku_code',
              message: `SKU not found: ${row.sku_code}`,
            });
          }
        });
      }
    }

    // Process each order group
    let processed = 0;
    for (const [orderNo, rows] of orderGroups) {
      processed++;

      // Skip duplicates
      if (existingOrderNos.has(orderNo)) {
        result.skippedOrders.push(orderNo);
        result.processedRows += rows.length;
        continue;
      }

      // Skip orders with invalid SKUs
      if (skuValidation && rows.some((r) => skuValidation!.invalidSKUs.includes(r.sku_code))) {
        result.errorCount++;
        result.processedRows += rows.length;
        continue;
      }

      try {
        const orderData = this.convertRowsToOrder(rows, skuValidation?.skuMap);
        const createResult = await this.orderCreator(orderData);

        if (createResult.success && createResult.orderId) {
          result.successCount++;
          result.createdOrders.push(createResult.orderId);
        } else {
          result.errorCount++;
          result.errors.push({
            row: rows[0].lineNumber || 0,
            orderNo,
            message: createResult.error || 'Failed to create order',
          });
        }
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rows[0].lineNumber || 0,
          orderNo,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      result.processedRows += rows.length;

      // Report progress
      if (this.config.onProgress) {
        this.config.onProgress(processed, orderGroups.size);
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  private groupRowsByOrder(rows: OrderCSVRow[]): Map<string, (OrderCSVRow & { lineNumber: number })[]> {
    const groups = new Map<string, (OrderCSVRow & { lineNumber: number })[]>();

    rows.forEach((row, index) => {
      const orderNo = row.order_no;
      if (!groups.has(orderNo)) {
        groups.set(orderNo, []);
      }
      groups.get(orderNo)!.push({ ...row, lineNumber: index + 2 }); // +2 for header row
    });

    return groups;
  }

  private convertRowsToOrder(
    rows: (OrderCSVRow & { lineNumber: number })[],
    skuMap?: Map<string, { id: string; name: string }>
  ): OrderCreateData {
    const firstRow = rows[0];

    // Calculate totals from items
    const items = rows.map((row) => ({
      skuCode: row.sku_code,
      skuId: skuMap?.get(row.sku_code)?.id,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      taxAmount: row.tax_amount || 0,
      discount: row.discount || 0,
    }));

    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const taxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0);
    const discount = items.reduce((sum, i) => sum + i.discount, 0);
    const shippingCharges = firstRow.shipping_charges || 0;
    const codCharges = firstRow.cod_charges || 0;
    const totalAmount = subtotal + taxAmount + shippingCharges + codCharges - discount;

    return {
      orderNo: firstRow.order_no,
      externalOrderNo: firstRow.external_order_no,
      channel: (firstRow.channel || this.config.defaultChannel || 'MANUAL') as ChannelType,
      orderType: 'B2C',
      paymentMode: (firstRow.payment_mode || 'PREPAID') as 'PREPAID' | 'COD',
      customerName: firstRow.customer_name,
      customerPhone: firstRow.customer_phone,
      customerEmail: firstRow.customer_email || undefined,
      shippingAddress: {
        name: firstRow.customer_name,
        addressLine1: firstRow.shipping_address_line1,
        addressLine2: firstRow.shipping_address_line2 || undefined,
        city: firstRow.shipping_city,
        state: firstRow.shipping_state,
        pincode: firstRow.shipping_pincode,
        phone: firstRow.customer_phone,
      },
      items,
      subtotal,
      taxAmount,
      shippingCharges,
      codCharges,
      discount,
      totalAmount,
      orderDate: firstRow.order_date ? new Date(firstRow.order_date) : new Date(),
      remarks: firstRow.remarks,
      priority: firstRow.priority,
      locationId: this.config.locationId,
      importId: this.config.importId,
      csvLineNumber: firstRow.lineNumber,
    };
  }
}

// Utility function to validate order data before import
export function validateOrderData(rows: OrderCSVRow[]): ImportError[] {
  const errors: ImportError[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header

    if (!row.order_no) {
      errors.push({ row: rowNum, field: 'order_no', message: 'Order number is required' });
    }

    if (!row.customer_name) {
      errors.push({ row: rowNum, field: 'customer_name', message: 'Customer name is required' });
    }

    if (!row.customer_phone || row.customer_phone.length < 10) {
      errors.push({ row: rowNum, field: 'customer_phone', message: 'Valid phone number is required' });
    }

    if (!row.sku_code) {
      errors.push({ row: rowNum, field: 'sku_code', message: 'SKU code is required' });
    }

    if (row.quantity < 1) {
      errors.push({ row: rowNum, field: 'quantity', message: 'Quantity must be at least 1' });
    }

    if (row.unit_price < 0) {
      errors.push({ row: rowNum, field: 'unit_price', message: 'Unit price cannot be negative' });
    }

    if (!row.shipping_pincode || row.shipping_pincode.length < 6) {
      errors.push({ row: rowNum, field: 'shipping_pincode', message: 'Valid pincode is required' });
    }
  });

  return errors;
}

// Factory function
export function createOrderImporter(
  config: OrderImporterConfig,
  orderCreator: OrderCreator,
  skuValidator?: SKUValidator,
  duplicateChecker?: DuplicateChecker
): OrderImporter {
  return new OrderImporter(config, orderCreator, skuValidator, duplicateChecker);
}
