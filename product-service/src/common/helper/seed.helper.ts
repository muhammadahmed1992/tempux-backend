import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { HashidsService } from '../../hash-ids/hashids.service'; // Adjust path if necessary
import { SlugService } from '../../slug/slug.service'; // Adjust path if necessary
import { ConfigService } from '@nestjs/config';
import { GlobalConfigKeys } from '../../common/enums/global-config-keys';

function getRandomElement<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSerialNumber(): string {
  // Simple serial number generation (e.g., ABC-123456)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChars = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
  const randomNumbers = String(Math.floor(Math.random() * 1000000)).padStart(
    6,
    '0',
  );
  return `${randomChars}-${randomNumbers}`;
}

function generateReferenceNumber(): number {
  // Simple 6-digit reference number, ensures it's a number
  return getRandomInt(100000, 999999);
}

// --- SKU Specific Helper Functions ---

const getBrandCode = (brandTitle: string): string => {
  // Take first 3 letters, uppercase
  return brandTitle.substring(0, 3).toUpperCase();
};

const getCategoryCode = (categoryTitle: string): string => {
  // Map common categories to 3-letter codes
  const upperCaseCategory = categoryTitle.toUpperCase();
  if (upperCaseCategory.includes('DIVE')) return 'DVR';
  if (upperCaseCategory.includes('PILOT')) return 'PLT';
  if (upperCaseCategory.includes('CHRONOGRAPH')) return 'CHN';
  if (upperCaseCategory.includes('DRESS')) return 'DRS';
  if (upperCaseCategory.includes('SMARTWATCH')) return 'SMW';
  if (upperCaseCategory.includes('FIELD')) return 'FLD';
  if (upperCaseCategory.includes('LUXURY')) return 'LUX';
  if (upperCaseCategory.includes('DIGITAL')) return 'DGT';
  return 'GEN'; // Generic fallback if no specific match
};

const getColorCode = (colorName: string): string => {
  // Map common colors to 2-letter codes
  const lowerCaseColor = colorName.toLowerCase();
  if (lowerCaseColor.includes('stainless steel')) return 'SS';
  if (lowerCaseColor.includes('black')) return 'BK';
  if (lowerCaseColor.includes('white')) return 'WH';
  if (lowerCaseColor.includes('gold')) return 'GD'; // Covers Yellow Gold, Rose Gold, White Gold
  if (lowerCaseColor.includes('silver')) return 'SV';
  if (lowerCaseColor.includes('blue')) return 'BL';
  if (lowerCaseColor.includes('green')) return 'GR';
  if (lowerCaseColor.includes('red')) return 'RD';
  if (lowerCaseColor.includes('brown')) return 'BR';
  if (lowerCaseColor.includes('ceramic')) return 'CE';
  if (lowerCaseColor.includes('titanium')) return 'TI';
  if (lowerCaseColor.includes('bronze')) return 'BZ';
  return 'OT'; // Other/Unknown
};

const getSizeCode = (sizeValue: number): string => {
  // Converts a number (e.g., 40, 42.5) to a 2-character string.
  // For simplicity and 2-char limit, we'll round and take last two digits.
  // If sizes are always integers (e.g., 38, 40, 42, 44), this is fine.
  // For 42.5, it will become '43'. If precision is needed, a 3-char code might be required.
  const roundedSize = Math.round(sizeValue);
  return String(roundedSize).padStart(2, '0').slice(-2); // Ensure 2 digits (e.g., "08", "42")
};

const generateSku = (
  brandTitle: string,
  categoryTitle: string,
  productReferenceNumber: number, // Full reference number (e.g., 123456)
  mainColorName: string,
  sizeValue: number,
  productionYear: number,
): string => {
  const brandCode = getBrandCode(brandTitle); // 3 chars
  const categoryCode = getCategoryCode(categoryTitle); // 3 chars
  // Take last 4 digits of the product's reference number
  const productRefSnippet = String(productReferenceNumber)
    .padStart(6, '0')
    .slice(-4); // 4 chars
  const colorCode = getColorCode(mainColorName); // 2 chars
  const sizeCode = getSizeCode(sizeValue); // 2 chars
  const yearCode = String(productionYear).slice(-2); // Last 2 digits of year (2 chars)

  // Format: BRAND-CAT-REF4-CLR-SZ-YY (3+1+3+1+4+1+2+1+2+1+2 = 20 characters)
  return `${brandCode}-${categoryCode}-${productRefSnippet}-${colorCode}-${sizeCode}-${yearCode}`;
};

export default class SeedHelper {
  private hashidsService!: HashidsService;
  private readonly slugService: SlugService;

  constructor(private prisma: PrismaClient) {
    // Initialize services here within the constructor
    this.slugService = new SlugService();
  }

  /**
   * Orchestrates the entire seeding process using upsert logic.
   * All operations are wrapped in a transaction to ensure atomicity.
   * @param userId The ID of the user performing the seeding (required for created_by fields).
   * @param numberOfProducts Target number of products to create (default 450).
   */
  async seedAllData(userId: string, numberOfProducts = 450): Promise<void> {
    const creatorId = BigInt(userId);
    const configService = new ConfigService();

    const hashidsService = new HashidsService(configService);
    hashidsService.onModuleInit();
    this.hashidsService = hashidsService;
    console.log('Starting extensive data seeding with upsert logic...');

    try {
      await this.prisma.$transaction(
        async (tx: any) => {
          // Seed global configuration
          await this.seedGlobalConfiguration(creatorId, tx);

          const ifSeedRun = await tx.globalConfiguration.findFirst({
            where: {
              key: 'SEED_SCRIPT_RUN',
            },
          });
          if (Number(ifSeedRun?.value) === 1) {
            // Seed base data
            await this.seedColors(creatorId, tx);
            await this.seedSizes(creatorId, tx);
            await this.seedBrands(creatorId, tx);
            await this.seedModels(creatorId, tx);
            await this.seedCategories(creatorId, tx);
            await this.seedMovements(creatorId, tx);
            await this.seedGenders(creatorId, tx);
            await this.seedCurrenciesAndTaxes(creatorId, tx);

            // Seed products and items (these must exist for dependent models)
            // await this.seedProductsAndItems(creatorId, numberOfProducts, tx);

            // Seed related media and user-generated content after products/items are ready
            await this.seedOwnershipProofs(creatorId, tx);
            await this.seedSignOfWears(creatorId, tx);
            await this.seedProductImages(creatorId, tx);
            await this.seedTags(creatorId, tx); // Seed tags before product_tags
            await this.seedProductTags(creatorId, tx);
            await this.seedReviewsAndRatings(creatorId, tx); // Seed after products exist
            await this.seedFavorites(creatorId, tx); // Seed after products/items exist
          } else {
            console.log(
              `Seed doesn't run as per its configuration (SEED_SCRIPT_RUN is not 1).`,
            );
          }
        },
        {
          timeout: 600000, // 10 minutes timeout for the entire transaction
        },
      );
      console.log('Extensive data seeding completed successfully!');
    } catch (error) {
      console.error(
        'Extensive data seeding failed and was rolled back:',
        error,
      );
      throw error; // Re-throw to indicate overall failure
    }
  }

  private async seedColors(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('Seeding colors (upserting)...');
    const colorsData = [
      {
        name: 'Silver',
        colorCode: '#C0C0C0',
        description: 'Classic metal finish'.substring(0, 14),
      },
      {
        name: 'Gold',
        colorCode: '#FFD700',
        description: 'Luxurious yellow gold'.substring(0, 14),
      },
      {
        name: 'Black',
        colorCode: '#000000',
        description: 'Deep black finish'.substring(0, 14),
      },
      {
        name: 'White',
        colorCode: '#FFFFFF',
        description: 'Pristine white'.substring(0, 14),
      },
      {
        name: 'Rose Gold',
        colorCode: '#B76E79',
        description: 'Warm pinkish gold'.substring(0, 14),
      },
      {
        name: 'Blue',
        colorCode: '#0000FF',
        description: 'Vibrant blue'.substring(0, 14),
      },
      {
        name: 'Navy Blue',
        colorCode: '#000080',
        description: 'Dark, deep blue'.substring(0, 14),
      },
      {
        name: 'Green',
        colorCode: '#008000',
        description: 'Standard green'.substring(0, 14),
      },
      {
        name: 'Forest Green',
        colorCode: '#228B22',
        description: 'Deep forest green'.substring(0, 14),
      },
      {
        name: 'Red',
        colorCode: '#FF0000',
        description: 'Bright red'.substring(0, 14),
      },
      {
        name: 'Burgundy',
        colorCode: '#800020',
        description: 'Rich deep red'.substring(0, 14),
      },
      {
        name: 'Gray',
        colorCode: '#808080',
        description: 'Neutral gray'.substring(0, 14),
      },
      {
        name: 'Charcoal Gray',
        colorCode: '#36454F',
        description: 'Dark matte gray'.substring(0, 14),
      },
      {
        name: 'Bronze',
        colorCode: '#CD7F32',
        description: 'Earthy brown-orange'.substring(0, 14),
      },
      {
        name: 'Brown',
        colorCode: '#A52A2A',
        description: 'Classic brown'.substring(0, 14),
      },
      {
        name: 'Titanium',
        colorCode: '#878A8F',
        description: 'Matte gray titanium'.substring(0, 14),
      },
      {
        name: 'Ceramic Black',
        colorCode: '#080808',
        description: 'Scratch-resistant black ceramic'.substring(0, 14),
      },
    ];

    for (const data of colorsData) {
      await tx.color.upsert({
        where: { name: data.name },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${colorsData.length} colors.`);
  }

  private async seedSizes(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('Seeding sizes (upserting) with MM units...');
    // Generating common watch case sizes in MM, ensuring all have widthUnit and heightUnit
    const sizesData = [
      { caseWidth: 28, caseHeight: 28, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 30, caseHeight: 30, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 32, caseHeight: 32, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 34, caseHeight: 34, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 36, caseHeight: 36, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 37, caseHeight: 37, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 38, caseHeight: 38, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 39, caseHeight: 39, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 40, caseHeight: 40, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 41, caseHeight: 41, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 42, caseHeight: 42, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 43, caseHeight: 43, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 44, caseHeight: 44, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 45, caseHeight: 45, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 46, caseHeight: 46, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 47, caseHeight: 47, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 48, caseHeight: 48, widthUnit: 'MM', heightUnit: 'MM' },
      // Example of rectangular watch sizes, ensuring units are explicit
      { caseWidth: 25, caseHeight: 30, widthUnit: 'MM', heightUnit: 'MM' },
      { caseWidth: 30, caseHeight: 40, widthUnit: 'MM', heightUnit: 'MM' },
    ];

    for (const data of sizesData) {
      await tx.size.upsert({
        where: {
          caseWidth_caseHeight: {
            caseWidth: data.caseWidth,
            caseHeight: data.caseHeight,
          },
        },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${sizesData.length} sizes.`);
  }

  private async seedBrands(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('Seeding brands (upserting)...');
    const brandsData = [
      { title: 'Rolex', order: 1, image_url: 'https://example.com/rolex.png' },
      { title: 'Omega', order: 2, image_url: 'https://example.com/omega.png' },
      {
        title: 'Patek Philippe',
        order: 3,
        image_url: 'https://example.com/patek.png',
      },
      {
        title: 'Audemars Piguet',
        order: 4,
        image_url: 'https://example.com/ap.png',
      },
      {
        title: 'Vacheron Constantin',
        order: 5,
        image_url: 'https://example.com/vc.png',
      },
      {
        title: 'A. Lange & Söhne',
        order: 6,
        image_url: 'https://example.com/alangesohne.png',
      },
      {
        title: 'Jaeger-LeCoultre',
        order: 7,
        image_url: 'https://example.com/jlc.png',
      },
      {
        title: 'IWC Schaffhausen',
        order: 8,
        image_url: 'https://example.com/iwc.png',
      },
      {
        title: 'Breitling',
        order: 9,
        image_url: 'https://example.com/breitling.png',
      },
      {
        title: 'Zenith',
        order: 10,
        image_url: 'https://example.com/zenith.png',
      },
      {
        title: 'Blancpain',
        order: 11,
        image_url: 'https://example.com/blancpain.png',
      },
      {
        title: 'Cartier',
        order: 12,
        image_url: 'https://example.com/cartier.png',
      },
      {
        title: 'Longines',
        order: 13,
        image_url: 'https://example.com/longines.png',
      },
      {
        title: 'Tissot',
        order: 14,
        image_url: 'https://example.com/tissot.png',
      },
      {
        title: 'Hamilton',
        order: 15,
        image_url: 'https://example.com/hamilton.png',
      },
      { title: 'Oris', order: 16, image_url: 'https://example.com/oris.png' },
      {
        title: 'Citizen',
        order: 17,
        image_url: 'https://example.com/citizen.png',
      },
      { title: 'Seiko', order: 18, image_url: 'https://example.com/seiko.png' },
      { title: 'Casio', order: 19, image_url: 'https://example.com/casio.png' },
      {
        title: 'Fossil',
        order: 20,
        image_url: 'https://example.com/fossil.png',
      },
      { title: 'Timex', order: 21, image_url: 'https://example.com/timex.png' },
      {
        title: 'Swatch',
        order: 22,
        image_url: 'https://example.com/swatch.png',
      },
      {
        title: 'Grand Seiko',
        order: 23,
        image_url: 'https://example.com/grandseiko.png',
      },
    ];

    for (const data of brandsData) {
      await tx.brand.upsert({
        where: { title: data.title },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${brandsData.length} brands.`);
  }

  private async seedModels(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('Seeding models (upserting)...');

    // Get all brands to create models for
    const brands = await tx.brand.findMany({
      where: { is_deleted: false },
      select: { id: true, title: true },
    });

    const modelsData = [
      // Rolex models
      {
        title: 'Submariner',
        brand_id: 1,
        order: 1,
        image_url: 'https://example.com/models/submariner.png',
      },
      {
        title: 'Daytona',
        brand_id: 1,
        order: 2,
        image_url: 'https://example.com/models/daytona.png',
      },
      {
        title: 'GMT-Master',
        brand_id: 1,
        order: 3,
        image_url: 'https://example.com/models/gmt-master.png',
      },
      {
        title: 'Datejust',
        brand_id: 1,
        order: 4,
        image_url: 'https://example.com/models/datejust.png',
      },

      // Omega models
      {
        title: 'Speedmaster',
        brand_id: 2,
        order: 1,
        image_url: 'https://example.com/models/speedmaster.png',
      },
      {
        title: 'Seamaster',
        brand_id: 2,
        order: 2,
        image_url: 'https://example.com/models/seamaster.png',
      },
      {
        title: 'Constellation',
        brand_id: 2,
        order: 3,
        image_url: 'https://example.com/models/constellation.png',
      },

      // Patek Philippe models
      {
        title: 'Nautilus',
        brand_id: 3,
        order: 1,
        image_url: 'https://example.com/models/nautilus.png',
      },
      {
        title: 'Aquanaut',
        brand_id: 3,
        order: 2,
        image_url: 'https://example.com/models/aquanaut.png',
      },
      {
        title: 'Calatrava',
        brand_id: 3,
        order: 3,
        image_url: 'https://example.com/models/calatrava.png',
      },

      // Audemars Piguet models
      {
        title: 'Royal Oak',
        brand_id: 4,
        order: 1,
        image_url: 'https://example.com/models/royal-oak.png',
      },
      {
        title: 'Royal Oak Offshore',
        brand_id: 4,
        order: 2,
        image_url: 'https://example.com/models/royal-oak-offshore.png',
      },

      // Vacheron Constantin models
      {
        title: 'Overseas',
        brand_id: 5,
        order: 1,
        image_url: 'https://example.com/models/overseas.png',
      },
      {
        title: 'Fiftysix',
        brand_id: 5,
        order: 2,
        image_url: 'https://example.com/models/fiftysix.png',
      },

      // IWC models
      {
        title: 'Pilot',
        brand_id: 8,
        order: 1,
        image_url: 'https://example.com/models/pilot.png',
      },
      {
        title: 'Portuguese',
        brand_id: 8,
        order: 2,
        image_url: 'https://example.com/models/portuguese.png',
      },

      // Breitling models
      {
        title: 'Navitimer',
        brand_id: 9,
        order: 1,
        image_url: 'https://example.com/models/navitimer.png',
      },
      {
        title: 'Chronomat',
        brand_id: 9,
        order: 2,
        image_url: 'https://example.com/models/chronomat.png',
      },

      // Cartier models
      {
        title: 'Tank',
        brand_id: 12,
        order: 1,
        image_url: 'https://example.com/models/tank.png',
      },
      {
        title: 'Santos',
        brand_id: 12,
        order: 2,
        image_url: 'https://example.com/models/santos.png',
      },
      {
        title: 'Ballon Bleu',
        brand_id: 12,
        order: 3,
        image_url: 'https://example.com/models/ballon-bleu.png',
      },
    ];

    for (const data of modelsData) {
      await tx.model.upsert({
        where: {
          brand_id_title: {
            brand_id: data.brand_id,
            title: data.title,
          },
        },
        update: {
          order: data.order,
          image_url: data.image_url,
          updated_by: creatorId,
        },
        create: {
          title: data.title,
          brand_id: data.brand_id,
          order: data.order,
          image_url: data.image_url,
          created_by: creatorId,
        },
      });
    }
    console.log(`Seeded ${modelsData.length} models.`);
  }

  private async seedCategories(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding categories (upserting)...');
    const categoriesData = [
      {
        title: 'Luxury Watches',
        order: 1,
        image_url: 'https://example.com/cat_luxury.png',
      },
      {
        title: 'Sports Watches',
        order: 2,
        image_url: 'https://example.com/cat_sports.png',
      },
      {
        title: 'Smartwatches',
        order: 3,
        image_url: 'https://example.com/cat_smart.png',
      },
      {
        title: 'Dress Watches',
        order: 4,
        image_url: 'https://example.com/cat_dress.png',
      },
      {
        title: 'Dive Watches',
        order: 5,
        image_url: 'https://example.com/cat_dive.png',
      },
      {
        title: 'Pilot Watches',
        order: 6,
        image_url: 'https://example.com/cat_pilot.png',
      },
      {
        title: 'Field Watches',
        order: 7,
        image_url: 'https://example.com/cat_field.png',
      },
      {
        title: 'Chronographs',
        order: 8,
        image_url: 'https://example.com/cat_chrono.png',
      },
      {
        title: 'GMT Watches',
        order: 9,
        image_url: 'https://example.com/cat_gmt.png',
      },
      {
        title: 'Fashion Watches',
        order: 10,
        image_url: 'https://example.com/cat_fashion.png',
      },
      {
        title: 'Digital Watches',
        order: 11,
        image_url: 'https://example.com/cat_digital.png',
      },
      {
        title: 'Skeleton Watches',
        order: 12,
        image_url: 'https://example.com/cat_skeleton.png',
      },
      {
        title: 'Complication Watches',
        order: 13,
        image_url: 'https://example.com/cat_complication.png',
      },
      {
        title: 'Vintage Watches',
        order: 14,
        image_url: 'https://example.com/cat_vintage.png',
      },
    ];

    for (const data of categoriesData) {
      await tx.category.upsert({
        where: { title: data.title },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${categoriesData.length} categories.`);
  }

  private async seedMovements(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding movements (upserting)...');
    const movementsData = [
      { title: 'Automatic' },
      { title: 'Quartz' },
      { title: 'Manual Wind' },
      { title: 'Smartwatch' },
      { title: 'Solar-Powered' },
      { title: 'Kinetic' },
      { title: 'Spring Drive' },
    ];

    for (const data of movementsData) {
      await tx.movement.upsert({
        where: { title: data.title },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${movementsData.length} movements.`);
  }

  private async seedGenders(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding genders (upserting)...');
    const gendersData = [
      {
        title: "Men's",
        order: 1,
        image_url: 'https://example.com/gender_mens.png',
      },
      {
        title: "Women's",
        order: 2,
        image_url: 'https://example.com/gender_womens.png',
      },
      {
        title: 'Unisex',
        order: 3,
        image_url: 'https://example.com/gender_unisex.png',
      },
    ];
    for (const data of gendersData) {
      await tx.gender.upsert({
        where: { title: data.title },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${gendersData.length} genders.`);
  }

  private async seedCurrenciesAndTaxes(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding currencies and tax rules (upserting)...');
    await tx.currency_exchange.upsert({
      where: { curr: '$' },
      update: {
        description: 'United States Dollar',
        exchangeRate: new Decimal(1.0),
        updated_by: creatorId,
      },
      create: {
        curr: '$',
        description: 'United States Dollar',
        exchangeRate: new Decimal(1.0),
        created_by: creatorId,
      },
    });
    await tx.currency_exchange.upsert({
      where: { curr: 'RP' },
      update: {
        description: 'Pakistani Rupee',
        exchangeRate: new Decimal(278.0),
        updated_by: creatorId,
        is_deleted: true,
      },
      create: {
        curr: 'RP',
        description: 'Pakistani Rupee',
        exchangeRate: new Decimal(278.0),
        created_by: creatorId,
        is_deleted: true,
      },
    });

    await tx.tax_rule.upsert({
      where: { description: 'Standard Sales Tax (10%)' },
      update: { taxRate: new Decimal(0.1), updated_by: creatorId },
      create: {
        taxRate: new Decimal(0.1),
        description: 'Standard Sales Tax (10%)',
        created_by: creatorId,
      },
    });
    await tx.tax_rule.upsert({
      where: { description: 'Luxury Goods Tax (20%)' },
      update: { taxRate: new Decimal(0.2), updated_by: creatorId },
      create: {
        taxRate: new Decimal(0.2),
        description: 'Luxury Goods Tax (20%)',
        created_by: creatorId,
      },
    });
    await tx.tax_rule.upsert({
      where: { description: 'No Tax' },
      update: { taxRate: new Decimal(0.0), updated_by: creatorId },
      create: {
        taxRate: new Decimal(0.0),
        description: 'No Tax',
        created_by: creatorId,
      },
    });
    console.log('Currencies and Tax Rules seeded.');
  }

  private async seedProductsAndItems(
    creatorId: bigint,
    numberOfProducts: number,
    tx: PrismaClient, // Use the transactional client
  ): Promise<void> {
    console.log(`Attempting to seed up to ${numberOfProducts} products...`);

    const allColors = await tx.color.findMany();
    const allSizes = await tx.size.findMany();
    const allBrands = await tx.brand.findMany();
    const allCategories = await tx.category.findMany();
    const allMovements = await tx.movement.findMany();
    const allGenders = await tx.gender.findMany();
    const defaultCurrency = await tx.currency_exchange.findUnique({
      where: { curr: '$' },
    });
    const standardTax = await tx.tax_rule.findUnique({
      where: { description: 'Standard Sales Tax (10%)' },
    });
    const luxuryTax = await tx.tax_rule.findUnique({
      where: { description: 'Luxury Goods Tax (20%)' },
    });

    if (
      !defaultCurrency ||
      !standardTax ||
      !luxuryTax ||
      allBrands.length === 0 ||
      allCategories.length === 0 ||
      allMovements.length === 0 ||
      allColors.length === 0 ||
      allSizes.length === 0 ||
      allGenders.length === 0
    ) {
      console.error(
        'Missing required base data (currency, tax, or lookup entities like brands, categories, movements, colors, sizes, types) for product item seeding. Please ensure they are seeded.',
      );
      return;
    }

    const getNameSuffix = (categoryTitle: string) => {
      if (categoryTitle.includes('Dive')) return 'Pro Diver';
      if (categoryTitle.includes('Pilot')) return 'Pilot Chrono';
      if (categoryTitle.includes('Chronograph')) return 'Racing';
      if (categoryTitle.includes('Dress')) return 'Elegance';
      if (categoryTitle.includes('Smartwatch')) return 'Connect';
      if (categoryTitle.includes('Field')) return 'Explorer';
      if (categoryTitle.includes('Luxury')) return 'Masterpiece';
      if (categoryTitle.includes('Digital')) return 'Digital';
      return 'Classic';
    };

    let productsCreated = 0;
    const existingReferenceNumbers = new Set(
      (
        await tx.product_items.findMany({ select: { reference_number: true } })
      ).map((p) => Number(p.reference_number)),
    );
    const existingSerialNumbers = new Set(
      (
        await tx.product_items.findMany({ select: { serial_number: true } })
      ).map((p) => p.serial_number),
    );
    const existingSkus = new Set(
      (await tx.product_items.findMany({ select: { sku: true } })).map(
        (pv) => pv.sku,
      ),
    );

    const MAX_GENERATION_ATTEMPTS = numberOfProducts * 10;
    let overallAttemptCount = 0;

    for (
      let i = 0;
      productsCreated < numberOfProducts &&
      overallAttemptCount < MAX_GENERATION_ATTEMPTS;
      i++
    ) {
      overallAttemptCount++;

      const brand = getRandomElement(allBrands);
      const category = getRandomElement(allCategories);
      const gender = getRandomElement(allGenders);

      if (!brand || !category || !gender) {
        console.warn(
          'Skipping product creation due to missing base data (brand, category, or type). This should not happen if initial checks pass.',
        );
        continue;
      }

      let basePrice: number;
      switch (brand.title) {
        case 'Patek Philippe':
        case 'Audemars Piguet':
        case 'Vacheron Constantin':
        case 'A. Lange & Söhne':
          basePrice = getRandomInt(40000, 250000);
          break;
        case 'Rolex':
        case 'Omega':
        case 'Jaeger-LeCoultre':
        case 'IWC Schaffhausen':
        case 'Breitling':
        case 'Zenith':
        case 'Blancpain':
        case 'Cartier':
        case 'Grand Seiko':
          basePrice = getRandomInt(5000, 40000);
          break;
        case 'Longines':
          basePrice = getRandomInt(1000, 4000);
          break;
        case 'Tissot':
        case 'Hamilton':
        case 'Oris':
          basePrice = getRandomInt(300, 1500);
          break;
        case 'Citizen':
        case 'Seiko':
          basePrice = getRandomInt(150, 800);
          break;
        case 'Casio':
        case 'Timex':
          basePrice = getRandomInt(50, 300);
          break;
        case 'Fossil':
        case 'Swatch':
          basePrice = getRandomInt(100, 400);
          break;
        default:
          basePrice = getRandomInt(200, 1000);
      }

      if (category.title.includes('Smartwatch'))
        basePrice = getRandomInt(150, 600);
      if (category.title.includes('Chronographs'))
        basePrice += getRandomInt(100, 500);
      if (category.title.includes('Complication'))
        basePrice += getRandomInt(1000, 10000);
      if (category.title.includes('Digital')) basePrice = getRandomInt(50, 250);

      const productNameSuffix = getNameSuffix(category.title);
      const productName = `${brand.title} ${productNameSuffix} ${getRandomInt(
        100,
        999,
      )}`;
      const productTitle = `${productName} | ${brand.title} Official Store`;
      const productDescription = `Discover the exquisite ${productName}. This premium ${category.title.toLowerCase()} from ${
        brand.title
      } embodies precision engineering and timeless design. A perfect blend of style and functionality for the discerning individual.`;

      let serialNumber: string;
      const MAX_SERIAL_ATTEMPTS = 50;
      let serialAttemptCount = 0;
      do {
        serialNumber = generateSerialNumber();
        serialAttemptCount++;
        if (serialAttemptCount > MAX_SERIAL_ATTEMPTS) {
          console.warn(
            `Could not generate unique serial number for product after ${MAX_SERIAL_ATTEMPTS} attempts. Skipping this product.`,
          );
          break;
        }
      } while (existingSerialNumbers.has(serialNumber));
      if (serialAttemptCount > MAX_SERIAL_ATTEMPTS) continue;

      let referenceNumber: number;
      let refAttemptCount = 0;
      do {
        referenceNumber = generateReferenceNumber();
        refAttemptCount++;
        if (refAttemptCount > MAX_SERIAL_ATTEMPTS) {
          console.warn(
            `Could not generate unique reference number for product after ${MAX_SERIAL_ATTEMPTS} attempts. Skipping this product.`,
          );
          break;
        }
      } while (existingReferenceNumbers.has(referenceNumber));
      if (refAttemptCount > MAX_SERIAL_ATTEMPTS) continue;

      existingSerialNumbers.add(serialNumber);
      existingReferenceNumbers.add(referenceNumber);

      const productionYear = getRandomInt(2010, 2024);

      // Generate product slug here for the initial create
      const initialProductSlug = this.slugService.generateSlug(
        `${productName} ${brand.title} ${category.title} ${gender.title}`,
      );

      let createdProduct;
      try {
        createdProduct = await tx.product.create({
          // Changed from upsert to create
          data: {
            // Data for the new product
            name: productName,
            description: productDescription,
            title: productTitle,
            brand_id: brand.id,
            category_id: category.id,
            gender_id: gender.id,
            is_accessory: false,
            created_by: creatorId,
            product_slug: initialProductSlug, // Use the generated slug
          },
          include: {
            // Include relations to get their names for accurate slug generation in the next step
            brand: true,
            category: true,
          },
        });
        productsCreated++;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          console.warn(
            `Product with serial number ${serialNumber} or reference number ${referenceNumber} already exists in DB. Retrying with a new one.`,
          );
          i--;
          continue;
        } else {
          console.error(`Error creating product ${productName}:`, error);
          throw error;
        }
      }

      // Generate product_public_id using the service after creation
      // and update the product. The product_slug will also be re-set here
      // to ensure consistency if any changes are made during the update phase.
      const productPublicId = this.hashidsService.encode(createdProduct.id);
      const productSlug = this.slugService.generateSlug(
        `${createdProduct.name} ${brand.title} ${category.title} ${gender.title}`,
      );

      // Update the newly created product with the generated values
      await tx.product.update({
        where: { id: createdProduct.id },
        data: {
          product_slug: productSlug,
        },
      });

      const numberOfItems = getRandomInt(1, 4);
      const usedItemCombos = new Set<string>();
      const MAX_VARIANT_ATTEMPTS = 10;

      // for (let j = 0; j < numberOfItems; j++) {
      //   let itemAttemptCount = 0;
      //   let mainColor, braceletColor, dialColor, size, movement;
      //   let itemSku;

      //   do {
      //     mainColor = getRandomElement(allColors);
      //     braceletColor = getRandomElement(allColors);
      //     dialColor = getRandomElement(allColors);
      //     size = getRandomElement(allSizes);
      //     const tempMovement = getRandomElement(allMovements);

      //     if (
      //       category.title.includes('Smartwatch') &&
      //       tempMovement?.title !== 'Smartwatch'
      //     ) {
      //       movement = allMovements.find((m) => m.title === 'Smartwatch');
      //     } else if (
      //       !category.title.includes('Smartwatch') &&
      //       tempMovement?.title === 'Smartwatch'
      //     ) {
      //       movement = getRandomElement(
      //         allMovements.filter((m) => m.title !== 'Smartwatch'),
      //       );
      //     } else {
      //       movement = tempMovement;
      //     }

      //     if (
      //       !mainColor ||
      //       !braceletColor ||
      //       !dialColor ||
      //       !size ||
      //       !movement
      //     ) {
      //       console.warn(
      //         `Incomplete data for item creation (color, size, or movement). Retrying item.`,
      //       );
      //       itemAttemptCount++;
      //       continue;
      //     }

      //     const comboKey = `${mainColor.id}-${braceletColor.id}-${dialColor.id}-${size.id}`;
      //     if (usedItemCombos.has(comboKey)) {
      //       itemAttemptCount++;
      //       continue;
      //     }

      //     // Use size.value directly as it's now numeric
      //     itemSku = generateSku(
      //       brand.title,
      //       category.title,
      //       Number(createdProduct.reference_number),
      //       mainColor.name,
      //       size.value, // Pass the numeric size value
      //       createdProduct.year_of_production,
      //     ).substring(0, 19);

      //     if (existingSkus.has(itemSku)) {
      //       itemAttemptCount++;
      //       continue;
      //     }

      //     break;
      //   } while (itemAttemptCount < MAX_VARIANT_ATTEMPTS);

      //   if (itemAttemptCount >= MAX_VARIANT_ATTEMPTS) {
      //     console.warn(
      //       `Could not create unique item for product ${createdProduct.id} after ${MAX_VARIANT_ATTEMPTS} attempts. Skipping this item.`,
      //     );
      //     continue;
      //   }

      //   usedItemCombos.add(
      //     `${mainColor!.id}-${braceletColor!.id}-${dialColor!.id}-${size!.id}`,
      //   );
      //   existingSkus.add(itemSku!);

      //   let itemPrice = basePrice + getRandomInt(-100, 500);
      //   if (
      //     mainColor!.name.includes('Gold') ||
      //     mainColor!.name.includes('Rose Gold')
      //   ) {
      //     itemPrice += getRandomInt(500, 5000);
      //   } else if (mainColor!.name.includes('Bronze')) {
      //     itemPrice += getRandomInt(100, 500);
      //   }

      //   let caseMaterial = 'Stainless Steel';
      //   let braceletMaterial = 'Stainless Steel';

      //   if (mainColor!.name.includes('Gold')) {
      //     caseMaterial = 'Gold';
      //     braceletMaterial = 'Gold';
      //   } else if (mainColor!.name.includes('Bronze')) {
      //     caseMaterial = 'Bronze';
      //   } else if (mainColor!.name.includes('Ceramic')) {
      //     caseMaterial = 'Ceramic';
      //     braceletMaterial = 'Ceramic';
      //   } else if (mainColor!.name.includes('Titanium')) {
      //     caseMaterial = 'Titanium';
      //     braceletMaterial = 'Titanium';
      //   }

      //   if (getRandomInt(0, 100) < 30) {
      //     if (getRandomInt(0, 1) === 0) {
      //       braceletMaterial = 'Leather';
      //       itemPrice -= getRandomInt(50, 200);
      //     } else {
      //       braceletMaterial = 'Rubber';
      //       itemPrice -= getRandomInt(20, 100);
      //     }
      //   }

      //   if (itemPrice < 50) itemPrice = 50;

      //   const brandSlug = this.slugService.generateSlug(brand.title);
      //   const categorySlug = this.slugService.generateSlug(category.title);
      //   const mainColorSlug = this.slugService.generateSlug(mainColor!.name);
      //   const sizeSlug = String(size!.caseWidth)
      //     .replace('.', '-')
      //     .toLowerCase(); // Use numeric size for slug

      //   const baseImageUrl = `https://images.watchstore.com/watches/${brandSlug}-${categorySlug}-${mainColorSlug}-${sizeSlug}.jpg`;

      //   try {
      //     const createdProductItem = await tx.product_items.upsert({
      //       where: { sku: itemSku! },
      //       update: {
      //         updated_by: creatorId,
      //         quantity: getRandomInt(1, 20),
      //         base_image_url: baseImageUrl,
      //         sku: itemSku!,
      //       },
      //       create: {
      //         product_id: createdProduct.id,
      //         color_id: mainColor!.id,
      //         bracelet_color_id: braceletColor!.id,
      //         dial_color_id: dialColor!.id,
      //         size_id: size!.id,
      //         movement_id: movement!.id,
      //         price: new Decimal(itemPrice),
      //         discount: j % 3 == 0 ? 10 : 24,
      //         cost_price: new Decimal(itemPrice * 0.7),
      //         quantity: getRandomInt(1, 20),
      //         original_box_and_paper: getRandomInt(0, 1) === 1,
      //         original_box: getRandomInt(0, 1) === 1,
      //         original_paper: getRandomInt(0, 1) === 1,
      //         accessories: getRandomInt(0, 1) === 1,
      //         case_material_id: caseMaterial,
      //         bracelet_material_id: braceletMaterial,
      //         currency_id: defaultCurrency.id,
      //         tax_rule_id:
      //           category.title.includes('Luxury') || basePrice > 5000
      //             ? luxuryTax.id
      //             : standardTax.id,
      //         created_by: creatorId,
      //         base_image_url: baseImageUrl,
      //         sku: itemSku!,
      //       },
      //       include: {
      //         case_material,
      //       }
      //     });
      //   } catch (error) {
      //     if (
      //       error instanceof Prisma.PrismaClientKnownRequestError &&
      //       error.code === 'P2002' &&
      //       error.meta?.target === 'sku'
      //     ) {
      //       console.warn(
      //         `SKU ${itemSku} already exists in DB. Retrying this item.`,
      //       );
      //       j--;
      //       existingSkus.delete(itemSku!);
      //       continue;
      //     }
      //     console.error(
      //       `Error upserting product item for product ${createdProduct.id} (Color: ${mainColor?.name}, Size: ${size?.value}mm):`,
      //       error,
      //     );
      //     throw error;
      //   }
      // }
    }
    console.log(`Seeded ${productsCreated} new products and their items.`);
  }

  // --- NEW SEEDING METHODS FOR THE MISSED MODELS ---

  private async seedOwnershipProofs(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding ownership proofs...');
    const products = await tx.product.findMany({ select: { id: true } });
    const productItems = await tx.product_items.findMany({
      select: { id: true, product_id: true },
    });

    if (products.length === 0 || productItems.length === 0) {
      console.warn(
        'No products or product items found to attach ownership proofs. Skipping.',
      );
      return;
    }

    const maxProofsPerItem = 2; // Max number of proofs per product item
    const proofsCreated = new Set<string>(); // To track unique product_id, product_item_id combos

    for (const item of productItems) {
      // Check if we already created a proof for this item based on your unique constraint
      if (proofsCreated.has(`${item.product_id}-${item.id}`)) {
        continue;
      }

      const numProofs = getRandomInt(0, maxProofsPerItem); // 0, 1, or 2 proofs
      // Due to the unique constraint `@@unique([product_id, product_item_id])`,
      // we can only successfully `create` one entry per item.
      // If `numProofs` is > 1, subsequent attempts for the same item will fail/warn.
      // The loop will effectively create at most one proof per item.
      for (let i = 0; i < numProofs; i++) {
        const imageUrl = `https://picsum.photos/id/${getRandomInt(
          100,
          200,
        )}/600/400`;
        const altText = `Proof image for product item ${item.id}`;

        try {
          await tx.ownership_proof.upsert({
            where: {
              product_id_product_item_id: {
                product_id: item.product_id,
                product_item_id: item.id,
              },
            },
            update: {
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1, // This `order` might not be unique if only one entry is created
              updated_by: creatorId,
            },
            create: {
              product_id: item.product_id,
              product_item_id: item.id,
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1,
              created_by: creatorId,
            },
          });
          proofsCreated.add(`${item.product_id}-${item.id}`); // Mark combo as used
          // If upsert successful, and we only want one per unique constraint, break here
          break;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            console.warn(
              `Ownership proof for product item ${item.id} already exists (unique constraint). Skipping further proofs for this item.`,
            );
            break; // Stop trying to add more for this item if unique constraint hit
          } else {
            console.error(
              `Error seeding ownership proof for item ${item.id}:`,
              error,
            );
            throw error;
          }
        }
      }
    }
    console.log(`Seeded ${proofsCreated.size} ownership proofs.`);
  }

  private async seedSignOfWears(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding signs of wear...');
    const products = await tx.product.findMany({ select: { id: true } });
    const productItems = await tx.product_items.findMany({
      select: { id: true, product_id: true },
    });

    if (products.length === 0 || productItems.length === 0) {
      console.warn(
        'No products or product items found to attach signs of wear. Skipping.',
      );
      return;
    }

    const maxSignsPerItem = 3; // Max number of signs of wear per product item
    const signsCreated = new Set<string>(); // To track unique product_id, product_item_id combos

    for (const item of productItems) {
      // Check if we already created a sign of wear for this item based on your unique constraint
      if (signsCreated.has(`${item.product_id}-${item.id}`)) {
        continue;
      }

      const numSigns = getRandomInt(0, maxSignsPerItem); // 0 to 3 signs
      // Similar to ownership proofs, due to the unique constraint, only one entry will be created.
      for (let i = 0; i < numSigns; i++) {
        const imageUrl = `https://picsum.photos/id/${getRandomInt(
          200,
          300,
        )}/600/400`;
        const altText = `Sign of wear image for product item ${item.id}`;

        try {
          await tx.sign_of_wear.upsert({
            where: {
              product_id_product_item_id: {
                product_id: item.product_id,
                product_item_id: item.id,
              },
            },
            update: {
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1, // This `order` might not be unique if only one entry is created
              updated_by: creatorId,
            },
            create: {
              product_id: item.product_id,
              product_item_id: item.id,
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1,
              created_by: creatorId,
            },
          });
          signsCreated.add(`${item.product_id}-${item.id}`); // Mark combo as used
          break; // Stop trying to add more for this item if unique constraint hit
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            console.warn(
              `Sign of wear for product item ${item.id} already exists (unique constraint). Skipping further signs for this item.`,
            );
            break;
          } else {
            console.error(
              `Error seeding sign of wear for item ${item.id}:`,
              error,
            );
            throw error;
          }
        }
      }
    }
    console.log(`Seeded ${signsCreated.size} signs of wear.`);
  }

  private async seedProductImages(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding product images...');
    const productItems = await tx.product_items.findMany({
      select: { id: true, color_id: true, size_id: true },
    });

    if (productItems.length === 0) {
      console.warn('No product items found to attach images. Skipping.');
      return;
    }

    let imagesCreatedCount = 0;
    const maxImagesPerItem = 5;

    for (const item of productItems) {
      const numImages = getRandomInt(1, maxImagesPerItem); // At least 1 image per item

      for (let i = 0; i < numImages; i++) {
        const imgUrl = `https://picsum.photos/id/${getRandomInt(
          1,
          100,
        )}/800/600?random=${item.id}-${i}`;
        const altText = `Image ${i + 1} for item ${item.id}`;

        try {
          // product_images doesn't have a unique constraint on product_item_id + img_url,
          // so we can add multiple images per item.
          await tx.product_images.create({
            data: {
              img_url: imgUrl,
              alt_text: altText,
              order: i + 1,
              color_id: item.color_id, // Link to item's color
              size_id: item.size_id, // Link to item's size
              product_item_id: item.id,
              created_by: creatorId,
            },
          });
          imagesCreatedCount++;
        } catch (error) {
          console.error(
            `Error seeding product image for item ${item.id}:`,
            error,
          );
          throw error;
        }
      }
    }
    console.log(`Seeded ${imagesCreatedCount} product images.`);
  }

  private async seedReviewsAndRatings(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding reviews and ratings...');
    const products = await tx.product.findMany({
      select: { id: true, name: true },
    });
    // For `reviewedBy`, assuming `creatorId` can act as a user ID for seeding purposes.
    // In a real app, you'd fetch actual user IDs.

    if (products.length === 0) {
      console.warn('No products found to add reviews to. Skipping.');
      return;
    }

    const reviewsAdded = new Set<string>(); // To track unique [product_id, reviewedBy] combos
    let reviewsCount = 0;

    for (const product of products) {
      const numReviews = getRandomInt(0, 3); // 0 to 3 reviews per product

      for (let i = 0; i < numReviews; i++) {
        const reviewText = `This ${product.name} is absolutely amazing! The quality is superb.`;
        const ratings = getRandomInt(3, 5); // Ratings from 3 to 5 stars

        // The unique constraint is on [product_id, reviewedBy].
        // To ensure uniqueness, we'll try to upsert with a fixed reviewedBy (creatorId).
        // If we want multiple reviews per product by different users, we'd need to mock more user IDs.
        const comboKey = `${product.id}-${creatorId}`;
        if (reviewsAdded.has(comboKey)) {
          continue; // Skip if this product already has a review by creatorId
        }

        try {
          await tx.reviews_ratings.upsert({
            where: {
              product_id_reviewedBy: {
                product_id: product.id,
                reviewedBy: creatorId,
              },
            },
            update: {
              review: reviewText,
              ratings: ratings,
              updated_by: creatorId,
            },
            create: {
              product_id: product.id,
              review: reviewText,
              ratings: ratings,
              reviewedBy: creatorId,
              created_by: creatorId,
            },
          });
          reviewsAdded.add(comboKey);
          reviewsCount++;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            console.warn(
              `Review for product ${product.id} by user ${creatorId} already exists. Skipping duplicate.`,
            );
          } else {
            console.error(
              `Error seeding review for product ${product.id}:`,
              error,
            );
            throw error;
          }
        }
      }
    }
    console.log(`Seeded ${reviewsCount} reviews and ratings.`);
  }

  private async seedFavorites(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding favorites...');
    // For `user_id`, assuming `creatorId` can act as a user ID for seeding purposes.
    const products = await tx.product.findMany({ select: { id: true } });
    const productItems = await tx.product_items.findMany({
      select: { id: true, product_id: true },
    });

    if (products.length === 0 || productItems.length === 0) {
      console.warn(
        'No products or product items found for favorites. Skipping.',
      );
      return;
    }

    const favoritesAdded = new Set<string>(); // To track unique [user_id, product_id, product_item_id]
    let favoritesCount = 0;

    // Pick a random subset of product items to mark as favorite
    const itemsToFavorite = getRandomInt(1, Math.min(50, productItems.length));

    for (let i = 0; i < itemsToFavorite; i++) {
      const item = getRandomElement(productItems);
      if (!item) continue;

      const comboKey = `${creatorId}-${item.product_id}-${item.id}`;
      if (favoritesAdded.has(comboKey)) {
        i--; // Retry if this combo already exists
        continue;
      }

      try {
        await tx.favorite.upsert({
          where: {
            user_id_product_id_product_item_id: {
              user_id: creatorId,
              product_id: item.product_id,
              product_item_id: item.id,
            },
          },
          update: { updated_by: creatorId },
          create: {
            user_id: creatorId,
            product_id: item.product_id,
            product_item_id: item.id,
            created_by: creatorId,
          },
        });
        favoritesAdded.add(comboKey);
        favoritesCount++;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          console.warn(
            `Favorite for user ${creatorId}, product ${item.product_id}, item ${item.id} already exists. Skipping duplicate.`,
          );
        } else {
          console.error(`Error seeding favorite:`, error);
          throw error;
        }
      }
    }
    console.log(`Seeded ${favoritesCount} favorites.`);
  }

  private async seedTags(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('Seeding tags...');
    const tagsData = [
      {
        key: 'New_Arrival',
        title: 'New Arrival',
        description: 'Recently added to stock',
      },
      {
        key: 'POPULAR',
        title: 'POPULAR',
        description: 'Our most popular products',
      },
      {
        key: 'Best_Seller',
        title: 'Best Seller',
        description: 'Our most sold products',
      },
    ];

    for (const data of tagsData) {
      await tx.tags.upsert({
        where: { title: data.title },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${tagsData.length} tags.`);
  }

  private async seedProductTags(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('Seeding product tags...');
    // FYI: External job is implemented for this purpose.
    console.log('Product not seeded. Now job is implemented to sync data');
  }

  private async seedGlobalConfiguration(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    try {
      console.log(`Seeding GlobalConfiguration...`);

      // Add (or update) the 'PRODUCT_VIEWERSHIP_LAST_SEEN' configuration
      await tx.globalConfiguration.upsert({
        where: {
          key: GlobalConfigKeys.PRODUCT_VIEWERSHIP_LAST_SEEN,
        },
        update: {
          value: await this.getAnalyticsWindowHours(), // Dynamic value for analytics window
          updated_at: new Date(),
          updated_by: creatorId,
        },
        create: {
          key: GlobalConfigKeys.PRODUCT_VIEWERSHIP_LAST_SEEN,
          value: await this.getAnalyticsWindowHours(),
          created_at: new Date(),
          created_by: creatorId,
        },
      });

      // Add (or update) the 'NEW_ARRIVAL' configuration
      await tx.globalConfiguration.upsert({
        where: {
          key: GlobalConfigKeys.NEW_ARRIVAL,
        },
        update: {
          value: 7, // Products created in last 7-Days
          updated_at: new Date(),
          updated_by: creatorId,
        },
        create: {
          key: GlobalConfigKeys.NEW_ARRIVAL,
          value: 7, // Products created in last 7-Days.
          created_at: new Date(),
          created_by: creatorId,
        },
      });

      // Add (or update) the 'POPULAR' configuration
      await tx.globalConfiguration.upsert({
        where: {
          key: GlobalConfigKeys.POPULAR,
        },
        update: {
          value: 15, // select top 10 Product most viewed in last 15 days,
          updated_at: new Date(),
          updated_by: creatorId,
        },
        create: {
          key: GlobalConfigKeys.POPULAR,
          value: 15, // select top 10 Product most viewed in last 15 days,
          created_at: new Date(),
          created_by: creatorId,
        },
      });

      // Add (or update) the 'BEST_SELLER' configuration
      await tx.globalConfiguration.upsert({
        where: {
          key: GlobalConfigKeys.BEST_SELLER,
        },
        update: {
          value: 10, // select top 10 max products sold in last 10 days
          updated_at: new Date(),
          updated_by: creatorId,
        },
        create: {
          key: GlobalConfigKeys.BEST_SELLER,
          value: 10, // select top 10 max products sold in last 10 days
          created_at: new Date(),
          created_by: creatorId,
        },
      });

      // Add (or update) the 'SEED_SCRIPT_RUN' configuration
      await tx.globalConfiguration.upsert({
        where: {
          key: GlobalConfigKeys.SEED_SCRIPT_RUN,
        },
        update: {
          value: await this.getSeedScriptRunFlag(), // Always set to '1' to ensure seed runs on subsequent executions
          updated_at: new Date(),
          updated_by: creatorId,
        },
        create: {
          key: GlobalConfigKeys.SEED_SCRIPT_RUN,
          value: 1, // Default set to '1' so that it will get executed.
          created_at: new Date(),
          created_by: creatorId,
        },
      });

      // Add (or update) the 'PLATFORM_COMMISSION' configuration
      await tx.globalConfiguration.upsert({
        where: {
          key: GlobalConfigKeys.PLATFORM_COMMISSION,
        },
        update: {
          value: 6.5,
          updated_at: new Date(),
          updated_by: creatorId, // Always set to '1' to ensure seed runs on subsequent executions
        },
        create: {
          key: GlobalConfigKeys.PLATFORM_COMMISSION,
          value: 6.5,
          created_at: new Date(),
          created_by: creatorId, // Default set to '1' so that it will get executed.
        },
      });
      console.log(`GlobalConfiguration seeded.`);
      console.log(`Seeding finished.`);
    } catch (error) {
      console.error(`Error seeding global configuration: `, error);
      throw error;
    }
  }

  // Helper method for getting analytics window hours (though it's seeded now)
  async getAnalyticsWindowHours(): Promise<number> {
    const config = await this.prisma.globalConfiguration.findUnique({
      where: { key: 'PRODUCT_VIEWERSHIP_LAST_SEEN' },
    });

    // Default to '48' if not found or invalid
    return config ? Number(config.value) : 48;
  }

  // Helper method for getting seed script run flag (though it's seeded now)
  async getSeedScriptRunFlag(): Promise<number> {
    const config = await this.prisma.globalConfiguration.findUnique({
      where: { key: 'SEED_SCRIPT_RUN' },
    });
    return config ? Number(config.value) : 1; // Default to '0' if not found
  }
}
