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
        template: {
          include: {
            parameters: {
              orderBy: { sequence: "asc" },
            },
          },
        },
        location: true,
        sku: true,
        executedByUser: {
          select: { id: true, name: true, email: true },
        },
        results: {
          include: {
            parameter: true,
          },
          orderBy: { createdAt: "asc" },
        },
        defects: {
          orderBy: { createdAt: "asc" },
        },
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
        template: {
          include: {
            parameters: true,
          },
        },
      },
    });

    if (!execution) {
      return NextResponse.json({ error: "QC execution not found" }, { status: 404 });
    }

    if (execution.status === "COMPLETED") {
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
          startedAt: new Date(),
          executedBy: session.user.id,
        },
        include: {
          template: {
            include: { parameters: true },
          },
          location: true,
          sku: true,
        },
      });

      return NextResponse.json(updatedExecution);
    }

    if (action === "complete") {
      // Calculate overall result
      const allResults = await prisma.qCResult.findMany({
        where: { executionId: id },
      });

      const allPassed = allResults.every((r) => r.passed);
      const hasMandatoryFails = allResults.some(
        (r) => !r.passed && execution.template.parameters.find((p) => p.id === r.parameterId)?.isMandatory
      );

      const overallResult = hasMandatoryFails ? "FAIL" : allPassed ? "PASS" : "CONDITIONAL";

      const updatedExecution = await prisma.qCExecution.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          overallResult,
          passedQuantity: passedQuantity || execution.inspectionQuantity,
          failedQuantity: failedQuantity || 0,
          remarks,
        },
        include: {
          template: true,
          location: true,
          sku: true,
          results: {
            include: { parameter: true },
          },
          defects: true,
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
                passed: result.passed,
                remarks: result.remarks,
                photoUrl: result.photoUrl,
              },
            });
          } else {
            await tx.qCResult.create({
              data: {
                executionId: id,
                parameterId: result.parameterId,
                value: result.value,
                numericValue: result.numericValue,
                passed: result.passed,
                remarks: result.remarks,
                photoUrl: result.photoUrl,
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
              defectType: defect.defectType,
              description: defect.description,
              severity: defect.severity,
              quantity: defect.quantity || 1,
              photoUrls: defect.photoUrls || [],
            },
          });
        }
      });
    }

    // Fetch updated execution
    const updatedExecution = await prisma.qCExecution.findUnique({
      where: { id },
      include: {
        template: {
          include: { parameters: true },
        },
        location: true,
        sku: true,
        results: {
          include: { parameter: true },
        },
        defects: true,
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

    if (execution.status === "COMPLETED") {
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
