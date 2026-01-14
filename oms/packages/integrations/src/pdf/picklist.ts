import PDFDocument from 'pdfkit';

export interface PicklistData {
  // Picklist details
  picklistNo: string;
  status: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Location details
  location: {
    name: string;
    code: string;
    address?: string;
  };

  // Company details
  company: {
    name: string;
    logo?: string;
  };

  // Assigned picker
  assignedTo?: {
    name: string;
    id: string;
  };

  // Order details (if single order picklist)
  order?: {
    orderNo: string;
    customerName: string;
    channel: string;
    priority?: number;
  };

  // Items to pick
  items: {
    slNo?: number;
    zone: string;
    bin: string;
    skuCode: string;
    skuName: string;
    batchNo?: string;
    requiredQty: number;
    pickedQty: number;
    serialNumbers?: string[];
  }[];

  // Summary
  totalItems?: number;
  totalQuantity?: number;
  totalPicked?: number;

  // Notes
  notes?: string;
}

export async function generatePicklistPDF(data: PicklistData): Promise<Buffer> {
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

      // Sort items by zone and bin for efficient picking
      const sortedItems = [...data.items].sort((a, b) => {
        if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
        return a.bin.localeCompare(b.bin);
      });

      // Add serial numbers to items
      sortedItems.forEach((item, index) => {
        item.slNo = index + 1;
      });

      // Header - Company name
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(data.company.name, leftMargin, 40, { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.location.name, { align: 'center' });

      if (data.location.address) {
        doc.fontSize(9).text(data.location.address, { align: 'center' });
      }

      // Title
      doc
        .moveDown(0.5)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('PICK LIST', { align: 'center' });

      doc.moveDown(0.5);

      // Picklist details box
      const detailsY = doc.y;
      doc.rect(leftMargin, detailsY, pageWidth, 60).stroke();

      // Left column
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Pick List No:', leftMargin + 10, detailsY + 8)
        .font('Helvetica')
        .text(data.picklistNo, leftMargin + 80, detailsY + 8);

      doc
        .font('Helvetica-Bold')
        .text('Date:', leftMargin + 10, detailsY + 22)
        .font('Helvetica')
        .text(data.createdAt.toLocaleDateString('en-IN'), leftMargin + 80, detailsY + 22);

      doc
        .font('Helvetica-Bold')
        .text('Status:', leftMargin + 10, detailsY + 36)
        .font('Helvetica')
        .text(data.status, leftMargin + 80, detailsY + 36);

      // Right column
      const rightCol = pageWidth / 2 + leftMargin;

      if (data.order) {
        doc
          .font('Helvetica-Bold')
          .text('Order No:', rightCol + 10, detailsY + 8)
          .font('Helvetica')
          .text(data.order.orderNo, rightCol + 80, detailsY + 8);

        doc
          .font('Helvetica-Bold')
          .text('Channel:', rightCol + 10, detailsY + 22)
          .font('Helvetica')
          .text(data.order.channel, rightCol + 80, detailsY + 22);

        doc
          .font('Helvetica-Bold')
          .text('Customer:', rightCol + 10, detailsY + 36)
          .font('Helvetica')
          .text(data.order.customerName.substring(0, 25), rightCol + 80, detailsY + 36);
      } else {
        doc
          .font('Helvetica-Bold')
          .text('Total Items:', rightCol + 10, detailsY + 8)
          .font('Helvetica')
          .text(sortedItems.length.toString(), rightCol + 80, detailsY + 8);

        doc
          .font('Helvetica-Bold')
          .text('Total Qty:', rightCol + 10, detailsY + 22)
          .font('Helvetica')
          .text(
            sortedItems.reduce((sum, i) => sum + i.requiredQty, 0).toString(),
            rightCol + 80,
            detailsY + 22
          );

        if (data.assignedTo) {
          doc
            .font('Helvetica-Bold')
            .text('Assigned To:', rightCol + 10, detailsY + 36)
            .font('Helvetica')
            .text(data.assignedTo.name, rightCol + 80, detailsY + 36);
        }
      }

      // Items table
      const tableY = detailsY + 75;
      const colWidths = {
        sno: 30,
        zone: 50,
        bin: 70,
        sku: 80,
        name: 150,
        batch: 50,
        qty: 40,
        picked: 45,
        check: 35,
      };

      // Table header
      doc
        .rect(leftMargin, tableY, pageWidth, 18)
        .fill('#f0f0f0')
        .stroke();

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000');

      let xPos = leftMargin + 3;
      const headers = [
        { text: 'S.No', width: colWidths.sno },
        { text: 'Zone', width: colWidths.zone },
        { text: 'Bin', width: colWidths.bin },
        { text: 'SKU', width: colWidths.sku },
        { text: 'Description', width: colWidths.name },
        { text: 'Batch', width: colWidths.batch },
        { text: 'Qty', width: colWidths.qty, align: 'right' as const },
        { text: 'Picked', width: colWidths.picked, align: 'right' as const },
        { text: 'Check', width: colWidths.check, align: 'center' as const },
      ];

      headers.forEach((header) => {
        doc.text(header.text, xPos, tableY + 5, {
          width: header.width - 5,
          align: header.align || 'left',
        });
        xPos += header.width;
      });

      // Table rows
      let rowY = tableY + 18;
      doc.font('Helvetica').fontSize(8);

      sortedItems.forEach((item, index) => {
        // Check for page break
        if (rowY > doc.page.height - 100) {
          doc.addPage();
          rowY = 40;

          // Repeat header on new page
          doc
            .rect(leftMargin, rowY, pageWidth, 18)
            .fill('#f0f0f0')
            .stroke();

          doc.font('Helvetica-Bold').fillColor('#000');
          xPos = leftMargin + 3;
          headers.forEach((header) => {
            doc.text(header.text, xPos, rowY + 5, {
              width: header.width - 5,
              align: header.align || 'left',
            });
            xPos += header.width;
          });

          rowY += 18;
          doc.font('Helvetica');
        }

        const rowHeight = 18;

        // Alternating row background
        if (index % 2 === 1) {
          doc
            .rect(leftMargin, rowY, pageWidth, rowHeight)
            .fill('#fafafa')
            .fillColor('#000');
        }

        xPos = leftMargin + 3;

        // Row data
        doc.text(item.slNo?.toString() || '', xPos, rowY + 5, { width: colWidths.sno - 5 });
        xPos += colWidths.sno;

        doc.text(item.zone || '-', xPos, rowY + 5, { width: colWidths.zone - 5 });
        xPos += colWidths.zone;

        doc.text(item.bin || '-', xPos, rowY + 5, { width: colWidths.bin - 5 });
        xPos += colWidths.bin;

        doc.text(item.skuCode, xPos, rowY + 5, { width: colWidths.sku - 5 });
        xPos += colWidths.sku;

        doc.text(item.skuName.substring(0, 25), xPos, rowY + 5, { width: colWidths.name - 5 });
        xPos += colWidths.name;

        doc.text(item.batchNo || '-', xPos, rowY + 5, { width: colWidths.batch - 5 });
        xPos += colWidths.batch;

        doc.text(item.requiredQty.toString(), xPos, rowY + 5, {
          width: colWidths.qty - 5,
          align: 'right',
        });
        xPos += colWidths.qty;

        doc.text(item.pickedQty.toString(), xPos, rowY + 5, {
          width: colWidths.picked - 5,
          align: 'right',
        });
        xPos += colWidths.picked;

        // Checkbox
        doc.rect(xPos + 8, rowY + 3, 12, 12).stroke();

        rowY += rowHeight;
      });

      // Draw table border
      doc.rect(leftMargin, tableY, pageWidth, rowY - tableY).stroke();

      // Summary section
      rowY += 15;
      const totalQty = sortedItems.reduce((sum, i) => sum + i.requiredQty, 0);
      const totalPicked = sortedItems.reduce((sum, i) => sum + i.pickedQty, 0);

      doc.fontSize(10).font('Helvetica-Bold');

      doc.text(`Total Items: ${sortedItems.length}`, leftMargin, rowY);
      doc.text(`Total Quantity: ${totalQty}`, leftMargin + 150, rowY);
      doc.text(`Picked: ${totalPicked}`, leftMargin + 300, rowY);
      doc.text(`Remaining: ${totalQty - totalPicked}`, leftMargin + 420, rowY);

      // Notes section
      if (data.notes) {
        rowY += 25;
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Notes:', leftMargin, rowY);
        doc
          .font('Helvetica')
          .text(data.notes, leftMargin, rowY + 12, { width: pageWidth });
      }

      // Signature section
      rowY += data.notes ? 50 : 40;

      doc.fontSize(9).font('Helvetica');

      doc.text('Picked By: ____________________', leftMargin, rowY);
      doc.text('Signature: ____________________', leftMargin + 200, rowY);
      doc.text('Date: ____________________', leftMargin + 400, rowY);

      rowY += 25;

      doc.text('Verified By: ____________________', leftMargin, rowY);
      doc.text('Signature: ____________________', leftMargin + 200, rowY);
      doc.text('Date: ____________________', leftMargin + 400, rowY);

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Printed: ${new Date().toLocaleString('en-IN')} | Page ${i + 1} of ${pageCount}`,
            leftMargin,
            doc.page.height - 30,
            { align: 'center', width: pageWidth }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate batch picklist (multiple orders combined)
export async function generateBatchPicklistPDF(
  picklists: PicklistData[],
  batchInfo: {
    batchNo: string;
    createdAt: Date;
    company: { name: string };
    location: { name: string };
  }
): Promise<Buffer> {
  // Combine all items from all picklists
  const allItems: PicklistData['items'] = [];

  picklists.forEach((picklist) => {
    picklist.items.forEach((item) => {
      // Check if item already exists (same zone, bin, sku)
      const existing = allItems.find(
        (i) =>
          i.zone === item.zone &&
          i.bin === item.bin &&
          i.skuCode === item.skuCode &&
          i.batchNo === item.batchNo
      );

      if (existing) {
        existing.requiredQty += item.requiredQty;
        existing.pickedQty += item.pickedQty;
      } else {
        allItems.push({ ...item });
      }
    });
  });

  // Generate combined picklist
  return generatePicklistPDF({
    picklistNo: batchInfo.batchNo,
    status: 'BATCH',
    createdAt: batchInfo.createdAt,
    location: {
      name: batchInfo.location.name,
      code: '',
    },
    company: batchInfo.company,
    items: allItems,
    notes: `Batch pick list combining ${picklists.length} orders`,
  });
}
