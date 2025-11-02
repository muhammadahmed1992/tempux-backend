import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding FedEx provider...');

    // Check if FedEx provider already exists
    const existingFedEx = await prisma.shipment_provider.findFirst({
      where: {
        name: 'FEDEX',
        is_deleted: false,
      },
    });

    if (!existingFedEx) {
      // Create FedEx provider
      await prisma.shipment_provider.create({
        data: {
          name: 'FEDEX',
          base_url: 'https://apis-sandbox.fedex.com',
          shipment_tracking_url:
            'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
          webhook_url: 'https://your-webhook-url.com/fedex/webhook',
          created_by: BigInt(1), // System user
        },
      });
      console.log('FedEx provider created successfully');
    } else {
      console.log('FedEx provider already exists');
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
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
