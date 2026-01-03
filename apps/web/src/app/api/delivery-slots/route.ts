import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@cjdquick/database";

// GET - Get available delivery slots for a shipment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const awbNumber = searchParams.get("awb");
    const pincode = searchParams.get("pincode");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!awbNumber && !pincode) {
      return NextResponse.json(
        { success: false, error: "AWB or pincode required" },
        { status: 400 }
      );
    }

    // Get delivery hub based on shipment or pincode
    let hubId: string | null = null;

    if (awbNumber) {
      const shipment = await prisma.shipment.findUnique({
        where: { awbNumber },
        select: { id: true, consigneePincode: true, currentHubId: true },
      });

      if (!shipment) {
        return NextResponse.json(
          { success: false, error: "Shipment not found" },
          { status: 404 }
        );
      }

      // Find delivery hub serving this pincode
      if (shipment.consigneePincode) {
        const hubServing = await prisma.hubPincodeMapping.findFirst({
          where: { pincode: shipment.consigneePincode },
          select: { hubId: true },
        });
        hubId = hubServing?.hubId || shipment.currentHubId;
      }
    } else if (pincode) {
      const hubServing = await prisma.hubPincodeMapping.findFirst({
        where: { pincode },
        select: { hubId: true },
      });
      hubId = hubServing?.hubId || null;
    }

    if (!hubId) {
      // Return default slots if no hub found
      return NextResponse.json({
        success: true,
        data: {
          slots: getDefaultSlots(date),
          hubId: null,
        },
      });
    }

    // Get slot configs for this hub
    const slotConfigs = await prisma.deliverySlotConfig.findMany({
      where: {
        hubId,
        isActive: true,
      },
      orderBy: { startTime: "asc" },
    });

    // If no configs, return default slots
    if (slotConfigs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          slots: getDefaultSlots(date),
          hubId,
        },
      });
    }

    // Get dates for next 5 days
    const targetDate = date ? new Date(date) : new Date();
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    // Build available slots for each date
    const slotsByDate = await Promise.all(
      dates.map(async (d) => {
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
        const dateStr = d.toISOString().split("T")[0];

        const availableSlots = await Promise.all(
          slotConfigs
            .filter((config) => {
              const availableDays = JSON.parse(config.availableDays || "[]");
              return availableDays.includes(dayName);
            })
            .map(async (config) => {
              // Check capacity
              const bookedCount = await prisma.deliverySlotBooking.count({
                where: {
                  slotConfigId: config.id,
                  slotDate: d,
                  status: { in: ["BOOKED", "CONFIRMED"] },
                },
              });

              const remainingCapacity = config.maxOrders - bookedCount;
              const isAvailable = remainingCapacity > 0;

              // Check cutoff
              const now = new Date();
              const slotDateTime = new Date(d);
              const [hours, minutes] = config.startTime.split(":").map(Number);
              slotDateTime.setHours(hours, minutes, 0, 0);
              const cutoffTime = new Date(slotDateTime.getTime() - config.cutoffHours * 60 * 60 * 1000);
              const isPastCutoff = now > cutoffTime;

              return {
                id: config.id,
                name: config.name,
                startTime: config.startTime,
                endTime: config.endTime,
                displayTime: `${formatTime(config.startTime)} - ${formatTime(config.endTime)}`,
                isPremium: config.isPremium,
                premiumCharge: config.premiumCharge,
                isAvailable: isAvailable && !isPastCutoff,
                remainingCapacity,
                isPastCutoff,
              };
            })
        );

        return {
          date: dateStr,
          dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
          dayNumber: d.getDate(),
          month: d.toLocaleDateString("en-IN", { month: "short" }),
          slots: availableSlots,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        slots: slotsByDate,
        hubId,
      },
    });
  } catch (error) {
    console.error("Get Slots Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}

// POST - Book a delivery slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      awbNumber,
      slotConfigId,
      slotDate,
      slotStartTime,
      slotEndTime,
      slotName,
      preferredTime,
      customerPhone,
      customerEmail,
      specialInstructions,
    } = body;

    // Validate
    if (!awbNumber || !slotDate) {
      return NextResponse.json(
        { success: false, error: "AWB and slot date required" },
        { status: 400 }
      );
    }

    // Find shipment
    const shipment = await prisma.shipment.findUnique({
      where: { awbNumber },
      select: {
        id: true,
        awbNumber: true,
        status: true,
        consigneePhone: true,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Check if already booked
    const existingBooking = await prisma.deliverySlotBooking.findUnique({
      where: { shipmentId: shipment.id },
    });

    if (existingBooking) {
      // Update existing booking
      const updated = await prisma.deliverySlotBooking.update({
        where: { id: existingBooking.id },
        data: {
          slotConfigId,
          slotDate: new Date(slotDate),
          slotStartTime: slotStartTime || "09:00",
          slotEndTime: slotEndTime || "12:00",
          slotName,
          preferredTime,
          customerPhone: customerPhone || shipment.consigneePhone,
          customerEmail: customerEmail || null,
          specialInstructions,
          status: "RESCHEDULED",
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Delivery slot updated successfully",
      });
    }

    // Get premium charge if applicable
    let premiumCharge = 0;
    if (slotConfigId) {
      const config = await prisma.deliverySlotConfig.findUnique({
        where: { id: slotConfigId },
      });
      premiumCharge = config?.premiumCharge || 0;
    }

    // Create new booking
    const booking = await prisma.deliverySlotBooking.create({
      data: {
        shipmentId: shipment.id,
        awbNumber: shipment.awbNumber,
        slotConfigId,
        slotDate: new Date(slotDate),
        slotStartTime: slotStartTime || "09:00",
        slotEndTime: slotEndTime || "12:00",
        slotName,
        preferredTime,
        customerPhone: customerPhone || shipment.consigneePhone,
        customerEmail: customerEmail || null,
        specialInstructions,
        premiumCharge,
        status: "BOOKED",
      },
    });

    return NextResponse.json({
      success: true,
      data: booking,
      message: "Delivery slot booked successfully",
    });
  } catch (error) {
    console.error("Book Slot Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to book slot" },
      { status: 500 }
    );
  }
}

// Helper: Format time for display
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Helper: Get default slots when no config exists
function getDefaultSlots(date?: string | null) {
  const targetDate = date ? new Date(date) : new Date();
  const dates = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + i);

    const defaultSlots = [
      {
        id: "morning",
        name: "Morning",
        startTime: "09:00",
        endTime: "12:00",
        displayTime: "9:00 AM - 12:00 PM",
        isPremium: false,
        premiumCharge: 0,
        isAvailable: true,
        remainingCapacity: 50,
        isPastCutoff: false,
      },
      {
        id: "afternoon",
        name: "Afternoon",
        startTime: "12:00",
        endTime: "16:00",
        displayTime: "12:00 PM - 4:00 PM",
        isPremium: false,
        premiumCharge: 0,
        isAvailable: true,
        remainingCapacity: 50,
        isPastCutoff: false,
      },
      {
        id: "evening",
        name: "Evening",
        startTime: "16:00",
        endTime: "20:00",
        displayTime: "4:00 PM - 8:00 PM",
        isPremium: true,
        premiumCharge: 20,
        isAvailable: true,
        remainingCapacity: 30,
        isPastCutoff: false,
      },
    ];

    dates.push({
      date: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      slots: defaultSlots,
    });
  }

  return dates;
}
