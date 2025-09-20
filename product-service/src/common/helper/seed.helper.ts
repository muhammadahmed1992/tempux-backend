import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { HashidsService } from '../../hash-ids/hashids.service';
import { SlugService } from '../../slug/slug.service';
import { ConfigService } from '@nestjs/config';
import { GlobalConfigKeys } from '../../common/enums/global-config-keys';
import { AppLoggerService } from '../../common/logging';

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
            await this.seedCurrencies(creatorId, tx);
            await this.seedTaxes(creatorId, tx);
            await this.seedMaterials(creatorId, tx);
            await this.seedCrystals(creatorId, tx);
            await this.seedCountries(creatorId, tx);
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

            // Seed related data
            await this.seedTags(creatorId, tx);

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

  private async seedCurrencies(
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
  }

  private async seedTaxes(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log('💰 Seeding currencies and taxes...');

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
    });

    // Get components and conditions
    const watchComponents = await tx.watchComponents.findMany();
    const conditionsOfWear = await tx.condition_of_wear.findMany();

    let count = 0;
    for (const product of products) {
      // For each product, create 1-3 wear signs
      const numberOfWearSigns = getRandomInt(1, 3);

      for (let w = 0; w < numberOfWearSigns; w++) {
        const component = getRandomElement(watchComponents);
        const condition = getRandomElement(conditionsOfWear);

        if (component && condition) {
          await tx.wear_sign_component_condition_mapping.upsert({
            where: {
              product_id_watch_component_id_condition_id: {
                product_id: product.id,
                watch_component_id: component.id,
                condition_id: condition.id,
              },
            },
            update: {},
            create: {
              product_id: product.id,
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
        mandatory: true,
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
    console.log('✅ Seeded attribute category mappings');
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
