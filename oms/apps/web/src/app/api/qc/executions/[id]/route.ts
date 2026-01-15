import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@oms/database";
import { auth } from "@/lib/auth";

// GET /api/qc/executions/[id] - Get QC execution details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const execution = await prisma.qCExecution.findUnique({
      where: { id },
      include: {
        QCTemplate: {
          include: {
            QCParameter: {
              orderBy: { sequence: "asc" },
            },
          },
        },
        SKU: true,
        QCResult: {
          include: {
            QCParameter: true,
          },
        },
        QCDefect: true,
      },
    });

    if (!execution) {
      return NextResponse.json({ error: "QC execution not found" }, { status: 404 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error("Error fetching QC execution:", error);
    return NextResponse.json(
      { error: "Failed to fetch QC execution" },
      { status: 500 }
    );
  }
}

// PATCH /api/qc/executions/[id] - Update QC execution (record results)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "MANAGER", "WAREHOUSE_STAFF"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const execution = await prisma.qCExecution.findUnique({
      where: { id },
      include: {
        QCTemplate: {
          include: {
            QCParameter: true,
          },
        },
      },
    });

    if (!execution) {
      return NextResponse.json({ error: "QC execution not found" }, { status: 404 });
    }

    if (["PASSED", "FAILED", "CONDITIONAL"].includes(execution.status)) {
      return NextResponse.json(
        { error: "QC execution already completed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, results, defects, passedQuantity, failedQuantity, remarks } = body;

    // Handle actions
    if (action === "start") {
      if (execution.status !== "PENDING") {
        return NextResponse.json(
          { error: "QC execution can only be started from PENDING status" },
          { status: 400 }
        );
      }

      const updatedExecution = await prisma.qCExecution.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          performedAt: new Date(),
          performedById: session.user.id,
        },
        include: {
          QCTemplate: {
            include: { QCParameter: true },
          },
          SKU: true,
        },
      });

      return NextResponse.json(updatedExecution);
    }

    if (action === "complete") {
      // Calculate overall result
      const allResults = await prisma.qCResult.findMany({
        where: { executionId: id },
      });

      const allPassed = allResults.every((r) => r.isPassed);
      const hasMandatoryFails = allResults.some(
        (r) => !r.isPassed && execution.QCTemplate.QCParameter.find((p) => p.id === r.parameterId)?.isMandatory
      );

      const finalStatus = hasMandatoryFails ? "FAILED" : allPassed ? "PASSED" : "CONDITIONAL";
      const overallGrade = hasMandatoryFails ? "FAIL" : allPassed ? "PASS" : "CONDITIONAL";

      const updatedExecution = await prisma.qCExecution.update({
        where: { id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          overallGrade,
          passedQty: passedQuantity || execution.sampleQty,
          failedQty: failedQuantity || 0,
          remarks,
        },
        include: {
          QCTemplate: true,
          SKU: true,
          QCResult: {
            include: { QCParameter: true },
          },
          QCDefect: true,
        },
      });

      return NextResponse.json(updatedExecution);
    }

    // Record results
    if (results && Array.isArray(results)) {
      await prisma.$transaction(async (tx) => {
        for (const result of results) {
          // Check if result exists for this parameter
          const existingResult = await tx.qCResult.findFirst({
            where: {
              executionId: id,
              parameterId: result.parameterId,
            },
          });

          if (existingResult) {
            await tx.qCResult.update({
              where: { id: existingResult.id },
              data: {
                value: result.value,
                numericValue: result.numericValue,
                isPassed: result.passed,
                remarks: result.remarks,
                photos: result.photos || [],
              },
            });
          } else {
            await tx.qCResult.create({
              data: {
                executionId: id,
                parameterId: result.parameterId,
                value: result.value,
                numericValue: result.numericValue,
                isPassed: result.passed,
                remarks: result.remarks,
                photos: result.photos || [],
              },
            });
          }
        }
      });
    }

    // Record defects
    if (defects && Array.isArray(defects)) {
      await prisma.$transaction(async (tx) => {
        for (const defect of defects) {
          await tx.qCDefect.create({
            data: {
              executionId: id,
              defectCode: defect.defectCode || defect.defectType || "DEF",
              defectName: defect.defectName || defect.defectType || "Defect",
              description: defect.description,
              severity: defect.severity,
              quantity: defect.quantity || 1,
              photos: defect.photos || [],
            },
          });
        }
      });
    }

    // Fetch updated execution
    const updatedExecution = await prisma.qCExecution.findUnique({
      where: { id },
      include: {
        QCTemplate: {
          include: { QCParameter: true },
        },
        SKU: true,
        QCResult: {
          include: { QCParameter: true },
        },
        QCDefect: true,
      },
    });

    return NextResponse.json(updatedExecution);
  } catch (error) {
    console.error("Error updating QC execution:", error);
    return NextResponse.json(
      { error: "Failed to update QC execution" },
      { status: 500 }
    );
  }
}

// DELETE /api/qc/executions/[id] - Delete QC execution
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const execution = await prisma.qCExecution.findUnique({ where: { id } });

    if (!execution) {
      return NextResponse.json({ error: "QC execution not found" }, { status: 404 });
    }

    if (["PASSED", "FAILED", "CONDITIONAL"].includes(execution.status)) {
      return NextResponse.json(
        { error: "Cannot delete completed QC execution" },
        { status: 400 }
      );
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      await tx.qCDefect.deleteMany({ where: { executionId: id } });
      await tx.qCResult.deleteMany({ where: { executionId: id } });
      await tx.qCExecution.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting QC execution:", error);
    return NextResponse.json(
      { error: "Failed to delete QC execution" },
      { status: 500 }
    );
  }
}
