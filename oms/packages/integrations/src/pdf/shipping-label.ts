import PDFDocument from 'pdfkit';

export interface ShippingLabelData {
  // AWB and Order info
  awbNo: string;
  orderNo: string;
  orderDate: Date;

  // Courier info
  courierName: string;
  courierLogo?: string;
  serviceType?: string;

  // Sender info
  sender: {
    name: string;
    companyName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };

  // Receiver info
  receiver: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };

  // Package details
  weight: number;      // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  pieces?: number;

  // Payment
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
  invoiceValue?: number;

  // Additional info
  productDescription?: string;
  invoiceNo?: string;
  routeCode?: string;
  sortCode?: string;
}

export async function generateShippingLabelPDF(data: ShippingLabelData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // 4x6 inch label (standard thermal label size)
      const doc = new PDFDocument({
        size: [288, 432], // 4x6 inches at 72 DPI
        margin: 10,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = 268; // 288 - 20 margin
      const leftMargin = 10;

      // Courier header
      doc
        .rect(leftMargin, 10, pageWidth, 35)
        .fill('#000')
        .fillColor('#fff')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(data.courierName.toUpperCase(), leftMargin + 10, 20);

      if (data.serviceType) {
        doc
          .fontSize(10)
          .text(data.serviceType, leftMargin + 10, 32);
      }

      // AWB Number (large, prominent)
      doc
        .fillColor('#000')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('AWB:', leftMargin, 55)
        .fontSize(18)
        .text(data.awbNo, leftMargin + 40, 52);

      // Barcode placeholder (text representation)
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`*${data.awbNo}*`, leftMargin, 75, { align: 'center' });

      // Horizontal divider
      doc
        .moveTo(leftMargin, 90)
        .lineTo(leftMargin + pageWidth, 90)
        .stroke();

      // Destination pincode (large, prominent)
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(data.receiver.pincode, leftMargin, 95, { align: 'center' });

      if (data.routeCode || data.sortCode) {
        doc
          .fontSize(10)
          .text(`${data.routeCode || ''} ${data.sortCode || ''}`.trim(), { align: 'center' });
      }

      // Horizontal divider
      doc
        .moveTo(leftMargin, 140)
        .lineTo(leftMargin + pageWidth, 140)
        .stroke();

      // Receiver section
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('SHIP TO:', leftMargin, 145);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(data.receiver.name.toUpperCase(), leftMargin, 155, { width: pageWidth });

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(data.receiver.addressLine1, leftMargin, 168, { width: pageWidth })
        .text(data.receiver.addressLine2 || '', { width: pageWidth })
        .text(`${data.receiver.city}, ${data.receiver.state} - ${data.receiver.pincode}`, { width: pageWidth })
        .font('Helvetica-Bold')
        .text(`Ph: ${data.receiver.phone}`, { width: pageWidth });

      // Horizontal divider
      doc
        .moveTo(leftMargin, 230)
        .lineTo(leftMargin + pageWidth, 230)
        .stroke();

      // Sender section
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('FROM:', leftMargin, 235);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(data.sender.companyName || data.sender.name, leftMargin, 245, { width: pageWidth })
        .text(data.sender.addressLine1, { width: pageWidth })
        .text(`${data.sender.city}, ${data.sender.state} - ${data.sender.pincode}`, { width: pageWidth })
        .text(`Ph: ${data.sender.phone}`, { width: pageWidth });

      // Horizontal divider
      doc
        .moveTo(leftMargin, 295)
        .lineTo(leftMargin + pageWidth, 295)
        .stroke();

      // Order details section
      const colWidth = pageWidth / 2;

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('Order No:', leftMargin, 300)
        .font('Helvetica')
        .text(data.orderNo, leftMargin + 55, 300)
        .font('Helvetica-Bold')
        .text('Date:', leftMargin + colWidth, 300)
        .font('Helvetica')
        .text(data.orderDate.toLocaleDateString('en-IN'), leftMargin + colWidth + 35, 300);

      doc
        .font('Helvetica-Bold')
        .text('Weight:', leftMargin, 315)
        .font('Helvetica')
        .text(`${data.weight} kg`, leftMargin + 55, 315)
        .font('Helvetica-Bold')
        .text('Pieces:', leftMargin + colWidth, 315)
        .font('Helvetica')
        .text((data.pieces || 1).toString(), leftMargin + colWidth + 35, 315);

      if (data.dimensions) {
        doc
          .font('Helvetica-Bold')
          .text('Dims:', leftMargin, 330)
          .font('Helvetica')
          .text(`${data.dimensions.length}x${data.dimensions.width}x${data.dimensions.height} cm`, leftMargin + 55, 330);
      }

      // Payment mode (prominent for COD)
      doc
        .moveTo(leftMargin, 350)
        .lineTo(leftMargin + pageWidth, 350)
        .stroke();

      if (data.paymentMode === 'COD') {
        doc
          .rect(leftMargin, 355, pageWidth, 30)
          .fill('#ff0000')
          .fillColor('#fff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('COD', leftMargin + 10, 362)
          .text(`Rs. ${(data.codAmount || 0).toFixed(2)}`, leftMargin + pageWidth - 100, 362);
      } else {
        doc
          .rect(leftMargin, 355, pageWidth, 30)
          .fill('#00aa00')
          .fillColor('#fff')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('PREPAID', leftMargin + 10, 362, { align: 'center' });
      }

      // Invoice info
      doc
        .fillColor('#000')
        .fontSize(8)
        .font('Helvetica')
        .text(`Invoice: ${data.invoiceNo || '-'}  |  Value: Rs. ${(data.invoiceValue || 0).toFixed(2)}`, leftMargin, 390, { align: 'center' });

      // Product description
      if (data.productDescription) {
        doc
          .fontSize(7)
          .text(`Contents: ${data.productDescription.substring(0, 50)}`, leftMargin, 405, { align: 'center' });
      }

      // Footer
      doc
        .fontSize(6)
        .text('If undelivered, please return to sender', leftMargin, 420, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate multiple labels on a single page (2 labels per A4 page)
export async function generateMultipleLabels(labels: ShippingLabelData[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 20,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // A4 can fit 2 labels (4x6 each) side by side or stacked
      // We'll stack them vertically

      labels.forEach((label, index) => {
        if (index > 0 && index % 2 === 0) {
          doc.addPage();
        }

        const yOffset = (index % 2) * 400;
        // Draw label content at yOffset
        drawLabel(doc, label, 20, 20 + yOffset, 255, 380);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawLabel(
  doc: PDFKit.PDFDocument,
  data: ShippingLabelData,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Border
  doc.rect(x, y, width, height).stroke();

  // Courier header
  doc
    .rect(x + 5, y + 5, width - 10, 25)
    .fill('#000')
    .fillColor('#fff')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(data.courierName.toUpperCase(), x + 10, y + 12);

  // AWB
  doc
    .fillColor('#000')
    .fontSize(10)
    .text(`AWB: ${data.awbNo}`, x + 10, y + 35);

  // Destination pincode
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(data.receiver.pincode, x + 10, y + 50, { width: width - 20, align: 'center' });

  // Receiver
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('TO:', x + 10, y + 80)
    .fontSize(9)
    .text(data.receiver.name, x + 10, y + 90, { width: width - 20 })
    .fontSize(8)
    .font('Helvetica')
    .text(data.receiver.addressLine1, { width: width - 20 })
    .text(`${data.receiver.city}, ${data.receiver.state}`, { width: width - 20 })
    .text(`Ph: ${data.receiver.phone}`, { width: width - 20 });

  // Sender
  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('FROM:', x + 10, y + 160)
    .fontSize(8)
    .font('Helvetica')
    .text(data.sender.name, x + 10, y + 170, { width: width - 20 })
    .text(`${data.sender.city} - ${data.sender.pincode}`, { width: width - 20 });

  // Order info
  doc
    .fontSize(7)
    .text(`Order: ${data.orderNo}  |  Wt: ${data.weight}kg`, x + 10, y + 200, { width: width - 20 });

  // Payment mode
  if (data.paymentMode === 'COD') {
    doc
      .rect(x + 5, y + 220, width - 10, 25)
      .fill('#ff0000')
      .fillColor('#fff')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`COD: Rs. ${(data.codAmount || 0).toFixed(2)}`, x + 10, y + 227, { width: width - 20, align: 'center' });
  } else {
    doc
      .rect(x + 5, y + 220, width - 10, 25)
      .fill('#00aa00')
      .fillColor('#fff')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PREPAID', x + 10, y + 227, { width: width - 20, align: 'center' });
  }
}
