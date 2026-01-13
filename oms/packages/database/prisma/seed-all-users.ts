import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating separate users for all panels...\n");

  // Get existing company
  let company = await prisma.company.findFirst();

  if (!company) {
    company = await prisma.company.create({
      data: {
        code: "DEMO",
        name: "Demo Company",
        legalName: "Demo Company Pvt. Ltd.",
        gst: "27AABCU9603R1ZM",
        pan: "AABCU9603R",
      },
    });
  }

  // Get warehouse
  let warehouse = await prisma.location.findFirst({
    where: { companyId: company.id },
  });

  if (!warehouse) {
    warehouse = await prisma.location.create({
      data: {
        code: "WH-MUM-01",
        name: "Mumbai Main Warehouse",
        type: "WAREHOUSE",
        address: {
          line1: "123 Industrial Area",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          country: "India",
        },
        companyId: company.id,
      },
    });
  }

  // ==================== 1. OMS DASHBOARD USER ====================
  console.log("1. Creating OMS Dashboard User...");
  const omsPassword = await hash("omsadmin123", 12);

  const omsUser = await prisma.user.upsert({
    where: { email: "oms@cjdquick.com" },
    update: { password: omsPassword },
    create: {
      email: "oms@cjdquick.com",
      password: omsPassword,
      name: "OMS Admin",
      phone: "+91 9876543210",
      role: "SUPER_ADMIN",
      companyId: company.id,
      locationAccess: [warehouse.id],
    },
  });
  console.log("   Created: oms@cjdquick.com\n");

  // ==================== 2. CLIENT PORTAL USER ====================
  console.log("2. Creating Client Portal User...");
  const clientPassword = await hash("client123", 12);

  // Create or get brand
  const brand = await prisma.brand.upsert({
    where: { code: "DEMO-BRAND" },
    update: {},
    create: {
      code: "DEMO-BRAND",
      name: "Demo Brand",
      description: "Demo brand for testing",
      contactPerson: "Client User",
      contactEmail: "client@demobrand.com",
      contactPhone: "+91 9876543211",
      companyId: company.id,
    },
  });

  // Create client user
  const clientUser = await prisma.user.upsert({
    where: { email: "client@demobrand.com" },
    update: { password: clientPassword },
    create: {
      email: "client@demobrand.com",
      password: clientPassword,
      name: "Client User",
      phone: "+91 9876543211",
      role: "CLIENT",
      companyId: company.id,
      locationAccess: [],
    },
  });

  // Link client user to brand
  await prisma.brandUser.upsert({
    where: {
      brandId_userId: {
        brandId: brand.id,
        userId: clientUser.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      brandId: brand.id,
      userId: clientUser.id,
      role: "OWNER",
    },
  });
  console.log("   Created: client@demobrand.com\n");

  // ==================== SUMMARY ====================
  console.log("=".repeat(60));
  console.log("ALL USERS CREATED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("");
  console.log("PANEL 1: Main CJDQuickApp (http://localhost:3000)");
  console.log("   Email:    superadmin@cjdquick.com");
  console.log("   Password: password123");
  console.log("   (Run: cd /Users/mantosh/CJDQuickApp && npx prisma db seed)");
  console.log("");
  console.log("PANEL 2: OMS Dashboard (http://localhost:3001)");
  console.log("   Email:    oms@cjdquick.com");
  console.log("   Password: omsadmin123");
  console.log("");
  console.log("PANEL 3: Client Portal (http://localhost:3001/client)");
  console.log("   Email:    client@demobrand.com");
  console.log("   Password: client123");
  console.log("");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
