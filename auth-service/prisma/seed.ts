import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUND = 10; // adjust if you use a different round

function generateOTPAndExpiry() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 mins
  return { otp, otp_expires_at: expiry };
}

async function main() {
  // Seed user types
  const userTypes = [
    { id: 1, name: 'Super Admin' },
    { id: 2, name: 'Admin' },
    { id: 3, name: 'Buyer' },
    { id: 4, name: 'Seller' },
  ];

  for (const userType of userTypes) {
    await prisma.userType.upsert({
      where: { id: userType.id },
      update: { name: userType.name },
      create: {
        id: userType.id,
        name: userType.name,
      },
    });
  }

  // Seed example users
  const users = [
    {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      fullName: 'Super Admin Full',
      userType: 1,
      password: 'superadmin123',
    },
    {
      email: 'admin@example.com',
      name: 'Admin User',
      fullName: 'Admin Full',
      userType: 2,
      password: 'admin123',
    },
    {
      email: 'buyer@example.com',
      name: 'Buyer User',
      fullName: 'Buyer Full',
      userType: 3,
      password: 'buyer123',
    },
    {
      email: 'seller@example.com',
      name: 'Seller User',
      fullName: 'Seller Full',
      userType: 4,
      password: 'seller123',
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUND);
    const otpResponse = generateOTPAndExpiry();

    await prisma.user.upsert({
      where: {
        email_user_type: {
          email: user.email,
          user_type: user.userType,
        },
      },
      update: {
        name: user.name,
      },
      create: {
        name: user.name,
        full_name: user.fullName,
        email: user.email,
        password: hashedPassword,
        user_type: user.userType,
        otp: otpResponse.otp,
        otp_expires_at: otpResponse.otp_expires_at,
        otp_verified: true,
      },
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
