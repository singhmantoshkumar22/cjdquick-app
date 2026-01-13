import { PrismaClient, OrderStatus, PaymentMode, Channel, ItemStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to generate random date within last N days
function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

// Helper to pick random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate random order number
function generateOrderNo(index: number): string {
  return `ORD-${new Date().getFullYear()}-${String(index).padStart(6, "0")}`;
}

// Generate random customer name
function randomCustomerName(): string {
  const firstNames = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Pooja", "Raj", "Anita", "Deepak", "Kavita"];
  const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Verma", "Joshi", "Rao", "Mehta", "Shah"];
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
}

// Generate random phone number
function randomPhone(): string {
  return `+91 ${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
}

// Generate random address
function randomAddress() {
  const cities = [
    { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
    { city: "Delhi", state: "Delhi", pincode: "110001" },
    { city: "Bangalore", state: "Karnataka", pincode: "560001" },
    { city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
    { city: "Kolkata", state: "West Bengal", pincode: "700001" },
    { city: "Hyderabad", state: "Telangana", pincode: "500001" },
    { city: "Pune", state: "Maharashtra", pincode: "411001" },
    { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  ];
  const location = randomItem(cities);
  return {
    line1: `${Math.floor(Math.random() * 500) + 1}, Block ${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
    line2: `${randomItem(["MG Road", "Station Road", "Main Street", "Park Avenue", "Gandhi Nagar"])}`,
    ...location,
    country: "India",
  };
}

async function seedDashboardData() {
  console.log("Seeding dashboard test data...");

  // Get company and location
  const company = await prisma.company.findFirst({ where: { code: "DEMO" } });
  if (!company) {
    console.error("Company not found. Please run the main seed first.");
    return;
  }

  const location = await prisma.location.findFirst({
    where: { companyId: company.id, code: "WH-MUM-01" },
  });
  if (!location) {
    console.error("Location not found. Please run the main seed first.");
    return;
  }

  // Get SKUs
  const skus = await prisma.sKU.findMany({ where: { companyId: company.id } });
  if (skus.length === 0) {
    console.error("No SKUs found. Please run the main seed first.");
    return;
  }

  // Order statuses distribution (realistic)
  const statusDistribution: { status: OrderStatus; weight: number }[] = [
    { status: "CREATED", weight: 5 },
    { status: "CONFIRMED", weight: 8 },
    { status: "ALLOCATED", weight: 10 },
    { status: "PARTIALLY_ALLOCATED", weight: 3 },
    { status: "PICKLIST_GENERATED", weight: 5 },
    { status: "PICKING", weight: 3 },
    { status: "PICKED", weight: 4 },
    { status: "PACKING", weight: 3 },
    { status: "PACKED", weight: 5 },
    { status: "MANIFESTED", weight: 5 },
    { status: "SHIPPED", weight: 10 },
    { status: "IN_TRANSIT", weight: 8 },
    { status: "OUT_FOR_DELIVERY", weight: 5 },
    { status: "DELIVERED", weight: 20 },
    { status: "CANCELLED", weight: 3 },
    { status: "ON_HOLD", weight: 2 },
    { status: "RTO_INITIATED", weight: 1 },
  ];

  const channels: Channel[] = ["AMAZON", "FLIPKART", "MYNTRA", "WEBSITE", "SHOPIFY"];
  const paymentModes: PaymentMode[] = ["PREPAID", "COD"];

  // Generate weighted random status
  function getRandomStatus(): OrderStatus {
    const totalWeight = statusDistribution.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of statusDistribution) {
      random -= item.weight;
      if (random <= 0) return item.status;
    }
    return "DELIVERED";
  }

  // Check existing orders count to avoid duplicates
  const existingCount = await prisma.order.count({
    where: { locationId: location.id },
  });

  console.log(`Existing orders: ${existingCount}`);

  // Create orders (500-1000 orders spread over last 30 days)
  const ordersToCreate = 500;
  const startIndex = existingCount + 1;

  console.log(`Creating ${ordersToCreate} orders...`);

  for (let i = 0; i < ordersToCreate; i++) {
    const orderDate = randomDate(30);
    const status = getRandomStatus();
    const paymentMode = Math.random() > 0.9 ? "COD" : "PREPAID"; // ~10% COD
    const channel = randomItem(channels);

    // Generate order items (1-5 items per order)
    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderItems: {
      sku: typeof skus[0];
      quantity: number;
      unitPrice: number;
      taxAmount: number;
      discount: number;
    }[] = [];

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    for (let j = 0; j < numItems; j++) {
      const sku = randomItem(skus);
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = Number(sku.sellingPrice || sku.mrp || 500);
      const discount = Math.random() > 0.7 ? Math.floor(unitPrice * 0.1) : 0;
      const taxAmount = Math.round((unitPrice - discount) * quantity * 0.18); // 18% GST

      orderItems.push({
        sku,
        quantity,
        unitPrice,
        taxAmount,
        discount: discount * quantity,
      });

      subtotal += unitPrice * quantity;
      totalTax += taxAmount;
      totalDiscount += discount * quantity;
    }

    const shippingCharges = Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 100);
    const codCharges = paymentMode === "COD" ? Math.floor(subtotal * 0.02) : 0;
    const totalAmount = subtotal + totalTax - totalDiscount + shippingCharges + codCharges;

    // Determine if SLA is breached (for some orders)
    const promisedDate = new Date(orderDate);
    promisedDate.setDate(promisedDate.getDate() + 3); // 3-day SLA

    // Create order
    try {
      const order = await prisma.order.create({
        data: {
          orderNo: generateOrderNo(startIndex + i),
          externalOrderNo: `EXT-${channel.substring(0, 3)}-${Date.now()}-${i}`,
          channel,
          orderType: "B2C",
          paymentMode,
          status,
          customerName: randomCustomerName(),
          customerPhone: randomPhone(),
          customerEmail: `customer${startIndex + i}@example.com`,
          shippingAddress: randomAddress(),
          billingAddress: randomAddress(),
          subtotal,
          taxAmount: totalTax,
          shippingCharges,
          discount: totalDiscount,
          codCharges,
          totalAmount,
          orderDate,
          promisedDate,
          priority: Math.floor(Math.random() * 3),
          locationId: location.id,
          items: {
            create: orderItems.map((item, idx) => ({
              skuId: item.sku.id,
              externalItemId: `ITEM-${idx + 1}`,
              quantity: item.quantity,
              allocatedQty: ["ALLOCATED", "PICKED", "PACKED", "SHIPPED", "DELIVERED"].includes(status)
                ? item.quantity
                : status === "PARTIALLY_ALLOCATED"
                  ? Math.floor(item.quantity / 2)
                  : 0,
              pickedQty: ["PICKED", "PACKED", "SHIPPED", "DELIVERED"].includes(status) ? item.quantity : 0,
              packedQty: ["PACKED", "SHIPPED", "DELIVERED"].includes(status) ? item.quantity : 0,
              shippedQty: ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status) ? item.quantity : 0,
              unitPrice: item.unitPrice,
              taxAmount: item.taxAmount,
              discount: item.discount,
              totalPrice: item.unitPrice * item.quantity + item.taxAmount - item.discount,
              status: getItemStatus(status),
            })),
          },
        },
      });

      if ((i + 1) % 100 === 0) {
        console.log(`Created ${i + 1} orders...`);
      }
    } catch (error) {
      // Skip duplicates
      if ((error as Error).message.includes("Unique constraint")) {
        continue;
      }
      throw error;
    }
  }

  console.log(`\nDashboard data seeding completed!`);
  console.log(`Total orders in system: ${await prisma.order.count({ where: { locationId: location.id } })}`);
}

function getItemStatus(orderStatus: OrderStatus): ItemStatus {
  const statusMap: Partial<Record<OrderStatus, ItemStatus>> = {
    CREATED: "PENDING",
    CONFIRMED: "PENDING",
    ALLOCATED: "ALLOCATED",
    PARTIALLY_ALLOCATED: "PENDING",
    PICKLIST_GENERATED: "ALLOCATED",
    PICKING: "ALLOCATED",
    PICKED: "PICKED",
    PACKING: "PICKED",
    PACKED: "PACKED",
    MANIFESTED: "PACKED",
    SHIPPED: "SHIPPED",
    IN_TRANSIT: "SHIPPED",
    OUT_FOR_DELIVERY: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    ON_HOLD: "PENDING",
    RTO_INITIATED: "SHIPPED",
    RTO_IN_TRANSIT: "SHIPPED",
    RTO_DELIVERED: "RETURNED",
  };
  return statusMap[orderStatus] || "PENDING";
}

seedDashboardData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
