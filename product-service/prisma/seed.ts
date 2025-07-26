import { PrismaClient } from '@prisma/client';
import SeedHelper from '../src/common/helper/seed.helper';

const prisma = new PrismaClient();

async function main() {
  const seedHelper = new SeedHelper(prisma);
  try {
    // Call the seedAllData method with the BigInt userId and desired number of products
    await seedHelper.seedAllData('1', 450); // Pass userId as string for convenience, convert to BigInt inside SeedHelper
  } catch (e) {
    console.error('----------- product service ------------ ');
    console.error('error while seeding data: ');
    console.error(e);
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
