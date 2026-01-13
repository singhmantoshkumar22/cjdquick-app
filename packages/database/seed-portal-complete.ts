import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function generateToken(length = 64): string {
  return crypto.randomBytes(length / 2).toString("hex");
}

async function main() {
  console.log("🌱 Starting Portal Seed Data...\n");

  const passwordHash = await bcrypt.hash("password123", 10);

  // ============================================
  // STEP 1: COMPANY
  // ============================================
  console.log("🏢 Creating/Getting Company...");

  let company = await prisma.company.findFirst({ where: { code: "CJDQ" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        code: "CJDQ",
        name: "CJ Darcl Quick Logistics",
        legalName: "CJ Darcl Quick Logistics Pvt Ltd",
        gst: "07AABCU9603R1ZM",
        pan: "AABCU9603R",
        email: "contact@cjdquick.com",
        phone: "1800-000-0000",
        address: JSON.stringify({
          line1: "123, Logistics Park",
          city: "Gurgaon",
          state: "Haryana",
          pincode: "122001",
        }),
        status: "ACTIVE",
        isActive: true,
      },
    });
    console.log("   ✅ Created company: CJ Darcl Quick Logistics");
  } else {
    console.log("   ✅ Using existing company: CJ Darcl Quick Logistics");
  }

  // ============================================
  // STEP 2: LOCATIONS (CJD Quick Warehouses)
  // ============================================
  console.log("\n📍 Creating Warehouse Locations...");

  // Use upsert with compound unique key (companyId, code)
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { companyId_code: { companyId: company.id, code: "WH-DEL-01" } },
      create: {
        id: "loc-wh-del-01",
        code: "WH-DEL-01",
        name: "Delhi Fulfillment Center",
        type: "WAREHOUSE",
        address: "Plot 45, Sector 18, Industrial Area",
        pincode: "122001",
        city: "Gurgaon",
        state: "Haryana",
        country: "India",
        contactPerson: "Rajesh Kumar",
        contactPhone: "9876543210",
        contactEmail: "delhi-wh@cjdquick.com",
        capacityCbm: 5000,
        capacityParcels: 50000,
        isActive: true,
        companyId: company.id,
      },
      update: {},
    }),
    prisma.location.upsert({
      where: { companyId_code: { companyId: company.id, code: "WH-MUM-01" } },
      create: {
        id: "loc-wh-mum-01",
        code: "WH-MUM-01",
        name: "Mumbai Fulfillment Center",
        type: "WAREHOUSE",
        address: "Unit 12, Bhiwandi Industrial Estate",
        pincode: "421302",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        contactPerson: "Amit Sharma",
        contactPhone: "9876543211",
        contactEmail: "mumbai-wh@cjdquick.com",
        capacityCbm: 4000,
        capacityParcels: 40000,
        isActive: true,
        companyId: company.id,
      },
      update: {},
    }),
    prisma.location.upsert({
      where: { companyId_code: { companyId: company.id, code: "WH-BLR-01" } },
      create: {
        id: "loc-wh-blr-01",
        code: "WH-BLR-01",
        name: "Bangalore Fulfillment Center",
        type: "WAREHOUSE",
        address: "Hosur Road, Electronic City",
        pincode: "560100",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        contactPerson: "Suresh Reddy",
        contactPhone: "9876543212",
        contactEmail: "bangalore-wh@cjdquick.com",
        capacityCbm: 3500,
        capacityParcels: 35000,
        isActive: true,
        companyId: company.id,
      },
      update: {},
    }),
  ]);

  console.log(`   ✅ Created ${locations.length} warehouse locations`);

  // ============================================
  // STEP 3: TRANSPORTERS
  // ============================================
  console.log("\n🚚 Creating Transporters...");

  // Use upsert to handle existing transporters
  const transporters = await Promise.all([
    prisma.transporter.upsert({
      where: { code: "DELHIVERY" },
      create: {
        code: "DELHIVERY",
        name: "Delhivery Pvt Ltd",
        type: "COURIER",
        apiEnabled: true,
        trackingUrlTemplate: "https://www.delhivery.com/track/package/${awb}",
        supportsCod: true,
        supportsReverse: true,
        isActive: true,
      },
      update: {},
    }),
    prisma.transporter.upsert({
      where: { code: "BLUEDART" },
      create: {
        code: "BLUEDART",
        name: "Blue Dart Express",
        type: "COURIER",
        apiEnabled: true,
        trackingUrlTemplate: "https://www.bluedart.com/tracking/${awb}",
        supportsCod: true,
        supportsReverse: true,
        isActive: true,
      },
      update: {},
    }),
    prisma.transporter.upsert({
      where: { code: "EKART" },
      create: {
        code: "EKART",
        name: "Ekart Logistics",
        type: "COURIER",
        apiEnabled: false,
        supportsCod: true,
        supportsReverse: false,
        isActive: true,
      },
      update: {},
    }),
    prisma.transporter.upsert({
      where: { code: "XPRESSBEES" },
      create: {
        code: "XPRESSBEES",
        name: "XpressBees",
        type: "COURIER",
        apiEnabled: true,
        trackingUrlTemplate: "https://www.xpressbees.com/track/${awb}",
        supportsCod: true,
        supportsReverse: true,
        isActive: true,
      },
      update: {},
    }),
  ]);

  console.log(`   ✅ Created ${transporters.length} transporters`);

  // ============================================
  // STEP 4: BRANDS
  // ============================================
  console.log("\n🏷️ Creating Brands...");

  // Use upsert with fixed IDs for brands
  const brands = await Promise.all([
    // SHIPPING model brand - Client uses own warehouse, we only do transport
    prisma.brand.upsert({
      where: { code: "ACME-SHIPPING" },
      create: {
        id: "brand-acme-shipping",
        code: "ACME-SHIPPING",
        name: "ACME Electronics",
        type: "B2B",
        businessName: "ACME Electronics Pvt Ltd",
        legalName: "ACME Electronics Private Limited",
        gst: "07AABCA1234R1Z5",
        pan: "AABCA1234R",
        contactPerson: "John Smith",
        contactEmail: "john@acme.com",
        contactPhone: "9876500001",
        address: JSON.stringify({
          line1: "100, Industrial Area",
          city: "Gurgaon",
          state: "Haryana",
          pincode: "122002",
        }),
        creditLimit: 100000,
        currentBalance: 0,
        paymentTermsDays: 30,
        serviceModel: "SHIPPING",
        kycStatus: "VERIFIED",
        kycVerifiedAt: new Date(),
        status: "ACTIVE",
        isActive: true,
        companyId: company.id,
      },
      update: {},
    }),
    // FULFILLMENT model brand - Inventory stored at CJD Quick warehouse
    prisma.brand.upsert({
      where: { code: "GLOBEX-FULFILLMENT" },
      create: {
        id: "brand-globex-fulfillment",
        code: "GLOBEX-FULFILLMENT",
        name: "Globex Fashion",
        type: "B2C",
        businessName: "Globex Fashion House",
        legalName: "Globex Fashion House Pvt Ltd",
        gst: "27AABCG5678R1Z3",
        pan: "AABCG5678R",
        contactPerson: "Sarah Johnson",
        contactEmail: "sarah@globex.com",
        contactPhone: "9876500002",
        address: JSON.stringify({
          line1: "Tower A, Business Park",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
        }),
        creditLimit: 500000,
        currentBalance: 25000,
        paymentTermsDays: 15,
        serviceModel: "FULFILLMENT",
        kycStatus: "VERIFIED",
        kycVerifiedAt: new Date(),
        status: "ACTIVE",
        isActive: true,
        companyId: company.id,
      },
      update: {},
    }),
    // HYBRID model brand - Both shipping and fulfillment
    prisma.brand.upsert({
      where: { code: "INITECH-HYBRID" },
      create: {
        id: "brand-initech-hybrid",
        code: "INITECH-HYBRID",
        name: "Initech Supplies",
        type: "B2B",
        businessName: "Initech Office Supplies",
        legalName: "Initech Office Supplies Pvt Ltd",
        gst: "29AABCI9012R1Z1",
        pan: "AABCI9012R",
        contactPerson: "Mike Wilson",
        contactEmail: "mike@initech.com",
        contactPhone: "9876500003",
        address: JSON.stringify({
          line1: "50, Tech Park",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
        }),
        creditLimit: 200000,
        currentBalance: 15000,
        paymentTermsDays: 20,
        serviceModel: "HYBRID",
        kycStatus: "VERIFIED",
        kycVerifiedAt: new Date(),
        status: "ACTIVE",
        isActive: true,
        companyId: company.id,
      },
      update: {},
    }),
  ]);

  console.log(`   ✅ Created ${brands.length} brands (SHIPPING, FULFILLMENT, HYBRID)`);

  // ============================================
  // STEP 5: BRAND USERS & SESSIONS
  // ============================================
  console.log("\n👤 Creating Brand Users and Sessions...");

  const brandUsers: Array<{ user: any; token: string }> = [];
  const fixedTokens = [
    "ACME-TOKEN-12345678901234567890123456789012345678901234567890123456",
    "GLOBEX-TOKEN-234567890123456789012345678901234567890123456789012345",
    "INITECH-TOKEN-3456789012345678901234567890123456789012345678901234",
  ];

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    const email = `admin@${brand.code.toLowerCase().replace("-", "")}.com`;

    // Upsert user
    const user = await prisma.brandUser.upsert({
      where: { brandId_email: { brandId: brand.id, email } },
      create: {
        id: `user-${brand.code.toLowerCase()}`,
        email,
        passwordHash,
        name: `${brand.name} Admin`,
        phone: brand.contactPhone || "9876500000",
        role: "OWNER",
        brandId: brand.id,
        isActive: true,
      },
      update: {},
    });

    // Delete existing sessions for this user and create new one with fixed token
    await prisma.brandUserSession.deleteMany({
      where: { brandUserId: user.id },
    });

    const token = fixedTokens[i];
    await prisma.brandUserSession.create({
      data: {
        token,
        brandUserId: user.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      },
    });

    brandUsers.push({ user, token });
  }

  console.log(`   ✅ Created ${brandUsers.length} brand users with sessions`);
  console.log("\n   📝 Portal Login credentials:");
  brandUsers.forEach(({ user, token }) => {
    console.log(`      - ${user.email} / password123`);
    console.log(`        Token: ${token.substring(0, 20)}...`);
  });

  // ============================================
  // STEP 6: WAREHOUSE ASSIGNMENTS (for FULFILLMENT brands)
  // ============================================
  console.log("\n🏭 Creating Warehouse Assignments...");

  const fulfillmentBrand = brands[1]; // Globex Fashion
  const hybridBrand = brands[2]; // Initech Supplies

  await Promise.all([
    // Globex - Delhi & Mumbai warehouses
    prisma.brandWarehouseAssignment.upsert({
      where: { brandId_locationId: { brandId: fulfillmentBrand.id, locationId: locations[0].id } },
      create: {
        brandId: fulfillmentBrand.id,
        locationId: locations[0].id, // Delhi
        isActive: true,
        isPrimary: true,
        allocatedCapacityCbm: 500,
        allocatedBins: 100,
        storageRatePerCbm: 50,
        handlingRatePerUnit: 5,
        pickPackRate: 15,
        slaPickingHours: 4,
        slaPackingHours: 2,
      },
      update: {},
    }),
    prisma.brandWarehouseAssignment.upsert({
      where: { brandId_locationId: { brandId: fulfillmentBrand.id, locationId: locations[1].id } },
      create: {
        brandId: fulfillmentBrand.id,
        locationId: locations[1].id, // Mumbai
        isActive: true,
        isPrimary: false,
        allocatedCapacityCbm: 300,
        allocatedBins: 60,
        storageRatePerCbm: 55,
        handlingRatePerUnit: 5,
        pickPackRate: 15,
        slaPickingHours: 4,
        slaPackingHours: 2,
      },
      update: {},
    }),
    // Initech - Bangalore warehouse
    prisma.brandWarehouseAssignment.upsert({
      where: { brandId_locationId: { brandId: hybridBrand.id, locationId: locations[2].id } },
      create: {
        brandId: hybridBrand.id,
        locationId: locations[2].id, // Bangalore
        isActive: true,
        isPrimary: true,
        allocatedCapacityCbm: 200,
        allocatedBins: 50,
        storageRatePerCbm: 45,
        handlingRatePerUnit: 4,
        pickPackRate: 12,
        slaPickingHours: 6,
        slaPackingHours: 3,
      },
      update: {},
    }),
  ]);

  console.log("   ✅ Created warehouse assignments for FULFILLMENT and HYBRID brands");

  // ============================================
  // STEP 7: INVENTORY ITEMS (for FULFILLMENT brand)
  // ============================================
  console.log("\n📦 Creating Inventory Items...");

  // Delete existing inventory for our brands first
  await prisma.inventoryItem.deleteMany({
    where: { brandId: { in: [fulfillmentBrand.id, hybridBrand.id] } },
  });

  const skus = [
    { sku: "GF-TSHIRT-BLK-M", name: "Black T-Shirt (M)", category: "Apparel", price: 599, weight: 200 },
    { sku: "GF-TSHIRT-BLK-L", name: "Black T-Shirt (L)", category: "Apparel", price: 599, weight: 220 },
    { sku: "GF-TSHIRT-WHT-M", name: "White T-Shirt (M)", category: "Apparel", price: 549, weight: 200 },
    { sku: "GF-JEANS-BLU-32", name: "Blue Jeans (32)", category: "Apparel", price: 1299, weight: 450 },
    { sku: "GF-JEANS-BLU-34", name: "Blue Jeans (34)", category: "Apparel", price: 1299, weight: 480 },
    { sku: "GF-JACKET-BLK-M", name: "Black Jacket (M)", category: "Apparel", price: 2499, weight: 650 },
    { sku: "GF-SHOES-WHT-9", name: "White Sneakers (9)", category: "Footwear", price: 1999, weight: 800 },
    { sku: "GF-SHOES-BLK-10", name: "Black Sneakers (10)", category: "Footwear", price: 1999, weight: 850 },
    { sku: "GF-CAP-BLK", name: "Black Cap", category: "Accessories", price: 399, weight: 100 },
    { sku: "GF-WATCH-SLV", name: "Silver Watch", category: "Accessories", price: 2999, weight: 150 },
  ];

  // Create inventory at Delhi warehouse
  for (const item of skus) {
    await prisma.inventoryItem.create({
      data: {
        brandId: fulfillmentBrand.id,
        locationId: locations[0].id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        costPrice: item.price * 0.6,
        totalQuantity: Math.floor(Math.random() * 100) + 50,
        reservedQty: Math.floor(Math.random() * 10),
        availableQty: Math.floor(Math.random() * 90) + 40,
        minStockLevel: 20,
        reorderPoint: 30,
        reorderQty: 50,
        weightGrams: item.weight,
        status: "ACTIVE",
      },
    });
  }

  // Create some inventory at Mumbai warehouse
  for (const item of skus.slice(0, 5)) {
    await prisma.inventoryItem.create({
      data: {
        brandId: fulfillmentBrand.id,
        locationId: locations[1].id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        costPrice: item.price * 0.6,
        totalQuantity: Math.floor(Math.random() * 50) + 20,
        reservedQty: Math.floor(Math.random() * 5),
        availableQty: Math.floor(Math.random() * 45) + 15,
        minStockLevel: 10,
        reorderPoint: 15,
        reorderQty: 30,
        weightGrams: item.weight,
        status: "ACTIVE",
      },
    });
  }

  console.log(`   ✅ Created ${skus.length + 5} inventory items`);

  // ============================================
  // STEP 8: UNIFIED ORDERS
  // ============================================
  console.log("\n📋 Creating Unified Orders...");

  // Delete existing orders and returns for our brands first
  await prisma.unifiedReturn.deleteMany({
    where: { order: { brandId: { in: brands.map(b => b.id) } } },
  });
  await prisma.unifiedOrderItem.deleteMany({
    where: { order: { brandId: { in: brands.map(b => b.id) } } },
  });
  await prisma.unifiedOrder.deleteMany({
    where: { brandId: { in: brands.map(b => b.id) } },
  });

  const customerNames = [
    "Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta", "Vikram Singh",
    "Anita Roy", "Rajesh Verma", "Meera Nair", "Suresh Reddy", "Kavita Joshi",
    "Deepak Mehta", "Sunita Rao", "Arun Singh", "Neha Kapoor", "Sanjay Gupta",
  ];

  const cities = [
    { pincode: "110001", city: "Delhi", state: "Delhi" },
    { pincode: "400001", city: "Mumbai", state: "Maharashtra" },
    { pincode: "560001", city: "Bangalore", state: "Karnataka" },
    { pincode: "600001", city: "Chennai", state: "Tamil Nadu" },
    { pincode: "700001", city: "Kolkata", state: "West Bengal" },
    { pincode: "302001", city: "Jaipur", state: "Rajasthan" },
    { pincode: "380001", city: "Ahmedabad", state: "Gujarat" },
    { pincode: "411001", city: "Pune", state: "Maharashtra" },
  ];

  const statuses = [
    { status: "CREATED", weight: 5 },
    { status: "CONFIRMED", weight: 5 },
    { status: "PROCESSING", weight: 3 },
    { status: "PICKED", weight: 3 },
    { status: "PACKED", weight: 3 },
    { status: "READY_TO_SHIP", weight: 5 },
    { status: "IN_TRANSIT", weight: 15 },
    { status: "OUT_FOR_DELIVERY", weight: 5 },
    { status: "DELIVERED", weight: 40 },
    { status: "NDR", weight: 3 },
    { status: "RTO_INITIATED", weight: 2 },
    { status: "CANCELLED", weight: 2 },
  ];

  const today = new Date();
  let orderCounter = 1;

  // Helper to pick weighted random status
  function pickStatus() {
    const totalWeight = statuses.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    for (const s of statuses) {
      random -= s.weight;
      if (random <= 0) return s.status;
    }
    return "CREATED";
  }

  // Orders for FULFILLMENT brand (Globex Fashion) - More orders
  for (let i = 0; i < 80; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
    const status = pickStatus();
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const isPrepaid = Math.random() > 0.4;
    const amount = Math.floor(Math.random() * 3000) + 500;

    await prisma.unifiedOrder.create({
      data: {
        orderNumber: `GLX-${String(orderCounter++).padStart(6, "0")}`,
        orderType: "B2C",
        channel: ["SHOPIFY", "MANUAL", "API"][Math.floor(Math.random() * 3)],
        brandId: fulfillmentBrand.id,
        locationId: locations[0].id,
        customerName: customer,
        customerPhone: `98765${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
        customerEmail: `${customer.toLowerCase().replace(" ", ".")}@email.com`,
        shippingAddress: JSON.stringify({
          line1: `${Math.floor(Math.random() * 500) + 1}, Main Street`,
          landmark: "Near Metro Station",
        }),
        shippingPincode: city.pincode,
        shippingCity: city.city,
        shippingState: city.state,
        originPincode: "122001",
        totalWeight: Math.random() * 2 + 0.3,
        length: 30,
        width: 20,
        height: 10,
        packageCount: 1,
        subtotal: amount,
        taxAmount: Math.floor(amount * 0.18),
        shippingCharges: 99,
        discount: Math.floor(Math.random() * 100),
        totalAmount: Math.floor(amount * 1.18) + 99,
        paymentMode: isPrepaid ? "PREPAID" : "COD",
        codAmount: isPrepaid ? 0 : Math.floor(amount * 1.18) + 99,
        transporterId: transporters[Math.floor(Math.random() * transporters.length)].id,
        awbNumber: status !== "CREATED" ? `AWB${String(Math.floor(Math.random() * 10000000000)).padStart(10, "0")}` : null,
        status,
        createdAt,
        pickedAt: ["PICKED", "PACKED", "READY_TO_SHIP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status)
          ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
          : null,
        deliveredAt: status === "DELIVERED"
          ? new Date(createdAt.getTime() + (Math.floor(Math.random() * 5) + 2) * 24 * 60 * 60 * 1000)
          : null,
      },
    });
  }

  // Orders for SHIPPING brand (ACME Electronics) - B2B orders
  for (let i = 0; i < 30; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
    const status = pickStatus();
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const amount = Math.floor(Math.random() * 50000) + 5000;

    await prisma.unifiedOrder.create({
      data: {
        orderNumber: `ACM-${String(orderCounter++).padStart(6, "0")}`,
        orderType: "B2B",
        channel: "MANUAL",
        brandId: brands[0].id,
        customerName: `${customer} Corp`,
        customerPhone: `98765${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
        customerEmail: `${customer.toLowerCase().replace(" ", ".")}@corp.com`,
        shippingAddress: JSON.stringify({
          line1: `${Math.floor(Math.random() * 100) + 1}, Industrial Area`,
          landmark: "Near Highway",
        }),
        shippingPincode: city.pincode,
        shippingCity: city.city,
        shippingState: city.state,
        originPincode: "122002",
        totalWeight: Math.random() * 10 + 2,
        length: 50,
        width: 40,
        height: 30,
        packageCount: Math.floor(Math.random() * 5) + 1,
        subtotal: amount,
        taxAmount: Math.floor(amount * 0.18),
        shippingCharges: 500,
        discount: 0,
        totalAmount: Math.floor(amount * 1.18) + 500,
        paymentMode: "PREPAID",
        codAmount: 0,
        transporterId: transporters[Math.floor(Math.random() * transporters.length)].id,
        awbNumber: status !== "CREATED" ? `AWB${String(Math.floor(Math.random() * 10000000000)).padStart(10, "0")}` : null,
        status,
        createdAt,
        deliveredAt: status === "DELIVERED"
          ? new Date(createdAt.getTime() + (Math.floor(Math.random() * 5) + 2) * 24 * 60 * 60 * 1000)
          : null,
      },
    });
  }

  // Orders for HYBRID brand (Initech)
  for (let i = 0; i < 40; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
    const status = pickStatus();
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const isPrepaid = Math.random() > 0.3;
    const amount = Math.floor(Math.random() * 10000) + 1000;

    await prisma.unifiedOrder.create({
      data: {
        orderNumber: `INT-${String(orderCounter++).padStart(6, "0")}`,
        orderType: "B2B",
        channel: "API",
        brandId: hybridBrand.id,
        locationId: i % 2 === 0 ? locations[2].id : null,
        customerName: `${customer} Office`,
        customerPhone: `98765${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
        customerEmail: `${customer.toLowerCase().replace(" ", ".")}@office.com`,
        shippingAddress: JSON.stringify({
          line1: `${Math.floor(Math.random() * 200) + 1}, Tech Park`,
          landmark: "Near IT Hub",
        }),
        shippingPincode: city.pincode,
        shippingCity: city.city,
        shippingState: city.state,
        originPincode: "560001",
        totalWeight: Math.random() * 5 + 0.5,
        length: 40,
        width: 30,
        height: 20,
        packageCount: 1,
        subtotal: amount,
        taxAmount: Math.floor(amount * 0.18),
        shippingCharges: 200,
        discount: Math.floor(Math.random() * 200),
        totalAmount: Math.floor(amount * 1.18) + 200,
        paymentMode: isPrepaid ? "PREPAID" : "COD",
        codAmount: isPrepaid ? 0 : Math.floor(amount * 1.18) + 200,
        transporterId: transporters[Math.floor(Math.random() * transporters.length)].id,
        awbNumber: status !== "CREATED" ? `AWB${String(Math.floor(Math.random() * 10000000000)).padStart(10, "0")}` : null,
        status,
        createdAt,
        deliveredAt: status === "DELIVERED"
          ? new Date(createdAt.getTime() + (Math.floor(Math.random() * 5) + 2) * 24 * 60 * 60 * 1000)
          : null,
      },
    });
  }

  console.log(`   ✅ Created ${orderCounter - 1} unified orders`);

  // ============================================
  // STEP 9: UNIFIED RETURNS
  // ============================================
  console.log("\n🔄 Creating Returns...");

  // Get delivered orders to create returns from
  const deliveredOrders = await prisma.unifiedOrder.findMany({
    where: {
      brandId: fulfillmentBrand.id,
      status: "DELIVERED",
    },
    take: 15,
  });

  const returnStatuses = ["INITIATED", "IN_TRANSIT", "RECEIVED", "QC_PASSED", "QC_FAILED", "RESTOCKED", "COMPLETED"];
  const returnTypes = ["CUSTOMER_RETURN", "RTO"];
  const returnReasons = [
    "Size does not fit",
    "Color different from image",
    "Product damaged on arrival",
    "Changed mind",
    "Found better price elsewhere",
    "Customer not available (RTO)",
    "Wrong address (RTO)",
  ];

  let returnCounter = 1;
  for (const order of deliveredOrders) {
    const isRTO = Math.random() > 0.7;
    const daysAgo = Math.floor(Math.random() * 20);
    const createdAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.unifiedReturn.create({
      data: {
        returnNumber: `RTN-${String(returnCounter++).padStart(6, "0")}`,
        orderId: order.id,
        type: isRTO ? "RTO" : "CUSTOMER_RETURN",
        reason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
        status: returnStatuses[Math.floor(Math.random() * returnStatuses.length)],
        createdAt,
      },
    });
  }

  console.log(`   ✅ Created ${returnCounter - 1} returns`);

  // ============================================
  // STEP 10: RECEIVING ORDERS (for inbound inventory)
  // ============================================
  console.log("\n📥 Creating Receiving Orders...");

  await prisma.receivingOrder.deleteMany({
    where: { brandId: fulfillmentBrand.id },
  });

  const receivingStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];
  let receivingCounter = 1;

  for (let i = 0; i < 5; i++) {
    await prisma.receivingOrder.create({
      data: {
        receivingNumber: `RCV-${String(receivingCounter++).padStart(6, "0")}`,
        brandId: fulfillmentBrand.id,
        locationId: locations[i % 2 === 0 ? 0 : 1].id,
        type: "PURCHASE_ORDER",
        status: receivingStatuses[Math.floor(Math.random() * receivingStatuses.length)],
        grnNumber: `GRN-${String(receivingCounter).padStart(6, "0")}`,
        remarks: `Purchase order shipment ${i + 1}`,
      },
    });
  }

  console.log(`   ✅ Created ${receivingCounter - 1} receiving orders`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n✨ Portal Seed Data Completed Successfully!\n");
  console.log("Summary:");
  console.log(`   • 1 Company`);
  console.log(`   • ${locations.length} Warehouse Locations`);
  console.log(`   • ${transporters.length} Transporters`);
  console.log(`   • ${brands.length} Brands (SHIPPING, FULFILLMENT, HYBRID)`);
  console.log(`   • ${brandUsers.length} Brand Users with active sessions`);
  console.log(`   • ${skus.length + 5} Inventory Items`);
  console.log(`   • ${orderCounter - 1} Unified Orders`);
  console.log(`   • ${returnCounter - 1} Returns`);
  console.log(`   • ${receivingCounter - 1} Receiving Orders`);

  console.log("\n📝 Portal Access:");
  console.log("   URL: http://localhost:3000/portal");
  console.log("\n   FULFILLMENT Brand (Full OMS access):");
  console.log("   - Email: admin@globexfulfillment.com");
  console.log("   - Password: password123");
  console.log(`   - API Token: ${brandUsers[1].token}`);

  console.log("\n   SHIPPING Brand (Shipping only):");
  console.log("   - Email: admin@acmeshipping.com");
  console.log("   - Password: password123");
  console.log(`   - API Token: ${brandUsers[0].token}`);

  console.log("\n   HYBRID Brand (Both models):");
  console.log("   - Email: admin@initechhybrid.com");
  console.log("   - Password: password123");
  console.log(`   - API Token: ${brandUsers[2].token}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
