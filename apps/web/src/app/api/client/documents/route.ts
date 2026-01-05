import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";
import { getClientFromRequest } from "@/lib/client-auth";

export async function GET(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const documentType = searchParams.get("type");
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const awbNumber = searchParams.get("awbNumber");

    const where: any = {
      clientId: clientContext.id,
    };

    if (documentType) {
      where.documentType = documentType;
    }

    if (status) {
      where.status = status;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (awbNumber) {
      where.awbNumber = awbNumber;
    }

    const [documents, total] = await Promise.all([
      prisma.clientDocument.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clientDocument.count({ where }),
    ]);

    // Get document type counts
    const typeCounts = await prisma.clientDocument.groupBy({
      by: ["documentType"],
      where: { clientId: clientContext.id },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: documents.map((d) => ({
          id: d.id,
          orderId: d.orderId,
          awbNumber: d.awbNumber,
          documentType: d.documentType,
          documentName: d.documentName,
          fileUrl: d.fileUrl,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          status: d.status,
          rejectionReason: d.rejectionReason,
          uploadedBy: d.uploadedBy,
          verifiedBy: d.verifiedBy,
          verifiedAt: d.verifiedAt?.toISOString(),
          createdAt: d.createdAt.toISOString(),
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        typeCounts: typeCounts.reduce(
          (acc, item) => {
            acc[item.documentType] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    console.error("Client documents error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientContext = await getClientFromRequest(request);
    if (!clientContext) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      awbNumber,
      documentType,
      documentName,
      fileUrl,
      fileSize,
      mimeType,
    } = body;

    // Validate required fields
    if (!documentType || !documentName || !fileUrl) {
      return NextResponse.json(
        { success: false, error: "Document type, name, and file URL are required" },
        { status: 400 }
      );
    }

    // Validate document type
    const validTypes = ["INVOICE", "EWAY_BILL", "PACKING_LIST", "CUSTOMS", "POD", "OTHER"];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid document type" },
        { status: 400 }
      );
    }

    const document = await prisma.clientDocument.create({
      data: {
        clientId: clientContext.id,
        orderId,
        awbNumber,
        documentType,
        documentName,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || "application/octet-stream",
        status: "UPLOADED",
        uploadedBy: clientContext.clientUserId,
      },
    });

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
