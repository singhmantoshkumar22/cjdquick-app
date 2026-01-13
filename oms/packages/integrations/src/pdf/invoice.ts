import PDFDocument from 'pdfkit';

export interface InvoiceData {
  // Company details
  company: {
    name: string;
    legalName?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
    email?: string;
    gst?: string;
    pan?: string;
    logo?: string;
  };

  // Invoice details
  invoiceNo: string;
  invoiceDate: Date;
  orderNo: string;
  orderDate: Date;

  // Customer details
  customer: {
    name: string;
    phone: string;
    email?: string;
  };

  // Shipping address
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  // Billing address
  billingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  // Items
  items: {
    slNo: number;
    skuCode: string;
    name: string;
    hsn?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    taxAmount: number;
    discount: number;
    totalPrice: number;
  }[];

  // Totals
  subtotal: number;
  totalTax: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  shippingCharges: number;
  discount: number;
  codCharges?: number;
  totalAmount: number;

  // Payment
  paymentMode: 'PREPAID' | 'COD';
  awbNo?: string;
  transporterName?: string;

  // Footer
  terms?: string[];
  signatureLabel?: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 80;
      const leftMargin = 40;

      // Header - Company info
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(data.company.name, leftMargin, 40, { align: 'center' });

      if (data.company.legalName && data.company.legalName !== data.company.name) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(data.company.legalName, { align: 'center' });
      }

      doc
        .fontSize(9)
        .text(`${data.company.address}, ${data.company.city}, ${data.company.state} - ${data.company.pincode}`, { align: 'center' });

      if (data.company.phone || data.company.email) {
        doc.text(`Phone: ${data.company.phone || '-'} | Email: ${data.company.email || '-'}`, { align: 'center' });
      }

      if (data.company.gst) {
        doc.text(`GSTIN: ${data.company.gst}`, { align: 'center' });
      }

      // Title
      doc
        .moveDown(0.5)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', { align: 'center' });

      // Invoice details box
      const startY = doc.y + 10;
      doc
        .rect(leftMargin, startY, pageWidth, 50)
        .stroke();

      // Left column - Invoice details
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Invoice No:', leftMargin + 10, startY + 10)
        .font('Helvetica')
        .text(data.invoiceNo, leftMargin + 80, startY + 10)
        .font('Helvetica-Bold')
        .text('Invoice Date:', leftMargin + 10, startY + 25)
        .font('Helvetica')
        .text(data.invoiceDate.toLocaleDateString('en-IN'), leftMargin + 80, startY + 25);

      // Right column - Order details
      const rightCol = pageWidth / 2 + leftMargin;
      doc
        .font('Helvetica-Bold')
        .text('Order No:', rightCol + 10, startY + 10)
        .font('Helvetica')
        .text(data.orderNo, rightCol + 80, startY + 10)
        .font('Helvetica-Bold')
        .text('Order Date:', rightCol + 10, startY + 25)
        .font('Helvetica')
        .text(data.orderDate.toLocaleDateString('en-IN'), rightCol + 80, startY + 25);

      // Address section
      const addressY = startY + 60;
      const addressWidth = (pageWidth - 20) / 2;

      // Billing Address
      doc
        .rect(leftMargin, addressY, addressWidth, 80)
        .stroke();

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Bill To:', leftMargin + 5, addressY + 5);

      const billing = data.billingAddress || data.shippingAddress;
      doc
        .font('Helvetica')
        .text(billing.name, leftMargin + 5, addressY + 18, { width: addressWidth - 10 })
        .text(billing.addressLine1, { width: addressWidth - 10 })
        .text(billing.addressLine2 || '', { width: addressWidth - 10 })
        .text(`${billing.city}, ${billing.state} - ${billing.pincode}`, { width: addressWidth - 10 });

      // Shipping Address
      doc
        .rect(leftMargin + addressWidth + 10, addressY, addressWidth, 80)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .text('Ship To:', leftMargin + addressWidth + 15, addressY + 5);

      doc
        .font('Helvetica')
        .text(data.shippingAddress.name, leftMargin + addressWidth + 15, addressY + 18, { width: addressWidth - 10 })
        .text(data.shippingAddress.addressLine1, { width: addressWidth - 10 })
        .text(data.shippingAddress.addressLine2 || '', { width: addressWidth - 10 })
        .text(`${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}`, { width: addressWidth - 10 });

      // Items table
      const tableY = addressY + 90;
      const colWidths = [30, 80, 150, 50, 50, 60, 50, 60, 60];
      const headers = ['S.No', 'SKU', 'Description', 'HSN', 'Qty', 'Rate', 'Tax%', 'Tax Amt', 'Total'];

      // Table header
      doc
        .rect(leftMargin, tableY, pageWidth, 20)
        .fill('#f0f0f0')
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#000');

      let xPos = leftMargin + 5;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableY + 6, { width: colWidths[i] - 5, align: 'left' });
        xPos += colWidths[i];
      });

      // Table rows
      let rowY = tableY + 20;
      data.items.forEach((item, index) => {
        const rowHeight = 20;

        if (index % 2 === 1) {
          doc
            .rect(leftMargin, rowY, pageWidth, rowHeight)
            .fill('#fafafa')
            .fillColor('#000');
        }

        doc.font('Helvetica').fontSize(8);

        xPos = leftMargin + 5;
        const values = [
          item.slNo.toString(),
          item.skuCode,
          item.name.substring(0, 25),
          item.hsn || '-',
          item.quantity.toString(),
          item.unitPrice.toFixed(2),
          item.taxRate ? `${item.taxRate}%` : '-',
          item.taxAmount.toFixed(2),
          item.totalPrice.toFixed(2),
        ];

        values.forEach((val, i) => {
          doc.text(val, xPos, rowY + 6, { width: colWidths[i] - 5, align: 'left' });
          xPos += colWidths[i];
        });

        rowY += rowHeight;
      });

      // Table border
      doc.rect(leftMargin, tableY, pageWidth, rowY - tableY).stroke();

      // Totals section
      const totalsY = rowY + 10;
      const totalsWidth = 200;
      const totalsX = leftMargin + pageWidth - totalsWidth;

      doc.fontSize(9);

      const totalsData = [
        ['Subtotal:', data.subtotal.toFixed(2)],
      ];

      if (data.cgst && data.sgst) {
        totalsData.push(['CGST:', data.cgst.toFixed(2)]);
        totalsData.push(['SGST:', data.sgst.toFixed(2)]);
      } else if (data.igst) {
        totalsData.push(['IGST:', data.igst.toFixed(2)]);
      } else if (data.totalTax > 0) {
        totalsData.push(['Tax:', data.totalTax.toFixed(2)]);
      }

      if (data.shippingCharges > 0) {
        totalsData.push(['Shipping:', data.shippingCharges.toFixed(2)]);
      }

      if (data.discount > 0) {
        totalsData.push(['Discount:', `-${data.discount.toFixed(2)}`]);
      }

      if (data.codCharges && data.codCharges > 0) {
        totalsData.push(['COD Charges:', data.codCharges.toFixed(2)]);
      }

      totalsData.push(['Total:', data.totalAmount.toFixed(2)]);

      let tY = totalsY;
      totalsData.forEach((row, i) => {
        const isLast = i === totalsData.length - 1;
        doc
          .font(isLast ? 'Helvetica-Bold' : 'Helvetica')
          .text(row[0], totalsX, tY)
          .text(row[1], totalsX + 100, tY, { align: 'right', width: 80 });
        tY += 15;
      });

      // Payment info
      const paymentY = tY + 10;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Payment Mode: ${data.paymentMode}`, leftMargin, paymentY);

      if (data.awbNo) {
        doc.text(`AWB No: ${data.awbNo}`, leftMargin, paymentY + 15);
      }

      if (data.transporterName) {
        doc.text(`Transporter: ${data.transporterName}`, leftMargin + 200, paymentY + 15);
      }

      // Terms
      if (data.terms && data.terms.length > 0) {
        const termsY = paymentY + 40;
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('Terms & Conditions:', leftMargin, termsY);

        doc.font('Helvetica');
        data.terms.forEach((term, i) => {
          doc.text(`${i + 1}. ${term}`, leftMargin, termsY + 12 + i * 10);
        });
      }

      // Signature
      const signY = doc.page.height - 100;
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('For ' + data.company.name, totalsX, signY, { align: 'right', width: totalsWidth })
        .moveDown(2)
        .text(data.signatureLabel || 'Authorized Signatory', totalsX, signY + 40, { align: 'right', width: totalsWidth });

      // Footer
      doc
        .fontSize(8)
        .text('This is a computer generated invoice', leftMargin, doc.page.height - 40, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
