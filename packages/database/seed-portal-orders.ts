import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding portal test orders...");

  const b2bBrandId = "portal-b2b-brand-001";
  const b2cBrandId = "portal-b2c-brand-001";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Common order data
  const baseOrder = {
    shippingAddress: JSON.stringify({
      line1: "123 Test Street",
      line2: "Near Test Market",
      landmark: "Test Landmark",
    }),
    shippingCountry: "India",
    originPincode: "110001",
    totalWeight: 1.5,
    length: 20,
    width: 15,
    height: 10,
    packageCount: 1,
    subtotal: 1000,
    taxAmount: 180,
    shippingCharges: 100,
    discount: 0,
    totalAmount: 1280,
  };

  // B2B Orders - different statuses
  const b2bOrders = [
    // Pending AWB (4 orders)
    ...Array(4).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2B-PEND-${Date.now()}-${i}`,
      orderType: "B2B",
      channel: "MANUAL",
      brandId: b2bBrandId,
      customerName: `B2B Customer ${i + 1}`,
      customerPhone: `98765432${10 + i}`,
      customerEmail: `b2bcust${i + 1}@company.com`,
      shippingPincode: "400001",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      paymentMode: "PREPAID",
      codAmount: 0,
      status: "CREATED",
      awbNumber: null,
    })),
    // Ready to ship (3 orders)
    ...Array(3).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2B-SHIP-${Date.now()}-${i}`,
      orderType: "B2B",
      channel: "MANUAL",
      brandId: b2bBrandId,
      customerName: `B2B Ship Customer ${i + 1}`,
      customerPhone: `98765433${10 + i}`,
      customerEmail: `b2bship${i + 1}@company.com`,
      shippingPincode: "560001",
      shippingCity: "Bangalore",
      shippingState: "Karnataka",
      paymentMode: "PREPAID",
      codAmount: 0,
      status: "READY_TO_SHIP",
      awbNumber: `AWB-B2B-SHIP-${i}`,
    })),
    // In transit (8 orders)
    ...Array(8).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2B-TRNS-${Date.now()}-${i}`,
      orderType: "B2B",
      channel: "MANUAL",
      brandId: b2bBrandId,
      customerName: `B2B Transit Customer ${i + 1}`,
      customerPhone: `98765434${10 + i}`,
      customerEmail: `b2btrns${i + 1}@company.com`,
      shippingPincode: "110001",
      shippingCity: "Delhi",
      shippingState: "Delhi",
      paymentMode: i % 2 === 0 ? "PREPAID" : "COD",
      codAmount: i % 2 === 0 ? 0 : 1280,
      status: i % 3 === 0 ? "OUT_FOR_DELIVERY" : "IN_TRANSIT",
      awbNumber: `AWB-B2B-TRNS-${i}`,
      pickedAt: weekAgo,
    })),
    // Delivered today (12 orders)
    ...Array(12).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2B-DLVD-${Date.now()}-${i}`,
      orderType: "B2B",
      channel: "MANUAL",
      brandId: b2bBrandId,
      customerName: `B2B Delivered Customer ${i + 1}`,
      customerPhone: `98765435${10 + i}`,
      customerEmail: `b2bdlvd${i + 1}@company.com`,
      shippingPincode: "700001",
      shippingCity: "Kolkata",
      shippingState: "West Bengal",
      paymentMode: "PREPAID",
      codAmount: 0,
      status: "DELIVERED",
      awbNumber: `AWB-B2B-DLVD-${i}`,
      pickedAt: weekAgo,
      deliveredAt: today,
    })),
    // Exceptions (2 orders)
    ...Array(2).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2B-NDR-${Date.now()}-${i}`,
      orderType: "B2B",
      channel: "MANUAL",
      brandId: b2bBrandId,
      customerName: `B2B NDR Customer ${i + 1}`,
      customerPhone: `98765436${10 + i}`,
      customerEmail: `b2bndr${i + 1}@company.com`,
      shippingPincode: "600001",
      shippingCity: "Chennai",
      shippingState: "Tamil Nadu",
      paymentMode: "COD",
      codAmount: 1280,
      status: "NDR",
      awbNumber: `AWB-B2B-NDR-${i}`,
    })),
    // RTO (1 order)
    {
      ...baseOrder,
      orderNumber: `B2B-RTO-${Date.now()}-0`,
      orderType: "B2B",
      channel: "MANUAL",
      brandId: b2bBrandId,
      customerName: "B2B RTO Customer",
      customerPhone: "9876543700",
      customerEmail: "b2brto@company.com",
      shippingPincode: "380001",
      shippingCity: "Ahmedabad",
      shippingState: "Gujarat",
      paymentMode: "COD",
      codAmount: 1280,
      status: "RTO_IN_TRANSIT",
      awbNumber: "AWB-B2B-RTO-0",
    },
  ];

  // B2C Orders - different statuses (more volume than B2B)
  const b2cOrders = [
    // Pending AWB (8 orders)
    ...Array(8).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2C-PEND-${Date.now()}-${i}`,
      orderType: "B2C",
      channel: i % 2 === 0 ? "SHOPIFY" : "MANUAL",
      brandId: b2cBrandId,
      customerName: `B2C Customer ${i + 1}`,
      customerPhone: `98765442${10 + i}`,
      customerEmail: `b2ccust${i + 1}@email.com`,
      shippingPincode: "400001",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      paymentMode: i % 3 === 0 ? "PREPAID" : "COD",
      codAmount: i % 3 === 0 ? 0 : 1280,
      status: "CREATED",
      awbNumber: null,
    })),
    // Ready to ship (6 orders)
    ...Array(6).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2C-SHIP-${Date.now()}-${i}`,
      orderType: "B2C",
      channel: "SHOPIFY",
      brandId: b2cBrandId,
      customerName: `B2C Ship Customer ${i + 1}`,
      customerPhone: `98765443${10 + i}`,
      customerEmail: `b2cship${i + 1}@email.com`,
      shippingPincode: "560001",
      shippingCity: "Bangalore",
      shippingState: "Karnataka",
      paymentMode: "PREPAID",
      codAmount: 0,
      status: i % 2 === 0 ? "PACKED" : "READY_TO_SHIP",
      awbNumber: `AWB-B2C-SHIP-${i}`,
    })),
    // In transit (25 orders)
    ...Array(25).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2C-TRNS-${Date.now()}-${i}`,
      orderType: "B2C",
      channel: i % 3 === 0 ? "AMAZON" : "SHOPIFY",
      brandId: b2cBrandId,
      customerName: `B2C Transit Customer ${i + 1}`,
      customerPhone: `98765444${String(i).padStart(2, "0")}`,
      customerEmail: `b2ctrns${i + 1}@email.com`,
      shippingPincode: ["110001", "560001", "400001", "700001", "600001"][i % 5],
      shippingCity: ["Delhi", "Bangalore", "Mumbai", "Kolkata", "Chennai"][i % 5],
      shippingState: ["Delhi", "Karnataka", "Maharashtra", "West Bengal", "Tamil Nadu"][i % 5],
      paymentMode: i % 2 === 0 ? "PREPAID" : "COD",
      codAmount: i % 2 === 0 ? 0 : 1280,
      status: i % 4 === 0 ? "OUT_FOR_DELIVERY" : "IN_TRANSIT",
      awbNumber: `AWB-B2C-TRNS-${i}`,
      pickedAt: weekAgo,
    })),
    // Delivered today (35 orders)
    ...Array(35).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2C-DLVD-${Date.now()}-${i}`,
      orderType: "B2C",
      channel: "SHOPIFY",
      brandId: b2cBrandId,
      customerName: `B2C Delivered Customer ${i + 1}`,
      customerPhone: `98765445${String(i).padStart(2, "0")}`,
      customerEmail: `b2cdlvd${i + 1}@email.com`,
      shippingPincode: ["110001", "560001", "400001"][i % 3],
      shippingCity: ["Delhi", "Bangalore", "Mumbai"][i % 3],
      shippingState: ["Delhi", "Karnataka", "Maharashtra"][i % 3],
      paymentMode: "PREPAID",
      codAmount: 0,
      status: "DELIVERED",
      awbNumber: `AWB-B2C-DLVD-${i}`,
      pickedAt: weekAgo,
      deliveredAt: today,
    })),
    // Exceptions/NDR (7 orders)
    ...Array(7).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2C-NDR-${Date.now()}-${i}`,
      orderType: "B2C",
      channel: "SHOPIFY",
      brandId: b2cBrandId,
      customerName: `B2C NDR Customer ${i + 1}`,
      customerPhone: `98765446${10 + i}`,
      customerEmail: `b2cndr${i + 1}@email.com`,
      shippingPincode: "600001",
      shippingCity: "Chennai",
      shippingState: "Tamil Nadu",
      paymentMode: "COD",
      codAmount: 1280,
      status: ["NDR", "EXCEPTION", "UNDELIVERED"][i % 3],
      awbNumber: `AWB-B2C-NDR-${i}`,
    })),
    // RTO (5 orders)
    ...Array(5).fill(null).map((_, i) => ({
      ...baseOrder,
      orderNumber: `B2C-RTO-${Date.now()}-${i}`,
      orderType: "B2C",
      channel: "MANUAL",
      brandId: b2cBrandId,
      customerName: `B2C RTO Customer ${i + 1}`,
      customerPhone: `98765447${10 + i}`,
      customerEmail: `b2crto${i + 1}@email.com`,
      shippingPincode: "380001",
      shippingCity: "Ahmedabad",
      shippingState: "Gujarat",
      paymentMode: "COD",
      codAmount: 1280,
      status: ["RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED"][i % 3],
      awbNumber: `AWB-B2C-RTO-${i}`,
    })),
  ];

  // Clear existing test orders
  await prisma.unifiedOrder.deleteMany({
    where: {
      orderNumber: {
        startsWith: "B2B-",
      },
    },
  });
  await prisma.unifiedOrder.deleteMany({
    where: {
      orderNumber: {
        startsWith: "B2C-",
      },
    },
  });

  console.log(`Seeding ${b2bOrders.length} B2B orders...`);
  for (const order of b2bOrders) {
    await prisma.unifiedOrder.create({ data: order });
  }

  console.log(`Seeding ${b2cOrders.length} B2C orders...`);
  for (const order of b2cOrders) {
    await prisma.unifiedOrder.create({ data: order });
  }

  // Count final results
  const b2bCount = await prisma.unifiedOrder.count({ where: { orderType: "B2B" } });
  const b2cCount = await prisma.unifiedOrder.count({ where: { orderType: "B2C" } });

  console.log("\n=== Seeding Complete ===");
  console.log(`B2B Orders: ${b2bCount}`);
  console.log(`B2C Orders: ${b2cCount}`);
  console.log(`Total: ${b2bCount + b2cCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
