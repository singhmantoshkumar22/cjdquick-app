import { prisma } from "@oms/database";

async function createRTOOrder() {
  // Get existing data
  const location = await prisma.location.findFirst({ where: { name: { contains: "Delhi" } } });
  const sku = await prisma.sKU.findFirst({ where: { code: "SKU-001" } });
  const transporter = await prisma.transporter.findFirst();

  if (!location || !sku || !transporter) {
    console.log("Missing required data");
    return;
  }

  console.log("Creating RTO test orders...");

  const now = Date.now();

  // Create order 1 - Customer unavailable
  const order = await prisma.order.create({
    data: {
      orderNo: `ORD-RTO-${now.toString(36).toUpperCase()}`,
      externalOrderNo: `EXT-RTO-${now}`,
      channel: "FLIPKART",
      orderType: "B2C",
      paymentMode: "COD",
      status: "RTO_INITIATED",
      customerName: "Rajesh Kumar",
      customerPhone: "9876543210",
      customerEmail: "rajesh@example.com",
      shippingAddress: {
        name: "Rajesh Kumar",
        addressLine1: "45 MG Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        phone: "9876543210",
      },
      billingAddress: {
        name: "Rajesh Kumar",
        addressLine1: "45 MG Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        phone: "9876543210",
      },
      subtotal: 1999,
      taxAmount: 359.82,
      discount: 0,
      shippingCharges: 0,
      totalAmount: 2358.82,
      orderDate: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      shipByDate: new Date(now - 3 * 24 * 60 * 60 * 1000),
      locationId: location.id,
      items: {
        create: {
          skuId: sku.id,
          quantity: 2,
          unitPrice: 999.50,
          taxAmount: 359.82,
          totalPrice: 1999,
          allocatedQty: 2,
        },
      },
    },
  });
  console.log("Order created:", order.orderNo);

  // Create delivery that was attempted but failed
  const delivery = await prisma.delivery.create({
    data: {
      deliveryNo: `DEL-RTO-${now}`,
      orderId: order.id,
      transporterId: transporter.id,
      awbNo: `AWB-RTO-${now}`,
      status: "RTO_INITIATED",
      shipDate: new Date(now - 4 * 24 * 60 * 60 * 1000),
      weight: 0.8,
      remarks: "3 delivery attempts failed. Customer not available.",
    },
  });
  console.log("Delivery created:", delivery.awbNo);

  // Create RTO return
  const rtoReturn = await prisma.return.create({
    data: {
      returnNo: `RTO-${now.toString(36).toUpperCase()}`,
      orderId: order.id,
      type: "RTO",
      status: "INITIATED",
      reason: "Customer not available after 3 delivery attempts. Address unreachable.",
      initiatedAt: new Date(),
      items: {
        create: {
          skuId: sku.id,
          quantity: 2,
        },
      },
    },
    include: { items: true },
  });
  console.log("RTO Return created:", rtoReturn.returnNo);

  // Create order 2 - Incorrect address
  const order2 = await prisma.order.create({
    data: {
      orderNo: `ORD-RTO-${(now + 1).toString(36).toUpperCase()}`,
      externalOrderNo: `EXT-RTO-${now + 1}`,
      channel: "AMAZON",
      orderType: "B2C",
      paymentMode: "COD",
      status: "RTO_INITIATED",
      customerName: "Sneha Patel",
      customerPhone: "9123456780",
      customerEmail: "sneha@example.com",
      shippingAddress: {
        name: "Sneha Patel",
        addressLine1: "12 Ring Road",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        phone: "9123456780",
      },
      billingAddress: {
        name: "Sneha Patel",
        addressLine1: "12 Ring Road",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        phone: "9123456780",
      },
      subtotal: 2499,
      taxAmount: 449.82,
      discount: 100,
      shippingCharges: 0,
      totalAmount: 2848.82,
      orderDate: new Date(now - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      shipByDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
      locationId: location.id,
      items: {
        create: {
          skuId: sku.id,
          quantity: 1,
          unitPrice: 2499,
          taxAmount: 449.82,
          totalPrice: 2499,
          allocatedQty: 1,
        },
      },
    },
  });

  const delivery2 = await prisma.delivery.create({
    data: {
      deliveryNo: `DEL-RTO-${now + 1}`,
      orderId: order2.id,
      transporterId: transporter.id,
      awbNo: `AWB-RTO-${now + 1}`,
      status: "RTO_INITIATED",
      shipDate: new Date(now - 6 * 24 * 60 * 60 * 1000),
      weight: 0.5,
      remarks: "Address not found - pincode mismatch",
    },
  });

  const rtoReturn2 = await prisma.return.create({
    data: {
      returnNo: `RTO-${(now + 1).toString(36).toUpperCase()}`,
      orderId: order2.id,
      type: "RTO",
      status: "IN_TRANSIT",
      reason: "Incorrect address - pincode mismatch. Delivery agent could not locate address.",
      initiatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          skuId: sku.id,
          quantity: 1,
        },
      },
    },
  });
  console.log("Second RTO created:", rtoReturn2.returnNo);

  console.log("\n=== RTO Test Data Created ===");
  console.log("Order 1:", order.orderNo, "- Customer unavailable after 3 attempts");
  console.log("Order 2:", order2.orderNo, "- Incorrect address/pincode");
}

createRTOOrder()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
