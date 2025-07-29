import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const configService = new ConfigService();
const SALT_ROUND = parseInt(
  configService.get<string>('SALT_ROUND') || '10',
  10,
);

/**
 * Generates a 6-digit OTP and an expiry date 5 minutes from now.
 * @returns {object} An object containing the OTP string and its expiry Date object.
 */
function generateOTPAndExpiry() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 mins
  return { otp, otp_expires_at: expiry };
}

async function main() {
  console.log('🚀 Starting database seeding...');

  // Seed user types
  const userTypes = [
    { id: 1, name: 'Super Admin' },
    { id: 2, name: 'Admin' },
    { id: 3, name: 'Buyer' },
    { id: 4, name: 'Seller' },
  ];

  console.log('Seeding User Types...');
  for (const userType of userTypes) {
    await prisma.userType.upsert({
      where: { id: userType.id },
      update: { name: userType.name },
      create: {
        id: userType.id,
        name: userType.name,
      },
    });
    console.log(`- Upserted UserType: ${userType.name} (ID: ${userType.id})`);
  }
  console.log('User Types seeding complete.');

  // Seed example users
  const users = [
    {
      email: 'superadmin@mailinator.com',
      name: 'Super Admin',
      fullName: 'Super Admin Full',
      userType: 1, // Super Admin
      // Password now complies with: At least one uppercase, one lowercase, one number, one special char, 8-30 length
      password: 'SuperAdmin!123',
    },
    {
      email: 'admin@mailinator.com',
      name: 'Admin User',
      fullName: 'Admin Full',
      userType: 2, // Admin
      password: 'AdminUser@456',
    },
    {
      email: 'buyer@mailinator.com',
      name: 'Buyer User',
      fullName: 'Buyer Full',
      userType: 3, // Buyer
      password: 'BuyerPass#789',
    },
    {
      email: 'seller@mailinator.com',
      name: 'Seller User',
      fullName: 'Seller Full',
      userType: 4, // Seller
      password: 'SellerPwd$012',
    },
  ];

  console.log('Seeding Users...');
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUND);
    const otpResponse = generateOTPAndExpiry();

    // Upsert user based on unique combination of email and user_type
    await prisma.user.upsert({
      where: {
        email_user_type: {
          // Assuming you have a unique constraint on (email, user_type)
          email: user.email,
          user_type: user.userType,
        },
      },
      update: {
        name: user.name,
        // Only update password if you intend to reset it on every seed
        // For production seeds, you might not want to update passwords if users already exist.
        password: hashedPassword,
        otp: otpResponse.otp,
        otp_expires_at: otpResponse.otp_expires_at,
        otp_verified: true, // Assuming seeded users are verified
      },
      create: {
        name: user.name,
        full_name: user.fullName, // Ensure this matches your Prisma schema field name
        email: user.email,
        password: hashedPassword,
        user_type: user.userType,
        otp: otpResponse.otp,
        otp_expires_at: otpResponse.otp_expires_at,
        otp_verified: true,
      },
    });
    console.log(`- Upserted User: ${user.email} (UserType: ${user.userType})`);
  }
  console.log('Users seeding complete.');

  console.log('✅ All seeding operations complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed!');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Database client disconnected.');
  });
