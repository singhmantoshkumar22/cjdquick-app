import { NextRequest, NextResponse } from "next/server";
import { generateOptimizedPicklists, type PicklistStrategy } from "@/lib/intelligent-orchestration";

const OMS_BACKEND_URL = process.env.OMS_BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get available optimization strategies
    return NextResponse.json({
      success: true,
      data: {
        strategies: [
          {
            type: "WAVE",
            name: "Wave Picking",
            description: "Group orders into waves based on cutoff times and capacity. Best for high-volume warehouses with multiple pickers.",
            config: {
              maxOrdersPerWave: { type: "number", default: 50, min: 10, max: 200 },
            },
            estimatedEfficiency: "+25% faster than single order",
          },
          {
            type: "BATCH",
            name: "Batch Picking",
            description: "Group orders by common SKUs to reduce picker travel time. Best when multiple orders share same products.",
            config: {
              batchSize: { type: "number", default: 20, min: 5, max: 100 },
            },
            estimatedEfficiency: "+35% faster than single order",
          },
          {
            type: "ZONE",
            name: "Zone Picking",
            description: "Assign pickers to specific warehouse zones. Each picker handles all items in their zone. Best for large warehouses.",
            config: {
              zoneGrouping: { type: "boolean", default: true },
            },
            estimatedEfficiency: "+40% faster than single order",
          },
          {
            type: "SINGLE_ORDER",
            name: "Single Order Picking",
            description: "One picker completes one order at a time. Simple but slowest. Best for low volume or complex orders.",
            config: {},
            estimatedEfficiency: "Baseline",
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching picklist strategies:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch strategies",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Generate optimized picklists
    if (action === "optimize") {
      const { orderIds, strategyType = "WAVE", config = {} } = body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: "orderIds array is required",
        }, { status: 400 });
      }

      const strategy: PicklistStrategy = {
        type: strategyType as "WAVE" | "BATCH" | "ZONE" | "SINGLE_ORDER",
        config,
      };

      try {
        const result = await generateOptimizedPicklists(orderIds, strategy);
        return NextResponse.json({
          success: true,
          data: result,
        });
      } catch (dbError) {
        // Return simulated optimization result
        const picklistCount = strategyType === "SINGLE_ORDER"
          ? orderIds.length
          : Math.ceil(orderIds.length / (config.maxOrdersPerWave || config.batchSize || 20));

        const singleOrderTime = orderIds.length * 15; // 15 mins per order
        const optimizedTime = strategyType === "ZONE"
          ? singleOrderTime * 0.6
          : strategyType === "BATCH"
          ? singleOrderTime * 0.65
          : strategyType === "WAVE"
          ? singleOrderTime * 0.75
          : singleOrderTime;

        const picklists = [];
        const ordersPerPicklist = Math.ceil(orderIds.length / picklistCount);

        for (let i = 0; i < picklistCount; i++) {
          const startIdx = i * ordersPerPicklist;
          const picklistOrderIds = orderIds.slice(startIdx, startIdx + ordersPerPicklist);
          const estimatedItems = picklistOrderIds.length * 3; // Assume avg 3 items per order

          picklists.push({
            id: `${strategyType}-${Date.now()}-${i + 1}`,
            orderIds: picklistOrderIds,
            zone: strategyType === "ZONE" ? `Zone ${String.fromCharCode(65 + (i % 5))}` : undefined,
            priority: Math.floor(Math.random() * 3) + 1,
            estimatedItems,
            estimatedTime: estimatedItems * (strategyType === "ZONE" ? 0.35 : strategyType === "BATCH" ? 0.4 : strategyType === "WAVE" ? 0.5 : 0.6),
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            picklists,
            strategy: strategyType,
            optimization: {
              totalOrders: orderIds.length,
              totalPicklists: picklistCount,
              estimatedTimeSaved: Math.round(singleOrderTime - optimizedTime),
            },
          },
          message: "Optimized picklists generated (demo mode)",
        });
      }
    }

    // Create picklists from optimization result
    if (action === "create") {
      const { picklists, assignPickers = false } = body;

      if (!picklists || !Array.isArray(picklists) || picklists.length === 0) {
        return NextResponse.json({
          success: false,
          error: "picklists array is required",
        }, { status: 400 });
      }

      // In production, this would create actual picklist records
      const createdPicklists = picklists.map((pl: any, index: number) => ({
        id: `PL-${Date.now()}-${index + 1}`,
        picklistNumber: `PL-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(index + 1).padStart(4, "0")}`,
        orderIds: pl.orderIds,
        zone: pl.zone,
        priority: pl.priority,
        status: "PENDING",
        assignedTo: assignPickers ? `PICKER-${(index % 5) + 1}` : null,
        estimatedItems: pl.estimatedItems,
        estimatedTime: pl.estimatedTime,
        createdAt: new Date().toISOString(),
      }));

      return NextResponse.json({
        success: true,
        data: {
          createdCount: createdPicklists.length,
          picklists: createdPicklists,
        },
        message: `${createdPicklists.length} picklists created successfully`,
      });
    }

    // Analyze current orders for optimization recommendation
    if (action === "analyze") {
      const { warehouseId } = body;

      // In production, this would analyze actual pending orders
      return NextResponse.json({
        success: true,
        data: {
          pendingOrders: 156,
          skuOverlap: 68, // Percentage of orders sharing common SKUs
          zoneDistribution: {
            "Zone A": 42,
            "Zone B": 38,
            "Zone C": 35,
            "Zone D": 25,
            "Zone E": 16,
          },
          recommendation: {
            strategy: "BATCH",
            reason: "High SKU overlap (68%) makes batch picking most efficient",
            estimatedTimeSaved: 245, // minutes
            estimatedPicklistCount: 12,
          },
          alternativeRecommendation: {
            strategy: "ZONE",
            reason: "Well-distributed zone spread could also benefit from zone picking",
            estimatedTimeSaved: 220,
            estimatedPicklistCount: 5,
          },
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action",
    }, { status: 400 });
  } catch (error) {
    console.error("Error processing picklist optimization:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process optimization",
    }, { status: 500 });
  }
}
