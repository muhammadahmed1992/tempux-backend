import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userTypes = [
    { id: 1, name: "Super Admin" },
    { id: 2, name: "Admin" },
    { id: 3, name: "Buyer" },
    { id: 4, name: "Seller" },
  ];

  for (const userType of userTypes) {
    try {
      // <--- ADD try/catch for each upsert
      await prisma.user_type.upsert({
        where: { id: userType.id },
        update: { name: userType.name },
        create: {
          id: userType.id,
          name: userType.name,
        },
      });
      console.log(`Successfully upserted userType: ${userType.id}`); // <--- ADD THIS
    } catch (e) {
      console.error(
        `Error upserting userType ${userType.id} - ${userType.name}:`,
        e
      );
    }
  }

  console.log("✅ Default user types seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
