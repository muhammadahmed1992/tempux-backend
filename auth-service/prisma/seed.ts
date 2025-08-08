import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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

  // Seed roles
  const roles = [
    { id: 1n, name: 'Super Admin' },
    { id: 2n, name: 'Admin' },
    { id: 3n, name: 'Buyer' },
    { id: 4n, name: 'Seller' },
  ];

  console.log('Seeding Roles...');
  for (const role of roles) {
    await prisma.roles.upsert({
      where: { id: role.id },
      update: { name: role.name },
      create: {
        id: role.id,
        name: role.name,
      },
    });
    console.log(`- Upserted Role: ${role.name} (ID: ${role.id})`);
  }
  console.log('Roles seeding complete.');

  // Seed access management
  const accessManagement = [
    { id: 1n, access: 'user_management', description: 'Manage users' },
    { id: 2n, access: 'product_management', description: 'Manage products' },
    { id: 3n, access: 'order_management', description: 'Manage orders' },
    { id: 4n, access: 'seller_approval', description: 'Approve sellers' },
    { id: 5n, access: 'buy_product', description: 'Purchase products' },
    { id: 6n, access: 'sell_product', description: 'Sell products' },
  ];

  console.log('Seeding Access Management...');
  for (const access of accessManagement) {
    await prisma.accessManagement.upsert({
      where: { id: access.id },
      update: { access: access.access, description: access.description },
      create: {
        id: access.id,
        access: access.access,
        description: access.description,
      },
    });
    console.log(`- Upserted Access: ${access.access} (ID: ${access.id})`);
  }
  console.log('Access Management seeding complete.');

  // Seed role access management mappings
  const roleAccessMappings = [
    // Super Admin - all access
    {
      role_id: 1n,
      access_management_id: 1n,
      description: 'Super Admin - User Management',
    },
    {
      role_id: 1n,
      access_management_id: 2n,
      description: 'Super Admin - Product Management',
    },
    {
      role_id: 1n,
      access_management_id: 3n,
      description: 'Super Admin - Order Management',
    },
    {
      role_id: 1n,
      access_management_id: 4n,
      description: 'Super Admin - Seller Approval',
    },
    {
      role_id: 1n,
      access_management_id: 5n,
      description: 'Super Admin - Buy Products',
    },
    {
      role_id: 1n,
      access_management_id: 6n,
      description: 'Super Admin - Sell Products',
    },

    // Admin - most access except seller approval
    {
      role_id: 2n,
      access_management_id: 1n,
      description: 'Admin - User Management',
    },
    {
      role_id: 2n,
      access_management_id: 2n,
      description: 'Admin - Product Management',
    },
    {
      role_id: 2n,
      access_management_id: 3n,
      description: 'Admin - Order Management',
    },
    {
      role_id: 2n,
      access_management_id: 5n,
      description: 'Admin - Buy Products',
    },
    {
      role_id: 2n,
      access_management_id: 6n,
      description: 'Admin - Sell Products',
    },

    // Buyer - only buy access
    {
      role_id: 3n,
      access_management_id: 5n,
      description: 'Buyer - Buy Products',
    },

    // Seller - sell and buy access
    {
      role_id: 4n,
      access_management_id: 5n,
      description: 'Seller - Buy Products',
    },
    {
      role_id: 4n,
      access_management_id: 6n,
      description: 'Seller - Sell Products',
    },
  ];

  console.log('Seeding Role Access Management...');
  for (const mapping of roleAccessMappings) {
    await prisma.roleAccessManagement.upsert({
      where: {
        role_id_access_management_id: {
          role_id: mapping.role_id,
          access_management_id: mapping.access_management_id,
        },
      },
      update: { description: mapping.description },
      create: {
        role_id: mapping.role_id,
        access_management_id: mapping.access_management_id,
        description: mapping.description,
      },
    });
    console.log(
      `- Upserted Role Access: Role ${mapping.role_id} -> Access ${mapping.access_management_id}`,
    );
  }
  console.log('Role Access Management seeding complete.');

  // Seed example users
  const users = [
    {
      email: 'superadmin@mailinator.com',
      name: 'Super Admin',
      fullName: 'Super Admin Full',
      roleId: 1n, // Super Admin
      password: 'SuperAdmin!123',
    },
    {
      email: 'admin@mailinator.com',
      name: 'Admin User',
      fullName: 'Admin Full',
      roleId: 2n, // Admin
      password: 'AdminUser@456',
    },
    {
      email: 'buyer@mailinator.com',
      name: 'Buyer User',
      fullName: 'Buyer Full',
      roleId: 3n, // Buyer
      password: 'BuyerPass#789',
    },
    {
      email: 'seller@mailinator.com',
      name: 'Seller User',
      fullName: 'Seller Full',
      roleId: 4n, // Seller
      password: 'SellerPwd$012',
    },
  ];

  console.log('Seeding Users...');
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUND);
    const otpResponse = generateOTPAndExpiry();

    // Create or update user
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        full_name: user.fullName,
        password: hashedPassword,
        otp: otpResponse.otp,
        otp_expires_at: otpResponse.otp_expires_at,
        otp_verified: true,
      },
      create: {
        name: user.name,
        full_name: user.fullName,
        email: user.email,
        password: hashedPassword,
        otp: otpResponse.otp,
        otp_expires_at: otpResponse.otp_expires_at,
        otp_verified: true,
      },
    });

    // Create or update user role
    await prisma.userRoles.upsert({
      where: {
        user_id_role_id: {
          user_id: createdUser.id,
          role_id: user.roleId,
        },
      },
      update: {},
      create: {
        user_id: createdUser.id,
        role_id: user.roleId,
      },
    });

    console.log(`- Upserted User: ${user.email} with Role ID: ${user.roleId}`);
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
