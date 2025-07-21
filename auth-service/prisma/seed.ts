import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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

  const superAdmin = {
    name: "sahmed1992",
    email: "muhammed_hm@hotmail.com",
    password: bcrypt.hashSync("abc123", Number(process.env.SALT_ROUND) || 10),
    userType: 1,
    otp: bcrypt.hashSync("123456", Number(process.env.SALT_ROUND) || 10),
  };

  const admin = {
    name: "mahmed1992",
    email: "muhammed_hm@hotmail.com",
    password: bcrypt.hashSync("abc123", Number(process.env.SALT_ROUND) || 10),
    userType: 2,
    otp: bcrypt.hashSync("123456", Number(process.env.SALT_ROUND) || 10),
  };
  try {
    await prisma.users.upsert({
      where: {
        email_user_type: {
          // Use the generated compound unique key
          email: superAdmin.email,
          user_type: superAdmin.userType,
        },
      },
      update: { name: superAdmin.name },
      create: {
        name: superAdmin.name,
        email: superAdmin.email,
        password: superAdmin.password,
        otp: superAdmin.otp,
        user_type: superAdmin.userType,
      },
    });

    await prisma.users.upsert({
      where: {
        email_user_type: {
          // Use the generated compound unique key
          email: admin.email,
          user_type: admin.userType,
        },
      },
      update: { name: admin.name },
      create: {
        name: admin.name,
        email: admin.email,
        password: admin.password,
        otp: admin.otp,
        user_type: admin.userType,
      },
    });
  } catch (e) {
    console.error("Error while adding seed user");
    console.error(e);
  }
}

main()
  .catch((e) => {
    console.error("Exception occured while seeding data: Auth-Service");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
