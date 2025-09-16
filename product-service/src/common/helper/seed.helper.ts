import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { HashidsService } from '../../hash-ids/hashids.service';
import { SlugService } from '../../slug/slug.service';
import { ConfigService } from '@nestjs/config';
import { GlobalConfigKeys } from '../../common/enums/global-config-keys';
import { AppLoggerService } from '@Common/logging';

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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

function generateReferenceNumber(): string {
  const prefixes = ['REF-', 'WR-', 'MT-', 'CL-', 'DX-'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const alphanumeric = Array.from(
    { length: 6 },
    () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)],
  ).join('');
  return `${prefix}${alphanumeric}`;
}

function generateSku(): string {
  return Array.from(
    { length: 10 },
    () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)],
  ).join('');
}

// Predefined data for seeding
const predefinedCategories = [
  'Watch',
  'Bracelet/Strap',
  'Case',
  'Bezel',
  'Buckle',
  'Books/Calendar',
  'Box',
  'Crown/Pusher',
  'Cleaning',
  'Dial',
  'Hand(s)',
  'Movement (Complete)',
  'Movement (Parts)',
  'Link/Bar',
  'Other',
  'Watch Winders',
  'Glass/Crystal',
  'Tools',
];

const predefinedAttributes = [
  'reference_number',
  'serial_number',
  'caliber_movement',
  'clasp_type',
  'functions',
  'crystal_type',
  'dial_color',
  'clasp_material',
  'bezel_material',
  'case_diameter',
  'lug_width',
  'water_resistance',
  'power_reserve',
  'case_thickness',
  'weight',
  'condition',
  'inclusions',
  'buckle_width',
  'bracelet_length_long_side',
  'braclet_length_short_side',
  'bracelet_thickness',
  'movement',
  'base_caliber',
  'frequency',
  'number_of_jewels',
];

const attributeCategoryMappings = [
  {
    category: 'Watch',
    attributes: [
      'serial_number',
      'caliber_movement',
      'dial_color',
      'case_diameter',
    ],
  },
  {
    category: 'Bracelet/Strap',
    attributes: ['reference_number', 'lug_width', 'condition'],
  },
  {
    category: 'Case',
    attributes: ['reference_number', 'case_diameter', 'condition'],
  },
  {
    category: 'Bezel',
    attributes: [
      'reference_number',
      'bezel_material',
      'case_diameter',
      'condition',
    ],
  },
  {
    category: 'Buckle',
    attributes: [
      'reference_number',
      'clasp_type',
      'clasp_material',
      'lug_width',
    ],
  },
  {
    category: 'Box',
    attributes: ['reference_number'],
  },
  {
    category: 'Crown/Pusher',
    attributes: ['reference_number', 'caliber_movement'],
  },
  {
    category: 'Dial',
    attributes: ['dial_color', 'case_diameter'],
  },
  {
    category: 'Hand(s)',
    attributes: ['reference_number', 'caliber_movement'],
  },
  {
    category: 'Movement (Complete)',
    attributes: ['reference_number', 'caliber_movement', 'power_reserve'],
  },
  {
    category: 'Movement (Parts)',
    attributes: ['reference_number', 'caliber_movement', 'power_reserve'],
  },
];

const predefinedMovements = [
  {
    name: 'Automatic',
    description: 'Self-winding mechanical movement',
  },
  {
    name: 'Manual Winding',
    description: 'Hand-wound mechanical movement',
  },
  {
    name: 'Quartz',
    description: 'Battery-powered electronic movement',
  },
  {
    name: 'Smart Watch',
    description: 'Digital smartwatch movement',
  },
  {
    name: 'Solar',
    description: 'Solar-powered movement',
  },
];

const predefinedInclusions = [
  {
    name: 'Original box and Original papers',
    description: 'Complete set with both original box and papers',
  },
  {
    name: 'Original only box',
    description: 'Product includes only the original box',
  },
  {
    name: 'Original papers',
    description: 'Product includes only original papers',
  },
  {
    name: 'no further accessories',
    description: 'Basic product without additional accessories',
  },
];

export default class SeedHelper {
  private hashidsService!: HashidsService;
  private readonly slugService: SlugService;

  constructor(private prisma: PrismaClient) {
    this.slugService = new SlugService();
  }

  async seedAllData(userId: string, numberOfProducts = 100): Promise<void> {
    const creatorId = BigInt(userId);
    const configService = new ConfigService();
    const appLoggerService = new AppLoggerService();

    const hashidsService = new HashidsService(configService, appLoggerService);
    hashidsService.onModuleInit();
    this.hashidsService = hashidsService;
    console.log('🌱 Starting comprehensive database seeding...');

    try {
      await this.prisma.$transaction(
        async (tx: any) => {
          // Seed global configuration first
          await this.seedGlobalConfiguration(creatorId, tx);

          const seedConfig = await tx.globalConfiguration.findFirst({
            where: { key: 'SEED_SCRIPT_RUN' },
          });

          if (Number(seedConfig?.value) === 1) {
            // Seed base reference data
            await this.seedProductConditions(creatorId, tx);
            await this.seedColors(creatorId, tx);
            await this.seedSizes(creatorId, tx);
            await this.seedBrands(creatorId, tx);
            await this.seedModels(creatorId, tx);
            await this.seedCategories(creatorId, tx);
            await this.seedGenders(creatorId, tx);
            await this.seedMovementTypes(creatorId, tx); // Updated: Seed movement types
            await this.seedProductInclusions(creatorId, tx); // New: Seed product inclusions
            await this.seedCurrenciesAndTaxes(creatorId, tx);
            await this.seedMaterials(creatorId, tx);
            await this.seedCrystals(creatorId, tx);
            await this.seedCountries(creatorId, tx);
            await this.seedAvailabilities(creatorId, tx);
            await this.seedComplications(creatorId, tx);

            // Seed sign of wear components and conditions
            await this.seedWatchComponents(creatorId, tx);
            await this.seedConditionOfWear(creatorId, tx);

            // Seed dynamic attribute system
            const attributeCategories = await this.seedAttributeCategories(
              creatorId,
              tx,
            );
            const attributes = await this.seedAttributes(creatorId, tx);
            await this.seedAttributeCategoryMappings(
              creatorId,
              tx,
              attributeCategories,
              attributes,
            );

            // Seed products with dynamic attributes
            await this.seedProductsAndItems(creatorId, numberOfProducts, tx);
            await this.seedProductListings(creatorId, tx);

            // Seed related data
            await this.seedTags(creatorId, tx);
            await this.seedProductTags(creatorId, tx);
            await this.seedOwnershipProofs(creatorId, tx);
            await this.seedWearSignMappings(creatorId, tx);
            await this.seedProductImages(creatorId, tx);
            await this.seedReviewsAndRatings(creatorId, tx);
            await this.seedFavorites(creatorId, tx);

            console.log('🎉 Database seeding completed successfully!');
          } else {
            console.log(
              '⏭️ Seed skipped due to configuration (SEED_SCRIPT_RUN is not 1)',
            );
          }
        },
        { timeout: 600000 },
      );
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async seedMovementTypes(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🌱 Seeding movement types...');
    try {
      for (const movementType of predefinedMovements) {
        await tx.movement_type.upsert({
          where: { name: movementType.name },
          create: {
            name: movementType.name,
            description: movementType.description,
            created_by: creatorId,
          },
          update: {},
        });
      }
      console.log('✅ Successfully seeded movement types');
    } catch (error) {
      console.error('Error seeding movement types:', error);
      throw error;
    }
  }

  private async seedProductInclusions(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🌱 Seeding product inclusions...');
    try {
      for (const inclusion of predefinedInclusions) {
        await tx.product_inclusion.upsert({
          where: { name: inclusion.name },
          create: {
            name: inclusion.name,
            description: inclusion.description,
            created_by: creatorId,
          },
          update: {},
        });
      }
      console.log('✅ Successfully seeded product inclusions');
    } catch (error) {
      console.error('Error seeding product inclusions:', error);
      throw error;
    }
  }

  private async seedProductConditions(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('📦 Seeding product conditions...');
    const conditions = [
      {
        condition: 'Very good',
        description:
          'The item shows minor signs of wear, such as small, intangible scratches.',
      },
      {
        condition: 'Good',
        description:
          'The item shows visible and tangible signs of wear like scratches, scuffs, or small dents.',
      },
      {
        condition: 'Fair',
        description:
          'The item shows major, visible signs of wear like scratches and dents.',
      },
      {
        condition: 'Incomplete',
        description:
          'The item is missing some parts and is not functional. The item is only intended for repair or spare parts.',
      },
    ];

    for (const cond of conditions) {
      await tx.condition.upsert({
        where: { condition: cond.condition },
        update: {},
        create: {
          condition: cond.condition,
          description: cond.description,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${conditions.length} product conditions`);
  }

  private async seedColors(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('🎨 Seeding colors...');
    const colors = [
      { name: 'Black', colorCode: '#000000', description: 'Pure Black' },
      { name: 'White', colorCode: '#FFFFFF', description: 'Pure White' },
      { name: 'Silver', colorCode: '#C0C0C0', description: 'Silver' },
      { name: 'Gold', colorCode: '#FFD700', description: 'Gold' },
      { name: 'Blue', colorCode: '#0000FF', description: 'Blue' },
      { name: 'Green', colorCode: '#008000', description: 'Green' },
      { name: 'Red', colorCode: '#FF0000', description: 'Red' },
      { name: 'Brown', colorCode: '#8B4513', description: 'Brown' },
      { name: 'Rose Gold', colorCode: '#E8B4B8', description: 'Rose Gold' },
      { name: 'Champagne', colorCode: '#F7E7CE', description: 'Champagne' },
    ];

    for (const color of colors) {
      await tx.color.upsert({
        where: { name: color.name },
        update: {},
        create: {
          name: color.name,
          colorCode: color.colorCode,
          description: color.description.substring(0, 15),
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${colors.length} colors`);
  }

  private async seedSizes(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('📏 Seeding sizes...');
    const sizes = [
      { width: 28, height: 28 },
      { width: 30, height: 30 },
      { width: 32, height: 32 },
      { width: 34, height: 34 },
      { width: 36, height: 36 },
      { width: 38, height: 38 },
      { width: 40, height: 40 },
      { width: 42, height: 42 },
      { width: 44, height: 44 },
      { width: 46, height: 46 },
    ];

    for (const size of sizes) {
      await tx.size.upsert({
        where: {
          caseWidth_caseHeight: {
            caseWidth: size.width,
            caseHeight: size.height,
          },
        },
        update: {},
        create: {
          caseWidth: size.width,
          caseHeight: size.height,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${sizes.length} sizes`);
  }

  private async seedBrands(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('🏷️ Seeding brands...');
    const brands = [
      'Rolex',
      'Omega',
      'Patek Philippe',
      'Audemars Piguet',
      'Cartier',
      'Breitling',
      'TAG Heuer',
      'IWC',
      'Jaeger-LeCoultre',
      'Panerai',
      'Tudor',
      'Seiko',
      'Citizen',
      'Tissot',
      'Hamilton',
    ];

    for (let i = 0; i < brands.length; i++) {
      await tx.brand.upsert({
        where: { title: brands[i] },
        update: {},
        create: {
          title: brands[i],
          order: i + 1,
          image_url: `https://example.com/brands/${brands[i]
            .toLowerCase()
            .replace(/\s+/g, '-')}.png`,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${brands.length} brands`);
  }

  private async seedModels(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('🏗️ Seeding models...');
    const brands = await tx.brand.findMany({
      select: { id: true, title: true },
    });

    const modelsByBrand = {
      Rolex: ['Submariner', 'Daytona', 'GMT-Master', 'Datejust', 'Explorer'],
      Omega: ['Speedmaster', 'Seamaster', 'Constellation', 'De Ville'],
      'Patek Philippe': ['Nautilus', 'Aquanaut', 'Calatrava', 'Complications'],
      'Audemars Piguet': ['Royal Oak', 'Royal Oak Offshore', 'Millenary'],
      Cartier: ['Tank', 'Santos', 'Ballon Bleu', 'Panthère'],
    };

    for (const brand of brands) {
      const models = modelsByBrand[
        brand.title as keyof typeof modelsByBrand
      ] || ['Classic', 'Sport', 'Dress'];

      for (let i = 0; i < models.length; i++) {
        await tx.model.upsert({
          where: {
            brand_id_title: {
              brand_id: brand.id,
              title: models[i],
            },
          },
          update: {},
          create: {
            title: models[i],
            brand_id: brand.id,
            order: i + 1,
            image_url: `https://example.com/models/${models[i]
              .toLowerCase()
              .replace(/\s+/g, '-')}.png`,
            created_by: creatorId,
          },
        });
      }
    }
    console.log('✅ Models seeded');
  }

  private async seedCategories(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('📂 Seeding categories...');
    const categories = [
      'Watch',
      'Bracelet/Strap',
      'Case',
      'Bezel',
      'Buckle',
      'Books/Calendar',
      'Box',
      'Crown/Pusher',
      'Cleaning',
      'Dial',
      'Hand(s)',
      'Movement(complete)',
      'Movement(parts)',
      'Link/Bar',
      'Other',
      'Tools',
      'Watch Winders',
    ];

    for (let i = 0; i < categories.length; i++) {
      await tx.category.upsert({
        where: { title: categories[i] },
        update: {},
        create: {
          title: categories[i],
          order: i + 1,
          image_url: `https://example.com/categories/${categories[
            i
          ].toLowerCase()}.png`,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${categories.length} categories`);
  }

  private async seedGenders(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('👥 Seeding genders...');
    const genders = ['Men', 'Women', 'Unisex'];

    for (let i = 0; i < genders.length; i++) {
      await tx.gender.upsert({
        where: { title: genders[i] },
        update: {},
        create: {
          title: genders[i],
          order: i + 1,
          image_url: `https://example.com/genders/${genders[
            i
          ].toLowerCase()}.png`,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${genders.length} genders`);
  }

  private async seedCurrenciesAndTaxes(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('💰 Seeding currencies and taxes...');

    const currencies = [
      { curr: 'USD', description: 'US Dollar', rate: 1.0 },
      { curr: 'EUR', description: 'Euro', rate: 0.85 },
      { curr: 'GBP', description: 'British Pound', rate: 0.73 },
      { curr: 'JPY', description: 'Japanese Yen', rate: 110.0 },
    ];

    for (const currency of currencies) {
      await tx.currency_exchange.upsert({
        where: { curr: currency.curr },
        update: {},
        create: {
          curr: currency.curr,
          description: currency.description,
          exchangeRate: new Decimal(currency.rate),
          created_by: creatorId,
        },
      });
    }

    await tx.tax_rule.upsert({
      where: { description: 'Standard VAT' },
      update: {},
      create: {
        taxRate: new Decimal(0.2),
        description: 'Standard VAT',
        created_by: creatorId,
      },
    });

    console.log('✅ Currencies and tax rules seeded');
  }

  private async seedMaterials(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🔩 Seeding materials...');
    const materials = [
      'Stainless Steel',
      'Gold',
      'Rose Gold',
      'Platinum',
      'Titanium',
      'Ceramic',
      'Carbon Fiber',
      'Leather',
      'Rubber',
      'Fabric',
    ];

    for (const material of materials) {
      await tx.material.create({
        data: {
          title: material,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${materials.length} materials`);
  }

  private async seedCrystals(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('💎 Seeding crystals...');
    const crystals = ['Sapphire', 'Mineral', 'Acrylic', 'Hardlex'];

    for (const crystal of crystals) {
      await tx.crystal.create({
        data: {
          title: crystal,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${crystals.length} crystals`);
  }

  private async seedCountries(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🌍 Seeding countries...');
    const countries = [
      'Switzerland',
      'Japan',
      'Germany',
      'United States',
      'France',
      'Italy',
      'United Kingdom',
      'China',
      'South Korea',
    ];

    for (const country of countries) {
      await tx.country.create({
        data: {
          name: country,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${countries.length} countries`);
  }

  private async seedAvailabilities(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('📦 Seeding availabilities...');
    const statuses = ['In Stock', 'Pre-order', 'Out of Stock', 'Discontinued'];

    for (const status of statuses) {
      await tx.availability.create({
        data: {
          status,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${statuses.length} availability statuses`);
  }

  private async seedComplications(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🎯 Seeding complications...');
    const complications = [
      'Date',
      'Day-Date',
      'GMT',
      'Chronograph',
      'Moon Phase',
      'Power Reserve',
      'Perpetual Calendar',
      'Annual Calendar',
      'World Time',
      'Tourbillon',
      'Minute Repeater',
    ];

    for (const complication of complications) {
      await tx.complications.create({
        data: {
          title: complication,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${complications.length} complications`);
  }

  private async seedWatchComponents(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🔧 Seeding watch components...');
    const components = [
      'Case',
      'Dial',
      'Hands',
      'Crown',
      'Bezel',
      'Crystal',
      'Bracelet',
      'Strap',
      'Buckle',
      'Clasp',
      'Caseback',
      'Pusher',
    ];

    for (const component of components) {
      await tx.watchComponents.upsert({
        where: { name: component },
        update: {},
        create: {
          name: component,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${components.length} watch components`);
  }

  private async seedConditionOfWear(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('👀 Seeding condition of wear...');
    const conditions = [
      {
        condition: 'None',
        description: 'Like new, no visible wear',
      },
      {
        condition: 'Barely Visible',
        description: 'Minimal signs of wear, excellent condition',
      },
      {
        condition: 'Obvious',
        description: 'Minor signs of wear, very good condition',
      },
      {
        condition: 'Good',
        description: 'Visible signs of wear but functions properly',
      },
      {
        condition: 'Fair',
        description: 'Significant signs of wear',
      },
      {
        condition: 'Poor',
        description: 'Heavy wear or damage present',
      },
    ];

    for (const condition of conditions) {
      await tx.condition_of_wear.upsert({
        where: { condition: condition.condition },
        update: {},
        create: {
          condition: condition.condition,
          description: condition.description,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${conditions.length} wear conditions`);
  }

  private async seedWearSignMappings(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🔍 Seeding wear sign mappings...');

    // Get all used products
    const products = await tx.product.findMany({
      where: { is_used: true },
      include: {
        productItems: true,
      },
    });

    // Get components and conditions
    const watchComponents = await tx.watchComponents.findMany();
    const conditionsOfWear = await tx.condition_of_wear.findMany();

    let count = 0;
    for (const product of products) {
      // For each product, create 1-3 wear signs
      const numberOfWearSigns = getRandomInt(1, 3);

      for (const productItem of product.productItems) {
        for (let w = 0; w < numberOfWearSigns; w++) {
          const component = getRandomElement(watchComponents);
          const condition = getRandomElement(conditionsOfWear);

          if (component && condition) {
            await tx.wear_sign_component_condition_mapping.upsert({
              where: {
                product_id_product_item_id_watch_component_id_condition_id: {
                  product_id: product.id,
                  product_item_id: productItem.id,
                  watch_component_id: component.id,
                  condition_id: condition.id,
                },
              },
              update: {},
              create: {
                product_id: product.id,
                product_item_id: productItem.id,
                watch_component_id: component.id,
                condition_id: condition.id,
                image_url: `https://picsum.photos/600/400?random=wear-${product.id}-${w}`,
                alt_text: `${component.name} wear condition: ${condition.condition}`,
                order: w + 1,
                created_by: creatorId,
              },
            });
            count++;
          }
        }
      }
    }
    console.log(`✅ Seeded ${count} wear sign mappings`);
  }

  private async seedAttributeCategories(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<any[]> {
    console.log('🏗️ Seeding attribute categories...');
    const categories = [
      'Watch',
      'Bracelet/Strap',
      'Case',
      'Bezel',
      'Buckle',
      'Books/Calendar',
      'Box',
      'Crown/Pusher',
      'Cleaning',
      'Dial',
      'Hand(s)',
      'Movement(complete)',
      'Movement(parts)',
      'Link/Bar',
      'Other',
      'Tools',
      'Watch Winders',
    ];

    const attributeCategories = [];
    for (const category of categories) {
      const result = await tx.attribute_categories.upsert({
        where: { name: category },
        update: {},
        create: {
          name: category,
          is_active: true,
          created_by: creatorId,
        },
      });
      attributeCategories.push(result);
    }
    // Store the created categories for use in mappings
    return attributeCategories;
  }

  private async seedAttributes(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<any[]> {
    console.log('📋 Seeding attributes...');
    const attributes = [
      {
        name: 'reference_number',
        display_name: 'Reference Number',
        unit: null,
        description: 'Watch reference number',
      },
      {
        name: 'serial_number',
        display_name: 'Serial Number',
        unit: null,
        description: 'Watch serial number',
      },
      {
        name: 'caliber_movement',
        display_name: 'Caliber/Movement',
        unit: null,
        description: 'Movement caliber information',
      },
      {
        name: 'clasp_type',
        display_name: 'Type of Clasp',
        unit: null,
        description: 'Clasp mechanism type',
      },
      {
        name: 'functions',
        display_name: 'Functions',
        unit: null,
        description: 'Watch functions and complications',
      },
      {
        name: 'crystal_type',
        display_name: 'Crystal Type',
        unit: null,
        description: 'Crystal material type',
      },
      {
        name: 'dial_color',
        display_name: 'Dial Color',
        unit: null,
        description: 'Color of the watch dial',
      },
      {
        name: 'clasp_material',
        display_name: 'Clasp Material',
        unit: null,
        description: 'Material of the clasp',
      },
      {
        name: 'bezel_material',
        display_name: 'Bezel Material',
        unit: null,
        description: 'Material of the bezel',
      },
      {
        name: 'case_diameter',
        display_name: 'Case Diameter',
        unit: 'mm',
        description: 'Case diameter in millimeters',
      },
      {
        name: 'lug_width',
        display_name: 'Lug Width',
        unit: 'mm',
        description: 'Width between lugs',
      },
      {
        name: 'water_resistance',
        display_name: 'Water Resistance',
        unit: 'm',
        description: 'Water resistance in meters',
      },
      {
        name: 'power_reserve',
        display_name: 'Power Reserve',
        unit: 'hours',
        description: 'Power reserve duration',
      },
      {
        name: 'case_thickness',
        display_name: 'Case Thickness',
        unit: 'mm',
        description: 'Thickness of the case',
      },
      {
        name: 'weight',
        display_name: 'Weight',
        unit: 'g',
        description: 'Weight of the watch',
      },
      {
        name: 'condition',
        display_name: 'Condition',
        unit: null,
        description: 'Overall condition of the product',
      },
      {
        name: 'inclusions',
        display_name: 'Inclusions',
        unit: null,
        description: 'Included accessories',
      },
      {
        name: 'movement',
        display_name: 'Movement Type',
        unit: null,
        description: 'Type of watch movement',
      },
      {
        name: 'base_caliber',
        display_name: 'Base Caliber',
        unit: null,
        description: 'Base movement caliber',
      },
      {
        name: 'frequency',
        display_name: 'Frequency',
        unit: 'Hz',
        description: 'Movement frequency',
      },
      {
        name: 'number_of_jewels',
        display_name: 'Jewels',
        unit: null,
        description: 'Number of jewels in movement',
      },
      {
        name: 'buckle_width',
        display_name: 'Buckle Width',
        unit: 'mm',
        description: 'Width of the buckle',
      },
      {
        name: 'bracelet_length_long_side',
        display_name: 'Bracelet Length (Long)',
        unit: 'mm',
        description: 'Length of long side of bracelet',
      },
      {
        name: 'braclet_length_short_side',
        display_name: 'Bracelet Length (Short)',
        unit: 'mm',
        description: 'Length of short side of bracelet',
      },
      {
        name: 'bracelet_thickness',
        display_name: 'Bracelet Thickness',
        unit: 'mm',
        description: 'Thickness of bracelet',
      },
      {
        name: 'bracelet_material',
        display_name: 'Bracelet material',
        unit: null,
        description: 'Material of the bracelet',
      },
      {
        name: 'bracelet_color',
        display_name: 'Bracelet Color',
        unit: null,
        description: 'Color of the bracelet',
      },
      {
        name: 'case_material',
        display_name: 'Case Material',
        unit: null,
        description: 'Material of the case',
      },
    ];

    const createdAttributes = [];
    for (const attribute of attributes) {
      const result = await tx.attributes.upsert({
        where: { name: attribute.name },
        update: {},
        create: {
          name: attribute.name,
          display_name: attribute.display_name,
          unit: attribute.unit,
          description: attribute.description,
          is_active: true,
          created_by: creatorId,
        },
      });
      createdAttributes.push(result);
    }
    console.log(`✅ Seeded ${attributes.length} attributes`);
    return createdAttributes;
  }

  private async seedAttributeCategoryMappings(
    creatorId: bigint,
    tx: PrismaClient,
    attributeCategories: any[],
    attributes: any[],
  ): Promise<void> {
    console.log('🔗 Seeding attribute category mappings...');

    const mappings = [
      // Watch
      {
        category: 'Watch',
        attribute: 'serial_number',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'dial_color',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'case_diameter',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'case_material',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'bracelet_material',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'bracelet_color',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'inclusions',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'movement',
        data_type: 'lookup',
        mandatory: false,
      },

      // Bracelet/Strap
      {
        category: 'Bracelet/Strap',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'lug_width',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'buckle_width',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'buckle_length_long_side',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'buckle_length_short_side',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'bracelet_thickness',
        data_type: 'number',
        mandatory: false,
      },

      // Case
      {
        category: 'Case',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Case',
        attribute: 'case_diameter',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Case',
        attribute: 'case_material',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Case',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Bezel
      {
        category: 'Bezel',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bezel',
        attribute: 'bezel_material',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Bezel',
        attribute: 'case_diameter',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Bezel',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Buckle
      {
        category: 'Buckle',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Buckle',
        attribute: 'clasp_type',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Buckle',
        attribute: 'clasp_material',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Buckle',
        attribute: 'buckle_width',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Buckle',
        attribute: 'lug_width',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Buckle',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Box
      {
        category: 'Box',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Box',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Dial
      {
        category: 'Dial',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Dial',
        attribute: 'dial_color',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Dial',
        attribute: 'case_diameter',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Dial',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Movement (Complete)
      {
        category: 'Movement (Complete)',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement (Complete)',
        attribute: 'movement',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Movement (Complete)',
        attribute: 'caliber_movement',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Movement (Complete)',
        attribute: 'base_caliber',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Movement (Complete)',
        attribute: 'power_reserve',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement (Complete)',
        attribute: 'frequency',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement (Complete)',
        attribute: 'number_of_jewels',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement (Complete)',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Movement (Parts)
      {
        category: 'Movement (Parts)',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement (Parts)',
        attribute: 'movement',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Movement (Parts)',
        attribute: 'caliber_movement',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Movement (Parts)',
        attribute: 'power_reserve',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement (Parts)',
        attribute: 'base_caliber',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Movement (Parts)',
        attribute: 'number_of_jewels',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement (Parts)',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },
      // Crown Pusher
      {
        category: 'Crown/Pusher',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Crown/Pusher',
        attribute: 'caliber_movement',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Crown/Pusher',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },
      // Glass/Crystal
      {
        category: 'Glass/Crystal',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Glass/Crystal',
        attribute: 'crystal_type',
        data_type: 'lookup',
        mandatory: false,
      },
      {
        category: 'Glass/Crystal',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },
      // Hands
      {
        category: 'Hands',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Hands',
        attribute: 'caliber_movement',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Hands',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },
      // Link/Bar
      {
        category: 'Link/Bar',
        attribute: 'reference_number',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Link/Bar',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },
      // Books/Calendar
      {
        category: 'Books/Calendar',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Cleaning
      {
        category: 'Cleaning',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Other
      {
        category: 'Other',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Watch Winders
      {
        category: 'Watch Winders',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

      // Tools
      {
        category: 'Tools',
        attribute: 'condition',
        data_type: 'lookup',
        mandatory: true,
      },

    ];

    for (const mapping of mappings) {
      const category = attributeCategories.find(
        (c) => c.name === mapping.category,
      );
      const attribute = attributes.find((a) => a.name === mapping.attribute);

      if (!attribute) continue;
      if (!category) continue;

      if (category && attribute) {
        await tx.attribute_category_mapping.upsert({
          where: {
            attribute_category_id_attribute_id: {
              attribute_category_id: category.id,
              attribute_id: attribute.id,
            },
          },
          create: {
            attribute_category_id: category.id,
            attribute_id: attribute.id,
            data_type: mapping.data_type || 'string',
            is_mandatory: mapping.mandatory,
            is_active: true,
            created_by: BigInt(1),
          },
          update: {},
        });
      }
    }
    console.log(`✅ Seeded attribute category mappings`);
  }

  private async seedProductsAndItems(
    creatorId: bigint,
    numberOfProducts: number,
    tx: PrismaClient,
  ): Promise<void> {
    console.log(
      `🎯 Seeding ${numberOfProducts} products with dynamic attributes...`,
    );

    // Get all required data
    const colors = await tx.color.findMany();
    const sizes = await tx.size.findMany();
    const brands = await tx.brand.findMany();
    const categories = await tx.category.findMany();
    const genders = await tx.gender.findMany();
    const movementTypes = await tx.movement_type.findMany();
    const crystals = await tx.crystal.findMany();
    const materials = await tx.material.findMany();
    const countries = await tx.country.findMany();
    const availabilities = await tx.availability.findMany();
    const complications = await tx.complications.findMany();
    const currencies = await tx.currency_exchange.findMany();
    const taxRules = await tx.tax_rule.findMany();
    const attributes = await tx.attributes.findMany();
    const attributeCategories = await tx.attribute_categories.findMany();
    const attributeMappings = await tx.attribute_category_mapping.findMany();
    const conditions = await tx.condition.findMany();
    const watchComponents = await tx.watchComponents.findMany();
    const conditionsOfWear = await tx.condition_of_wear.findMany();
    const productInclusions = await tx.product_inclusion.findMany();

    console.log(
      '👉 Found required lookup data, proceeding with product seeding...',
    );

    const watchCategory = categories.find((c) => c.title === 'Watch');
    const usdCurrency = currencies.find((c) => c.curr === 'USD');
    const standardTax = taxRules.find((t) => t.description === 'Standard VAT');

    if (!watchCategory || !usdCurrency || !standardTax) {
      console.error('❌ Missing required base data');
      return;
    }

    const watchMappings = attributeMappings.filter((m) => {
      const category = attributeCategories.find(
        (c) => c.id === m.attribute_category_id,
      );
      return category?.name === 'Watch';
    });

    const claspTypes = [
      'Deployant',
      'Buckle',
      'Folding',
      'Hook',
      'Magnetic',
      'Push Button',
    ];

    let productsCreated = 0;
    const existingRefs = new Set<string>();
    const existingSerials = new Set<string>();
    const existingSkus = new Set<string>();

    for (let i = 0; i < numberOfProducts; i++) {
      try {
        const brand = getRandomElement(brands)!;
        const gender = getRandomElement(genders)!;
        const category = getRandomElement(categories)!;
        const isWatch = category.title === 'Watch';

        // Generate unique identifiers
        let referenceNumber: string;
        do {
          referenceNumber = generateReferenceNumber();
        } while (existingRefs.has(referenceNumber));
        existingRefs.add(referenceNumber);

        let serialNumber: string;
        do {
          serialNumber = generateSerialNumber();
        } while (existingSerials.has(serialNumber));
        existingSerials.add(serialNumber);

        let sku: string;
        do {
          sku = generateSku();
        } while (existingSkus.has(sku));
        existingSkus.add(sku);

        // Product Price
        let productPrice = getRandomInt(100000, 50000000);

        // Create product
        const productName = `${brand.title} ${getRandomInt(100, 999)}`;
        const productSlug = this.slugService.generateSlug(
          `${productName} ${brand.title} ${category.title} ${gender.title}`,
        );

        // Ensure at least 10% of products are always marked as used
        let isUsed = false;
        if (i < Math.ceil(numberOfProducts * 0.1)) {
          isUsed = true;
        } else {
          isUsed = Math.random() < 0.3;
        }

        const product = await tx.product.create({
          data: {
            name: productName,
            description: `Discover the exquisite ${productName}. This premium ${category.title.toLowerCase()} from ${brand.title
              } embodies precision engineering and timeless design.`,
            title: `${productName} | ${brand.title} Official Store`,
            brand_id: brand.id,
            category_id: category.id,
            gender_id: gender.id,
            is_accessory: !isWatch,
            product_slug: productSlug,
            year_of_production: getRandomInt(2010, 2024),
            is_used: isUsed,
            sales_price: new Decimal(productPrice),
            commission_fee: new Decimal(productPrice * 0.6),
            payout_price: new Decimal(productPrice * 0.4), // 40% of sales price
            seller_id: BigInt(1), // Default seller ID for seeding
            currency_id: 1, // Default to USD
            created_by: creatorId,
          },
        });

        const color = getRandomElement(colors)!;
        const braceletColor = getRandomElement(colors)!;
        const dialColor = getRandomElement(colors)!;
        const size = getRandomElement(sizes)!;
        const movementType = getRandomElement(movementTypes)!;
        const crystal = getRandomElement(crystals)!;
        const caseMaterial = getRandomElement(materials)!;
        const braceletMaterial = getRandomElement(materials)!;
        const country = getRandomElement(countries)!;
        const availability = getRandomElement(availabilities)!;
        const complication = getRandomElement(complications)!;

        const productItem = await tx.product_items.create({
          data: {
            product_id: product.id,
            title: `${product.name} - ${color.name}`,
            color_id: color.id,
            bracelet_color_id: braceletColor.id,
            dial_color_id: dialColor.id,
            size_id: size.id,
            movement_type_id: movementType.id,
            price: new Decimal(getRandomInt(1000, 50000)),
            cost_price: new Decimal(getRandomInt(500, 25000)),
            quantity: getRandomInt(0, 100),
            gender_id: gender.id,
            year_of_production: getRandomInt(2010, 2024),
            serial_number: serialNumber,
            reference_number: referenceNumber, // This field exists on product_items
            approval_status_by_admin: 'APPROVED',
            approximation: Math.random() < 0.3,
            buyer_confidence_boost_description: `Premium ${brand.title} timepiece with exceptional craftsmanship`,
            unknown: Math.random() < 0.1,
            has_original_box_and_papers: Math.random() < 0.7,
            has_original_box: Math.random() < 0.8,
            has_original_papers: Math.random() < 0.6,
            has_additional_accessories: Math.random() < 0.5,
            crystal_id: crystal.id,
            case_material_id: caseMaterial.id,
            bracelet_material_id: braceletMaterial.id,
            complication_id: complication.id,
            release_date: new Date(
              Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 10,
            ),
            country_id: country.id,
            availability_id: availability.id,
            currency_id: usdCurrency.id,
            tax_rule_id: standardTax.id,
            seller_id: creatorId,
            power_reserve: getRandomInt(24, 168),
            base_image_url: `https://picsum.photos/800/600?random=${i}`,
            sku: sku,
            discount: new Decimal(Math.random() * 20),
            warranty: getRandomInt(1, 5),
            created_by: creatorId,
          },
        });

        // Add dynamic attributes - get mappings based on product category
        const relevantMappings = attributeMappings.filter((m) => {
          const attrCategory = attributeCategories.find(
            (c) => c.id === m.attribute_category_id,
          );
          return attrCategory?.name === category.title;
        });

        for (const mapping of relevantMappings) {
          const attribute = attributes.find(
            (a) => a.id === mapping.attribute_id,
          );
          if (!attribute) continue;

          let value: any = null;
          let lookupName: string | null = null;
          let lookupId: number | null = null;

          switch (attribute.name) {
            case 'reference_number':
              value = referenceNumber;
              break;
            case 'serial_number':
              value = serialNumber;
              break;

            case 'crystal_type':
              const selectedCrystal = getRandomElement(crystals);
              if (selectedCrystal) {
                value = selectedCrystal.title;
                lookupName = 'crystal';
                lookupId = selectedCrystal.id;
              }
              break;

            case 'case_diameter':
              value = getRandomInt(28, 50);
              break;

            case 'dial_color':
              value = dialColor.name;
              lookupName = 'color';
              lookupId = dialColor.id;
              break;

            case 'caliber_movement':
              value = `${movementType.name} Cal. ${Array.from(
                { length: 4 },
                () =>
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[
                  Math.floor(Math.random() * 36)
                  ],
              ).join('')}`;
              break;

            case 'clasp_type':
              value = getRandomElement(claspTypes);
              break;

            case 'clasp_material':
              const claspMat = getRandomElement(materials);
              if (claspMat) {
                value = claspMat.title;
                lookupName = 'material';
                lookupId = claspMat.id;
              }
              break;

            case 'bezel_material':
              const bezelMat = getRandomElement(materials);
              if (bezelMat) {
                value = bezelMat.title;
                lookupName = 'material';
                lookupId = bezelMat.id;
              }
              break;

            case 'lug_width':
              value = getRandomInt(16, 24);
              break;

            case 'water_resistance':
              value = getRandomElement([30, 50, 100, 200, 300, 500, 1000]);
              break;

            case 'power_reserve':
              value = getRandomInt(24, 168);
              break;

            case 'case_thickness':
              value = Math.round((Math.random() * 10 + 8) * 10) / 10;
              break;

            case 'weight':
              value = getRandomInt(80, 300);
              break;

            case 'functions':
              const functionList = [
                'Date',
                'Day-Date',
                'GMT',
                'Chronograph',
                'Moon Phase',
              ];
              const selectedFunctions: any = [];
              const numFunctions = getRandomInt(1, 3);
              for (let f = 0; f < numFunctions; f++) {
                const func = getRandomElement(functionList);
                if (func && !selectedFunctions.includes(func)) {
                  selectedFunctions.push(func);
                }
              }
              value = selectedFunctions.join(', ');
              break;

            case 'condition':
              const selectedCondition = getRandomElement(conditions);
              if (selectedCondition) {
                value = selectedCondition.condition;
                lookupName = 'condition';
                lookupId = selectedCondition.id;
              }
              break;
            case 'movement':
              if (movementType) {
                value = movementType.name;
                lookupName = 'movement_type';
                lookupId = movementType.id;
              }
              break;

            case 'inclusions':
              const inclusion = getRandomElement(productInclusions);
              if (inclusion) {
                value = inclusion.name;
                lookupName = 'product_inclusion';
                lookupId = inclusion.id;
              }
              break;

          }

          if (value !== null) {
            let attributeValue: any = {
              lookup_name: lookupName,
              lookup_id: lookupId,
            };

            switch (mapping.data_type) {
              case 'string':
                attributeValue.string_value = value.toString();
                break;
              case 'number':
                try {
                  const numValue = typeof value === 'number' ? value : parseFloat(value);
                  // Check if the value is a valid number before creating a Decimal
                  if (!isNaN(numValue)) {
                    attributeValue.number_value = new Decimal(numValue);
                  } else {
                    // Use a default value if the parsed value is NaN
                    attributeValue.number_value = new Decimal(0);
                  }
                } catch (error) {
                  // Fallback to a default value if conversion fails
                  attributeValue.number_value = new Decimal(0);
                }
                break;
              case 'boolean':
                attributeValue.boolean_value =
                  typeof value === 'boolean' ? value : Boolean(value);
                break;
              case 'date':
                attributeValue.date_value =
                  value instanceof Date ? value : new Date(value);
                break;
            }

            await tx.attribute_value_mapping.create({
              data: {
                attribute_category_mapping_id: mapping.id,
                product_id: product.id,
                ...attributeValue,
                created_by: creatorId,
              },
            });
          }
        }

        // Add sign of wear mappings only for watches
        if (isWatch && product.is_used) {
          const numberOfWearSigns = getRandomInt(1, 3);
          for (let w = 0; w < numberOfWearSigns; w++) {
            const component = getRandomElement(watchComponents);
            const condition = getRandomElement(conditionsOfWear);

            if (component && condition) {
              await tx.wear_sign_component_condition_mapping.upsert({
                where: {
                  product_id_product_item_id_watch_component_id_condition_id: {
                    product_id: product.id,
                    product_item_id: productItem.id,
                    watch_component_id: component.id,
                    condition_id: condition.id,
                  },
                },
                update: {},
                create: {
                  product_id: product.id,
                  product_item_id: productItem.id,
                  watch_component_id: component.id,
                  condition_id: condition.id,
                  image_url: `https://picsum.photos/600/400?random=wear-${product.id}-${w}`,
                  alt_text: `${component.name} wear condition: ${condition.condition}`,
                  order: w + 1,
                  created_by: creatorId,
                },
              });
            }
          }
        }

        // Create product images
        const imageCount = getRandomInt(3, 8);
        for (let j = 0; j < imageCount; j++) {
          await tx.product_images.create({
            data: {
              img_url: `https://picsum.photos/800/600?random=${product.id}-${j}`,
              alt_text: `${product.name} - Image ${j + 1}`,
              type:
                j === 0 ? 'ownership' : j === 1 ? 'gallery' : 'sign-of-wear',
              image_type:
                j === 0 ? 'thumbnail' : j === 1 ? 'gallery' : 'detail',
              original_name: `image-${product.id}-${j}.jpg`,
              mime_type: 'image/jpeg',
              file_size: getRandomInt(50000, 200000), // in bytes
              product_id: product.id,
              order: j + 1,
              created_by: creatorId,
            },
          });
        }

        productsCreated++;

        if (productsCreated % 50 === 0) {
          console.log(
            `✅ Seeded ${productsCreated}/${numberOfProducts} products`,
          );
        }
      } catch (error) {
        console.error(`❌ Failed to seed product ${i + 1}:`, error);
        // Continue with next product instead of failing completely
      }
    }

    console.log(
      `✅ Successfully seeded ${productsCreated} products with dynamic attributes`,
    );
  }

  private async seedTags(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('🏷️ Seeding tags...');
    const tags = [
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

    for (const tag of tags) {
      await tx.tags.upsert({
        where: { title: tag.title },
        update: {},
        create: {
          key: tag.key,
          title: tag.title,
          description: tag.description,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${tags.length} tags`);
  }

  private async seedProductTags(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🔗 Seeding product tags...');
    console.log(
      'Product tags not seeded. External job implemented to sync data',
    );
  }

  private async seedOwnershipProofs(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('📋 Seeding ownership proofs...');
    const productItems = await tx.product_items.findMany({
      select: { id: true, product_id: true },
    });

    if (productItems.length === 0) {
      console.warn('No product items found for ownership proofs. Skipping.');
      return;
    }

    let proofsCreated = 0;
    const maxProofsToCreate = Math.min(
      100,
      Math.floor(productItems.length * 0.3),
    );

    for (let i = 0; i < maxProofsToCreate; i++) {
      const item = getRandomElement(productItems)!;

      try {
        await tx.ownership_proof.upsert({
          where: {
            product_id_product_item_id: {
              product_id: item.product_id,
              product_item_id: item.id,
            },
          },
          update: {},
          create: {
            product_id: item.product_id,
            product_item_id: item.id,
            image_url: `https://picsum.photos/600/400?random=proof-${item.id}`,
            alt_text: `Proof of ownership for item ${item.id}`,
            order: 1,
            created_by: creatorId,
          },
        });
        proofsCreated++;
      } catch (error) {
        // Skip if already exists due to unique constraint
        continue;
      }
    }
    console.log(`✅ Seeded ${proofsCreated} ownership proofs`);
  }

  private async seedSignOfWears(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🔍 Signs of wear already seeded during product creation');
  }

  private async seedProductImages(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('🖼️ Product images already seeded during product creation');
  }

  private async seedReviewsAndRatings(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('⭐ Seeding reviews and ratings...');
    const products = await tx.product.findMany({
      select: { id: true, name: true },
    });

    if (products.length === 0) {
      console.warn('No products found for reviews. Skipping.');
      return;
    }

    let reviewsCreated = 0;
    const maxReviewsToCreate = Math.min(200, Math.floor(products.length * 0.4));

    const reviewTexts = [
      'Excellent quality watch, highly recommended!',
      'Beautiful timepiece, exceeded my expectations.',
      'Great value for money, very satisfied.',
      'Amazing craftsmanship and attention to detail.',
      'Perfect watch for daily wear, very durable.',
    ];

    for (let i = 0; i < maxReviewsToCreate; i++) {
      const product = getRandomElement(products)!;
      const reviewText = getRandomElement(reviewTexts)!;
      const rating = getRandomInt(3, 5);

      try {
        await tx.reviews_ratings.upsert({
          where: {
            product_id_reviewedBy: {
              product_id: product.id,
              reviewedBy: creatorId,
            },
          },
          update: {},
          create: {
            product_id: product.id,
            review: reviewText,
            ratings: rating,
            reviewedBy: creatorId,
            created_by: creatorId,
          },
        });
        reviewsCreated++;
      } catch (error) {
        // Skip if already exists due to unique constraint
        continue;
      }
    }
    console.log(`✅ Seeded ${reviewsCreated} reviews and ratings`);
  }

  private async seedFavorites(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('❤️ Seeding favorites...');
    const productItems = await tx.product_items.findMany({
      select: { id: true, product_id: true },
    });

    if (productItems.length === 0) {
      console.warn('No product items found for favorites. Skipping.');
      return;
    }

    let favoritesCreated = 0;
    const maxFavoritesToCreate = Math.min(
      100,
      Math.floor(productItems.length * 0.2),
    );

    for (let i = 0; i < maxFavoritesToCreate; i++) {
      const item = getRandomElement(productItems)!;

      try {
        await tx.favorite.upsert({
          where: {
            user_id_product_id_product_item_id: {
              user_id: creatorId,
              product_id: item.product_id,
              product_item_id: item.id,
            },
          },
          update: {},
          create: {
            user_id: creatorId,
            product_id: item.product_id,
            product_item_id: item.id,
            created_by: creatorId,
          },
        });
        favoritesCreated++;
      } catch (error) {
        // Skip if already exists due to unique constraint
        continue;
      }
    }
    console.log(`✅ Seeded ${favoritesCreated} favorites`);
  }

  private async seedProductListings(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('📋 Seeding product listings...');

    // Complete JSON data - add all your 40 entries here
    const listingsData = [
      {
        ID: 1,
        Brand: 'Seiko',
        Category: 'Sports',
        'Model Name': 'Prospex',
        'Reference No.': 'SE96069',
        'Price (USD)': 2658.69,
        Currency: 'USD',
        'Release Date': '19/08/2022',
        Gender: 'Unisex',
        'Case Material': 'Stainless Steel',
        'Case Diameter (mm)': 32,
        'Case Thickness (mm)': 14.7,
        'Dial Color': 'Gold',
        'Strap Material': 'Leather',
        'Strap Color': 'Blue',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 40,
        Complications: 'World Time',
        Availability: 'Pre-Order',
        'Warranty (Years)': 4,
        'Country of Origin': 'Japan',
      },
      {
        ID: 2,
        Brand: 'Citizen',
        Category: 'Eco-Drive',
        'Model Name': 'Promaster',
        'Reference No.': 'CI19632',
        'Price (USD)': 5219.34,
        Currency: 'USD',
        'Release Date': '17/05/2021',
        Gender: "Women's",
        'Case Material': 'Brass',
        'Case Diameter (mm)': 34.9,
        'Case Thickness (mm)': 13.6,
        'Dial Color': 'Black',
        'Strap Material': 'Silicone',
        'Strap Color': 'Blue',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Solar Powered',
        'Power Reserve (hours)': 0,
        Complications: 'GMT',
        Availability: 'Out of Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Japan',
      },
      {
        ID: 3,
        Brand: 'Omega',
        Category: 'Dress',
        'Model Name': 'Speedmaster',
        'Reference No.': 'OM90435',
        'Price (USD)': 13084.44,
        Currency: 'USD',
        'Release Date': '11/10/2023',
        Gender: 'Unisex',
        'Case Material': 'Bronze',
        'Case Diameter (mm)': 37.8,
        'Case Thickness (mm)': 13.2,
        'Dial Color': 'Black',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Black',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 60,
        Complications: 'None',
        Availability: 'In Stock',
        'Warranty (Years)': 2,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 4,
        Brand: 'Omega',
        Category: 'Dress',
        'Model Name': 'Speedmaster',
        'Reference No.': 'OM14756',
        'Price (USD)': 4401.79,
        Currency: 'USD',
        'Release Date': '28/12/2023',
        Gender: "Women's",
        'Case Material': 'Bioceramic',
        'Case Diameter (mm)': 43.9,
        'Case Thickness (mm)': 9,
        'Dial Color': 'Silver',
        'Strap Material': 'Rubber',
        'Strap Color': 'Red',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 70,
        Complications: 'GMT',
        Availability: 'Pre-Order',
        'Warranty (Years)': 2,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 5,
        Brand: 'Seiko',
        Category: 'Sports',
        'Model Name': 'Prospex',
        'Reference No.': 'SE37679',
        'Price (USD)': 3163.87,
        Currency: 'USD',
        'Release Date': '20/11/2023',
        Gender: "Women's",
        'Case Material': 'Bioceramic',
        'Case Diameter (mm)': 36.6,
        'Case Thickness (mm)': 8.6,
        'Dial Color': 'Red',
        'Strap Material': 'Rubber',
        'Strap Color': 'Black',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 60,
        Complications: 'Moonphase',
        Availability: 'Limited Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'Japan',
      },
      {
        ID: 6,
        Brand: 'Fossil',
        Category: 'Fashion',
        'Model Name': 'Gen 6',
        'Reference No.': 'FO56219',
        'Price (USD)': 13035.57,
        Currency: 'USD',
        'Release Date': '28/10/2020',
        Gender: "Women's",
        'Case Material': 'Stainless Steel',
        'Case Diameter (mm)': 44.6,
        'Case Thickness (mm)': 13.3,
        'Dial Color': 'Red',
        'Strap Material': 'Leather',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Smart',
        'Power Reserve (hours)': 0,
        Complications: 'Chronograph',
        Availability: 'Pre-Order',
        'Warranty (Years)': 5,
        'Country of Origin': 'USA',
      },
      {
        ID: 7,
        Brand: 'Fossil',
        Category: 'Fashion',
        'Model Name': 'Gen 6',
        'Reference No.': 'FO70599',
        'Price (USD)': 8103.27,
        Currency: 'USD',
        'Release Date': '04/08/2021',
        Gender: "Women's",
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 45,
        'Case Thickness (mm)': 8.1,
        'Dial Color': 'Gray',
        'Strap Material': 'Silicone',
        'Strap Color': 'Green',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Smart',
        'Power Reserve (hours)': 40,
        Complications: 'World Time',
        Availability: 'In Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'USA',
      },
      {
        ID: 8,
        Brand: 'Tissot',
        Category: 'Classic',
        'Model Name': 'Le Locle',
        'Reference No.': 'TI10158',
        'Price (USD)': 11976.17,
        Currency: 'USD',
        'Release Date': '23/10/2021',
        Gender: 'Unisex',
        'Case Material': 'Brass',
        'Case Diameter (mm)': 37.1,
        'Case Thickness (mm)': 8.1,
        'Dial Color': 'Green',
        'Strap Material': 'Canvas',
        'Strap Color': 'Brown',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 70,
        Complications: 'GMT',
        Availability: 'In Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 9,
        Brand: 'Swatch',
        Category: 'Fashion',
        'Model Name': 'MoonSwatch',
        'Reference No.': 'SW16030',
        'Price (USD)': 11003.69,
        Currency: 'USD',
        'Release Date': '08/03/2023',
        Gender: "Men's",
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 38.2,
        'Case Thickness (mm)': 9.5,
        'Dial Color': 'Gold',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Brown',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 60,
        Complications: 'Chronograph',
        Availability: 'Limited Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 10,
        Brand: 'Hamilton',
        Category: 'Military',
        'Model Name': 'Khaki Field',
        'Reference No.': 'HA87204',
        'Price (USD)': 139.39,
        Currency: 'USD',
        'Release Date': '22/05/2022',
        Gender: "Women's",
        'Case Material': 'Resin',
        'Case Diameter (mm)': 42.2,
        'Case Thickness (mm)': 7.1,
        'Dial Color': 'Black',
        'Strap Material': 'Silicone',
        'Strap Color': 'Green',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 40,
        Complications: 'Moonphase',
        Availability: 'Out of Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'USA',
      },
      {
        ID: 11,
        Brand: 'Timex',
        Category: 'Casual',
        'Model Name': 'Weekender',
        'Reference No.': 'TI35269',
        'Price (USD)': 445.24,
        Currency: 'USD',
        'Release Date': '14/02/2021',
        Gender: "Women's",
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 43.3,
        'Case Thickness (mm)': 9.5,
        'Dial Color': 'Red',
        'Strap Material': 'Leather',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Sapphire',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 40,
        Complications: 'None',
        Availability: 'Out of Stock',
        'Warranty (Years)': 2,
        'Country of Origin': 'USA',
      },
      {
        ID: 12,
        Brand: 'Hamilton',
        Category: 'Military',
        'Model Name': 'Khaki Field',
        'Reference No.': 'HA13015',
        'Price (USD)': 14682.7,
        Currency: 'USD',
        'Release Date': '31/08/2021',
        Gender: 'Unisex',
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 44.9,
        'Case Thickness (mm)': 9.3,
        'Dial Color': 'Gold',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 40,
        Complications: 'World Time',
        Availability: 'Pre-Order',
        'Warranty (Years)': 3,
        'Country of Origin': 'USA',
      },
      {
        ID: 13,
        Brand: 'TAG Heuer',
        Category: 'Sports',
        'Model Name': 'Carrera',
        'Reference No.': 'TA35554',
        'Price (USD)': 9624.21,
        Currency: 'USD',
        'Release Date': '22/02/2025',
        Gender: 'Unisex',
        'Case Material': 'Titanium',
        'Case Diameter (mm)': 41.9,
        'Case Thickness (mm)': 7,
        'Dial Color': 'Red',
        'Strap Material': 'Silicone',
        'Strap Color': 'Black',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 40,
        Complications: 'Moonphase',
        Availability: 'Limited Stock',
        'Warranty (Years)': 2,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 14,
        Brand: 'Hamilton',
        Category: 'Military',
        'Model Name': 'Khaki Field',
        'Reference No.': 'HA45343',
        'Price (USD)': 92.6,
        Currency: 'USD',
        'Release Date': '05/07/2025',
        Gender: "Men's",
        'Case Material': 'Brass',
        'Case Diameter (mm)': 36.7,
        'Case Thickness (mm)': 7.4,
        'Dial Color': 'Red',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Green',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 40,
        Complications: 'GMT',
        Availability: 'In Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'USA',
      },
      {
        ID: 15,
        Brand: 'Longines',
        Category: 'Dress',
        'Model Name': 'Master Collection',
        'Reference No.': 'LO79518',
        'Price (USD)': 10565.5,
        Currency: 'USD',
        'Release Date': '01/09/2022',
        Gender: 'Unisex',
        'Case Material': 'Bioceramic',
        'Case Diameter (mm)': 38.7,
        'Case Thickness (mm)': 11.4,
        'Dial Color': 'Blue',
        'Strap Material': 'Leather',
        'Strap Color': 'Green',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 80,
        Complications: 'Moonphase',
        Availability: 'Out of Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 16,
        Brand: 'Hublot',
        Category: 'Luxury',
        'Model Name': 'Big Bang',
        'Reference No.': 'HU87119',
        'Price (USD)': 106.81,
        Currency: 'USD',
        'Release Date': '18/09/2024',
        Gender: 'Unisex',
        'Case Material': 'Ceramic',
        'Case Diameter (mm)': 44.8,
        'Case Thickness (mm)': 14.1,
        'Dial Color': 'Red',
        'Strap Material': 'Silicone',
        'Strap Color': 'Blue',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 40,
        Complications: 'GMT',
        Availability: 'Out of Stock',
        'Warranty (Years)': 4,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 17,
        Brand: 'Seiko',
        Category: 'Sports',
        'Model Name': 'Prospex',
        'Reference No.': 'SE17695',
        'Price (USD)': 2448.56,
        Currency: 'USD',
        'Release Date': '19/09/2022',
        Gender: "Women's",
        'Case Material': 'Bioceramic',
        'Case Diameter (mm)': 35,
        'Case Thickness (mm)': 10.9,
        'Dial Color': 'Blue',
        'Strap Material': 'Rubber',
        'Strap Color': 'Brown',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 60,
        Complications: 'World Time',
        Availability: 'In Stock',
        'Warranty (Years)': 4,
        'Country of Origin': 'Japan',
      },
      {
        ID: 18,
        Brand: 'Orient',
        Category: 'Classic',
        'Model Name': 'Bambino',
        'Reference No.': 'OR55609',
        'Price (USD)': 3927.42,
        Currency: 'USD',
        'Release Date': '22/06/2024',
        Gender: "Men's",
        'Case Material': 'Brass',
        'Case Diameter (mm)': 41,
        'Case Thickness (mm)': 13.8,
        'Dial Color': 'Blue',
        'Strap Material': 'Silicone',
        'Strap Color': 'Brown',
        'Water Resistance (m)': 200,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 70,
        Complications: 'Date',
        Availability: 'Out of Stock',
        'Warranty (Years)': 4,
        'Country of Origin': 'Japan',
      },
      {
        ID: 19,
        Brand: 'TAG Heuer',
        Category: 'Sports',
        'Model Name': 'Carrera',
        'Reference No.': 'TA20895',
        'Price (USD)': 3999.22,
        Currency: 'USD',
        'Release Date': '24/07/2022',
        Gender: "Men's",
        'Case Material': 'Brass',
        'Case Diameter (mm)': 36.9,
        'Case Thickness (mm)': 7.4,
        'Dial Color': 'Green',
        'Strap Material': 'Nylon',
        'Strap Color': 'Black',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 80,
        Complications: 'GMT',
        Availability: 'Pre-Order',
        'Warranty (Years)': 5,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 20,
        Brand: 'Casio',
        Category: 'Digital',
        'Model Name': 'G-Shock',
        'Reference No.': 'CA40181',
        'Price (USD)': 5496.29,
        Currency: 'USD',
        'Release Date': '02/01/2022',
        Gender: "Women's",
        'Case Material': 'Bioceramic',
        'Case Diameter (mm)': 44.6,
        'Case Thickness (mm)': 13.6,
        'Dial Color': 'Gold',
        'Strap Material': 'Silicone',
        'Strap Color': 'Black',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Sapphire',
        'Movement Type': 'Digital',
        'Power Reserve (hours)': 40,
        Complications: 'Chronograph',
        Availability: 'Out of Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'Japan',
      },
      {
        ID: 21,
        Brand: 'Hamilton',
        Category: 'Military',
        'Model Name': 'Khaki Field',
        'Reference No.': 'HA41708',
        'Price (USD)': 1052.67,
        Currency: 'USD',
        'Release Date': '30/04/2021',
        Gender: "Women's",
        'Case Material': 'Bronze',
        'Case Diameter (mm)': 38.4,
        'Case Thickness (mm)': 13.1,
        'Dial Color': 'Red',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Gold',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Sapphire',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 70,
        Complications: 'World Time',
        Availability: 'In Stock',
        'Warranty (Years)': 4,
        'Country of Origin': 'USA',
      },
      {
        ID: 22,
        Brand: 'Apple',
        Category: 'Smartwatch',
        'Model Name': 'Watch Series',
        'Reference No.': 'AP61203',
        'Price (USD)': 13681.1,
        Currency: 'USD',
        'Release Date': '08/03/2023',
        Gender: "Men's",
        'Case Material': 'Bronze',
        'Case Diameter (mm)': 38.5,
        'Case Thickness (mm)': 9.8,
        'Dial Color': 'Black',
        'Strap Material': 'Canvas',
        'Strap Color': 'Black',
        'Water Resistance (m)': 200,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Smart',
        'Power Reserve (hours)': 60,
        Complications: 'Date',
        Availability: 'Pre-Order',
        'Warranty (Years)': 5,
        'Country of Origin': 'China',
      },
      {
        ID: 23,
        Brand: 'Garmin',
        Category: 'Smartwatch',
        'Model Name': 'Fenix',
        'Reference No.': 'GA61975',
        'Price (USD)': 10471.18,
        Currency: 'USD',
        'Release Date': '26/05/2025',
        Gender: "Women's",
        'Case Material': 'Stainless Steel',
        'Case Diameter (mm)': 37.3,
        'Case Thickness (mm)': 7.8,
        'Dial Color': 'Green',
        'Strap Material': 'Rubber',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Digital',
        'Power Reserve (hours)': 0,
        Complications: 'None',
        Availability: 'In Stock',
        'Warranty (Years)': 4,
        'Country of Origin': 'Taiwan',
      },
      {
        ID: 24,
        Brand: 'Citizen',
        Category: 'Eco-Drive',
        'Model Name': 'Promaster',
        'Reference No.': 'CI72620',
        'Price (USD)': 7674.11,
        Currency: 'USD',
        'Release Date': '05/12/2020',
        Gender: "Men's",
        'Case Material': 'Titanium',
        'Case Diameter (mm)': 35.8,
        'Case Thickness (mm)': 14.1,
        'Dial Color': 'Blue',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Sapphire',
        'Movement Type': 'Solar Powered',
        'Power Reserve (hours)': 70,
        Complications: 'None',
        Availability: 'Out of Stock',
        'Warranty (Years)': 2,
        'Country of Origin': 'Japan',
      },
      {
        ID: 25,
        Brand: 'Daniel Wellington',
        Category: 'Minimalist',
        'Model Name': 'Petite',
        'Reference No.': 'DA14877',
        'Price (USD)': 13199.55,
        Currency: 'USD',
        'Release Date': '01/09/2021',
        Gender: "Women's",
        'Case Material': 'Bronze',
        'Case Diameter (mm)': 38.5,
        'Case Thickness (mm)': 10.8,
        'Dial Color': 'Gold',
        'Strap Material': 'Canvas',
        'Strap Color': 'Green',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 70,
        Complications: 'GMT',
        Availability: 'Out of Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'Sweden',
      },
      {
        ID: 26,
        Brand: 'Hamilton',
        Category: 'Military',
        'Model Name': 'Khaki Field',
        'Reference No.': 'HA77427',
        'Price (USD)': 13117.6,
        Currency: 'USD',
        'Release Date': '04/04/2023',
        Gender: 'Unisex',
        'Case Material': 'Brass',
        'Case Diameter (mm)': 33.5,
        'Case Thickness (mm)': 14.6,
        'Dial Color': 'Blue',
        'Strap Material': 'Silicone',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 70,
        Complications: 'Chronograph',
        Availability: 'In Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'USA',
      },
      {
        ID: 27,
        Brand: 'Seiko',
        Category: 'Sports',
        'Model Name': 'Prospex',
        'Reference No.': 'SE14478',
        'Price (USD)': 7186.85,
        Currency: 'USD',
        'Release Date': '06/02/2024',
        Gender: "Men's",
        'Case Material': 'Titanium',
        'Case Diameter (mm)': 42.8,
        'Case Thickness (mm)': 9.6,
        'Dial Color': 'White',
        'Strap Material': 'Rubber',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Sapphire',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 70,
        Complications: 'GMT',
        Availability: 'Pre-Order',
        'Warranty (Years)': 4,
        'Country of Origin': 'Japan',
      },
      {
        ID: 28,
        Brand: 'Daniel Wellington',
        Category: 'Minimalist',
        'Model Name': 'Petite',
        'Reference No.': 'DA41723',
        'Price (USD)': 1259.83,
        Currency: 'USD',
        'Release Date': '11/08/2023',
        Gender: 'Unisex',
        'Case Material': 'Brass',
        'Case Diameter (mm)': 36.6,
        'Case Thickness (mm)': 11.5,
        'Dial Color': 'Red',
        'Strap Material': 'Rubber',
        'Strap Color': 'Black',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Sapphire',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 80,
        Complications: 'None',
        Availability: 'Pre-Order',
        'Warranty (Years)': 5,
        'Country of Origin': 'Sweden',
      },
      {
        ID: 29,
        Brand: 'Daniel Wellington',
        Category: 'Minimalist',
        'Model Name': 'Petite',
        'Reference No.': 'DA85196',
        'Price (USD)': 6914.33,
        Currency: 'USD',
        'Release Date': '08/06/2024',
        Gender: 'Unisex',
        'Case Material': 'Titanium',
        'Case Diameter (mm)': 43.8,
        'Case Thickness (mm)': 9.9,
        'Dial Color': 'Gold',
        'Strap Material': 'Canvas',
        'Strap Color': 'Blue',
        'Water Resistance (m)': 200,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 0,
        Complications: 'Chronograph',
        Availability: 'In Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'Sweden',
      },
      {
        ID: 30,
        Brand: 'Seiko',
        Category: 'Sports',
        'Model Name': 'Prospex',
        'Reference No.': 'SE32724',
        'Price (USD)': 9116.47,
        Currency: 'USD',
        'Release Date': '05/06/2023',
        Gender: "Men's",
        'Case Material': 'Brass',
        'Case Diameter (mm)': 34.9,
        'Case Thickness (mm)': 7,
        'Dial Color': 'Blue',
        'Strap Material': 'Nylon',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 70,
        Complications: 'Chronograph',
        Availability: 'Limited Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'Japan',
      },
      {
        ID: 31,
        Brand: 'Garmin',
        Category: 'Smartwatch',
        'Model Name': 'Fenix',
        'Reference No.': 'GA61772',
        'Price (USD)': 6544.64,
        Currency: 'USD',
        'Release Date': '27/03/2021',
        Gender: 'Unisex',
        'Case Material': 'Bronze',
        'Case Diameter (mm)': 33.6,
        'Case Thickness (mm)': 12.1,
        'Dial Color': 'Red',
        'Strap Material': 'Rubber',
        'Strap Color': 'Brown',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Digital',
        'Power Reserve (hours)': 70,
        Complications: 'None',
        Availability: 'Limited Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'Taiwan',
      },
      {
        ID: 32,
        Brand: 'Citizen',
        Category: 'Eco-Drive',
        'Model Name': 'Promaster',
        'Reference No.': 'CI41033',
        'Price (USD)': 12041.6,
        Currency: 'USD',
        'Release Date': '19/03/2021',
        Gender: "Women's",
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 43,
        'Case Thickness (mm)': 12.7,
        'Dial Color': 'Gray',
        'Strap Material': 'Nylon',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Solar Powered',
        'Power Reserve (hours)': 70,
        Complications: 'None',
        Availability: 'Out of Stock',
        'Warranty (Years)': 1,
        'Country of Origin': 'Japan',
      },
      {
        ID: 33,
        Brand: 'Orient',
        Category: 'Classic',
        'Model Name': 'Bambino',
        'Reference No.': 'OR86109',
        'Price (USD)': 8974.56,
        Currency: 'USD',
        'Release Date': '02/12/2020',
        Gender: "Men's",
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 39.1,
        'Case Thickness (mm)': 13,
        'Dial Color': 'Red',
        'Strap Material': 'Canvas',
        'Strap Color': 'Green',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 40,
        Complications: 'Chronograph',
        Availability: 'In Stock',
        'Warranty (Years)': 2,
        'Country of Origin': 'Japan',
      },
      {
        ID: 34,
        Brand: 'Omega',
        Category: 'Dress',
        'Model Name': 'Speedmaster',
        'Reference No.': 'OM74909',
        'Price (USD)': 10545.86,
        Currency: 'USD',
        'Release Date': '16/06/2021',
        Gender: "Men's",
        'Case Material': 'Titanium',
        'Case Diameter (mm)': 41.3,
        'Case Thickness (mm)': 10.6,
        'Dial Color': 'Black',
        'Strap Material': 'Silicone',
        'Strap Color': 'Gold',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 60,
        Complications: 'None',
        Availability: 'Limited Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 35,
        Brand: 'Swatch',
        Category: 'Fashion',
        'Model Name': 'MoonSwatch',
        'Reference No.': 'SW67084',
        'Price (USD)': 12995.97,
        Currency: 'USD',
        'Release Date': '11/01/2025',
        Gender: "Men's",
        'Case Material': 'Stainless Steel',
        'Case Diameter (mm)': 34.7,
        'Case Thickness (mm)': 6.6,
        'Dial Color': 'Gray',
        'Strap Material': 'Nylon',
        'Strap Color': 'Gold',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 70,
        Complications: 'World Time',
        Availability: 'Pre-Order',
        'Warranty (Years)': 2,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 36,
        Brand: 'TAG Heuer',
        Category: 'Sports',
        'Model Name': 'Carrera',
        'Reference No.': 'TA42855',
        'Price (USD)': 14789.48,
        Currency: 'USD',
        'Release Date': '01/12/2024',
        Gender: "Women's",
        'Case Material': 'Resin',
        'Case Diameter (mm)': 34.6,
        'Case Thickness (mm)': 9.3,
        'Dial Color': 'Green',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Red',
        'Water Resistance (m)': 200,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 0,
        Complications: 'Chronograph',
        Availability: 'In Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 37,
        Brand: 'Citizen',
        Category: 'Eco-Drive',
        'Model Name': 'Promaster',
        'Reference No.': 'CI97862',
        'Price (USD)': 10176.66,
        Currency: 'USD',
        'Release Date': '11/05/2021',
        Gender: 'Unisex',
        'Case Material': 'Brass',
        'Case Diameter (mm)': 39.2,
        'Case Thickness (mm)': 8.9,
        'Dial Color': 'Silver',
        'Strap Material': 'Nylon',
        'Strap Color': 'Red',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Solar Powered',
        'Power Reserve (hours)': 80,
        Complications: 'None',
        Availability: 'Limited Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'Japan',
      },
      {
        ID: 38,
        Brand: 'Fossil',
        Category: 'Fashion',
        'Model Name': 'Gen 6',
        'Reference No.': 'FO79500',
        'Price (USD)': 8547.49,
        Currency: 'USD',
        'Release Date': '22/12/2023',
        Gender: 'Unisex',
        'Case Material': 'Bronze',
        'Case Diameter (mm)': 44.5,
        'Case Thickness (mm)': 11.5,
        'Dial Color': 'White',
        'Strap Material': 'Nylon',
        'Strap Color': 'Red',
        'Water Resistance (m)': 200,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Smart',
        'Power Reserve (hours)': 70,
        Complications: 'None',
        Availability: 'Pre-Order',
        'Warranty (Years)': 5,
        'Country of Origin': 'USA',
      },
      {
        ID: 39,
        Brand: 'Garmin',
        Category: 'Smartwatch',
        'Model Name': 'Fenix',
        'Reference No.': 'GA18133',
        'Price (USD)': 4912.39,
        Currency: 'USD',
        'Release Date': '31/08/2024',
        Gender: "Men's",
        'Case Material': 'Ceramic',
        'Case Diameter (mm)': 34.2,
        'Case Thickness (mm)': 7.1,
        'Dial Color': 'Black',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Blue',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Digital',
        'Power Reserve (hours)': 0,
        Complications: 'GMT',
        Availability: 'Limited Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Taiwan',
      },
      {
        ID: 40,
        Brand: 'Tissot',
        Category: 'Classic',
        'Model Name': 'Le Locle',
        'Reference No.': 'TI24592',
        'Price (USD)': 12794.19,
        Currency: 'USD',
        'Release Date': '31/10/2024',
        Gender: "Women's",
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 39.2,
        'Case Thickness (mm)': 7.7,
        'Dial Color': 'Gray',
        'Strap Material': 'Rubber',
        'Strap Color': 'Brown',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 0,
        Complications: 'None',
        Availability: 'Out of Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 41,
        Brand: 'Orient',
        Category: 'Classic',
        'Model Name': 'Bambino',
        'Reference No.': 'OR81611',
        'Price (USD)': 6875.33,
        Currency: 'USD',
        'Release Date': '17/05/2025',
        Gender: 'Unisex',
        'Case Material': 'Resin',
        'Case Diameter (mm)': 43.1,
        'Case Thickness (mm)': 13.2,
        'Dial Color': 'Blue',
        'Strap Material': 'Silicone',
        'Strap Color': 'Gold',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 60,
        Complications: 'Date',
        Availability: 'Limited Stock',
        'Warranty (Years)': 4,
        'Country of Origin': 'Japan',
      },
      {
        ID: 42,
        Brand: 'Citizen',
        Category: 'Eco-Drive',
        'Model Name': 'Promaster',
        'Reference No.': 'CI13923',
        'Price (USD)': 13046.1,
        Currency: 'USD',
        'Release Date': '03/06/2025',
        Gender: "Women's",
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 38.8,
        'Case Thickness (mm)': 10.4,
        'Dial Color': 'Blue',
        'Strap Material': 'Silicone',
        'Strap Color': 'Black',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Solar Powered',
        'Power Reserve (hours)': 0,
        Complications: 'GMT',
        Availability: 'Out of Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'Japan',
      },
      {
        ID: 43,
        Brand: 'Casio',
        Category: 'Digital',
        'Model Name': 'G-Shock',
        'Reference No.': 'CA90420',
        'Price (USD)': 7325.02,
        Currency: 'USD',
        'Release Date': '01/03/2021',
        Gender: "Men's",
        'Case Material': 'Bronze',
        'Case Diameter (mm)': 39.2,
        'Case Thickness (mm)': 12.6,
        'Dial Color': 'Red',
        'Strap Material': 'Mesh Steel',
        'Strap Color': 'Black',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Digital',
        'Power Reserve (hours)': 0,
        Complications: 'World Time',
        Availability: 'In Stock',
        'Warranty (Years)': 2,
        'Country of Origin': 'Japan',
      },
      {
        ID: 44,
        Brand: 'Swatch',
        Category: 'Fashion',
        'Model Name': 'MoonSwatch',
        'Reference No.': 'SW89559',
        'Price (USD)': 9827.58,
        Currency: 'USD',
        'Release Date': '01/12/2021',
        Gender: "Women's",
        'Case Material': 'Titanium',
        'Case Diameter (mm)': 39.1,
        'Case Thickness (mm)': 7.5,
        'Dial Color': 'Red',
        'Strap Material': 'Rubber',
        'Strap Color': 'Silver',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Plastic',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 40,
        Complications: 'Chronograph',
        Availability: 'Out of Stock',
        'Warranty (Years)': 5,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 45,
        Brand: 'Citizen',
        Category: 'Eco-Drive',
        'Model Name': 'Promaster',
        'Reference No.': 'CI25230',
        'Price (USD)': 12522.5,
        Currency: 'USD',
        'Release Date': '01/09/2023',
        Gender: 'Unisex',
        'Case Material': 'Bioceramic',
        'Case Diameter (mm)': 38.3,
        'Case Thickness (mm)': 13.1,
        'Dial Color': 'White',
        'Strap Material': 'Nylon',
        'Strap Color': 'Red',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Solar Powered',
        'Power Reserve (hours)': 60,
        Complications: 'Chronograph',
        Availability: 'Pre-Order',
        'Warranty (Years)': 2,
        'Country of Origin': 'Japan',
      },
      {
        ID: 46,
        Brand: 'Omega',
        Category: 'Dress',
        'Model Name': 'Speedmaster',
        'Reference No.': 'OM77160',
        'Price (USD)': 5200.38,
        Currency: 'USD',
        'Release Date': '02/08/2020',
        Gender: 'Unisex',
        'Case Material': 'Ceramic',
        'Case Diameter (mm)': 37.9,
        'Case Thickness (mm)': 12,
        'Dial Color': 'Gray',
        'Strap Material': 'Leather',
        'Strap Color': 'Black',
        'Water Resistance (m)': 300,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 70,
        Complications: 'None',
        Availability: 'In Stock',
        'Warranty (Years)': 4,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 47,
        Brand: 'Daniel Wellington',
        Category: 'Minimalist',
        'Model Name': 'Petite',
        'Reference No.': 'DA81922',
        'Price (USD)': 3227.83,
        Currency: 'USD',
        'Release Date': '24/02/2021',
        Gender: "Men's",
        'Case Material': 'Brass',
        'Case Diameter (mm)': 42.9,
        'Case Thickness (mm)': 12.1,
        'Dial Color': 'White',
        'Strap Material': 'Leather',
        'Strap Color': 'Black',
        'Water Resistance (m)': 30,
        'Crystal Type': 'Hardlex',
        'Movement Type': 'Quartz',
        'Power Reserve (hours)': 80,
        Complications: 'World Time',
        Availability: 'In Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Sweden',
      },
      {
        ID: 48,
        Brand: 'Hublot',
        Category: 'Luxury',
        'Model Name': 'Big Bang',
        'Reference No.': 'HU78673',
        'Price (USD)': 4878.2,
        Currency: 'USD',
        'Release Date': '15/08/2024',
        Gender: 'Unisex',
        'Case Material': 'Bioceramic',
        'Case Diameter (mm)': 37.8,
        'Case Thickness (mm)': 14.9,
        'Dial Color': 'Gold',
        'Strap Material': 'Nylon',
        'Strap Color': 'Black',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Gorilla Glass',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 60,
        Complications: 'Moonphase',
        Availability: 'Limited Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Switzerland',
      },
      {
        ID: 49,
        Brand: 'Apple',
        Category: 'Smartwatch',
        'Model Name': 'Watch Series',
        'Reference No.': 'AP60515',
        'Price (USD)': 3747.45,
        Currency: 'USD',
        'Release Date': '12/04/2025',
        Gender: 'Unisex',
        'Case Material': 'Brass',
        'Case Diameter (mm)': 43,
        'Case Thickness (mm)': 7.1,
        'Dial Color': 'Silver',
        'Strap Material': 'Silicone',
        'Strap Color': 'Brown',
        'Water Resistance (m)': 50,
        'Crystal Type': 'Mineral',
        'Movement Type': 'Smart',
        'Power Reserve (hours)': 60,
        Complications: 'World Time',
        Availability: 'Pre-Order',
        'Warranty (Years)': 3,
        'Country of Origin': 'China',
      },
      {
        ID: 50,
        Brand: 'Longines',
        Category: 'Dress',
        'Model Name': 'Master Collection',
        'Reference No.': 'LO81820',
        'Price (USD)': 14403.26,
        Currency: 'USD',
        'Release Date': '09/12/2022',
        Gender: 'Unisex',
        'Case Material': 'Aluminum',
        'Case Diameter (mm)': 43.8,
        'Case Thickness (mm)': 14.1,
        'Dial Color': 'Gray',
        'Strap Material': 'Silicone',
        'Strap Color': 'Gold',
        'Water Resistance (m)': 100,
        'Crystal Type': 'Sapphire',
        'Movement Type': 'Automatic',
        'Power Reserve (hours)': 40,
        Complications: 'GMT',
        Availability: 'Limited Stock',
        'Warranty (Years)': 3,
        'Country of Origin': 'Switzerland',
      },
    ];
    let listingsCreated = 0;

    for (const listing of listingsData) {
      try {
        // Parse release date
        const [day, month, year] = listing['Release Date'].split('/');
        const releaseDate = new Date(`${year}-${month}-${day}`);

        // Create product listing record matching your schema
        await tx.product_listings.create({
          data: {
            brand: listing.Brand,
            category: listing.Category,
            modelName: listing['Model Name'],
            referenceNo: listing['Reference No.'],
            priceUsd: listing['Price (USD)'],
            currency: listing.Currency,
            releaseDate: releaseDate,
            gender: listing.Gender,
            caseMaterial: listing['Case Material'],
            caseDiameterMm: listing['Case Diameter (mm)'],
            caseThicknessMm: listing['Case Thickness (mm)'],
            dialColor: listing['Dial Color'],
            strapMaterial: listing['Strap Material'],
            strapColor: listing['Strap Color'],
            waterResistanceM: listing['Water Resistance (m)'],
            crystalType: listing['Crystal Type'],
            movementType: listing['Movement Type'],
            powerReserveHours: listing['Power Reserve (hours)'],
            complications: listing.Complications,
            availability: listing.Availability,
            warrantyYears: listing['Warranty (Years)'],
            countryOfOrigin: listing['Country of Origin'],
          },
        });

        listingsCreated++;
      } catch (error) {
        console.error(
          `Failed to seed listing for ${listing['Reference No.']}:`,
          error,
        );
      }
    }

    console.log(`✅ Seeded ${listingsCreated} product listings`);
  }

  private async seedGlobalConfiguration(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('⚙️ Seeding global configuration...');

    const configurations = [
      {
        key: GlobalConfigKeys.PRODUCT_VIEWERSHIP_LAST_SEEN,
        value: 48,
      },
      {
        key: GlobalConfigKeys.NEW_ARRIVAL,
        value: 7,
      },
      {
        key: GlobalConfigKeys.POPULAR,
        value: 15,
      },
      {
        key: GlobalConfigKeys.BEST_SELLER,
        value: 10,
      },
      {
        key: GlobalConfigKeys.SEED_SCRIPT_RUN,
        value: 1,
      },
      {
        key: GlobalConfigKeys.PLATFORM_COMMISSION,
        value: 6.5,
      },
    ];

    for (const config of configurations) {
      await tx.globalConfiguration.upsert({
        where: { key: config.key },
        update: {
          value: new Decimal(config.value),
          updated_at: new Date(),
          updated_by: creatorId,
        },
        create: {
          key: config.key,
          value: new Decimal(config.value),
          created_at: new Date(),
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${configurations.length} global configurations`);
  }

  async getAnalyticsWindowHours(): Promise<number> {
    const config = await this.prisma.globalConfiguration.findUnique({
      where: { key: 'PRODUCT_VIEWERSHIP_LAST_SEEN' },
    });
    return config ? Number(config.value) : 48;
  }

  async getSeedScriptRunFlag(): Promise<number> {
    const config = await this.prisma.globalConfiguration.findUnique({
      where: { key: 'SEED_SCRIPT_RUN' },
    });
    return config ? Number(config.value) : 1;
  }
}
