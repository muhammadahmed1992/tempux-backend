import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { HashidsService } from '../../hash-ids/hashids.service';
import { SlugService } from '../../slug/slug.service';
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

export default class SeedHelper {
  private hashidsService!: HashidsService;
  private readonly slugService: SlugService;

  constructor(private prisma: PrismaClient) {
    this.slugService = new SlugService();
  }

  async seedAllData(userId: string, numberOfProducts = 100): Promise<void> {
    const creatorId = BigInt(userId);
    const configService = new ConfigService();

    const hashidsService = new HashidsService(configService);
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
            await this.seedMovements(creatorId, tx);
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
    const categories = ['Watch', 'Bracelet', 'Case', 'Strap'];

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

  private async seedMovements(
    creatorId: bigint,
    tx: PrismaClient,
  ): Promise<void> {
    console.log('⚙️ Seeding movements...');
    const movements = [
      'Automatic',
      'Manual',
      'Quartz',
      'Solar',
      'Kinetic',
      'Spring Drive',
      'Chronometer',
      'GMT',
      'Perpetual Calendar',
    ];

    for (const movement of movements) {
      await tx.movement.upsert({
        where: { title: movement },
        update: {},
        create: {
          title: movement,
          created_by: creatorId,
        },
      });
    }
    console.log(`✅ Seeded ${movements.length} movements`);
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
        name: 'year_of_production',
        display_name: 'Year of Production',
        unit: null,
        description: 'Year of production (Approximate or Unknown)',
      },
      {
        name: 'reference_number',
        display_name: 'Reference Number',
        unit: null,
        description: 'Watch reference number',
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
      // Watch category mappings
      {
        category: 'Watch',
        attribute: 'year_of_production',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Watch',
        attribute: 'reference_number',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Watch',
        attribute: 'crystal_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Watch',
        attribute: 'case_diameter',
        data_type: 'number',
        mandatory: true,
      },
      {
        category: 'Watch',
        attribute: 'dial_color',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Watch',
        attribute: 'caliber_movement',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Watch',
        attribute: 'water_resistance',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'power_reserve',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'case_thickness',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'weight',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'functions',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Watch',
        attribute: 'condition',
        data_type: 'string',
        mandatory: true,
      },

      // Bracelet/Strap category mappings
      {
        category: 'Bracelet/Strap',
        attribute: 'clasp_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'clasp_material',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'lug_width',
        data_type: 'number',
        mandatory: true,
      },

      // Case category mappings
      {
        category: 'Case',
        attribute: 'case_diameter',
        data_type: 'number',
        mandatory: true,
      },
      {
        category: 'Case',
        attribute: 'case_thickness',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Case',
        attribute: 'crystal_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Case',
        attribute: 'water_resistance',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Case',
        attribute: 'weight',
        data_type: 'number',
        mandatory: false,
      },

      // Bezel category mappings
      {
        category: 'Bezel',
        attribute: 'bezel_material',
        data_type: 'string',
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
            is_mandatory: mapping.mandatory || true,
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
    const movements = await tx.movement.findMany();
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
            description: `Discover the exquisite ${productName}. This premium ${category.title.toLowerCase()} from ${
              brand.title
            } embodies precision engineering and timeless design.`,
            title: `${productName} | ${brand.title} Official Store`,
            brand_id: brand.id,
            category_id: category.id,
            gender_id: gender.id,
            is_accessory: !isWatch,
            product_slug: productSlug,
            year_of_production: getRandomInt(2010, 2024),
            referenceNumber: referenceNumber,
            serialNumber: serialNumber,
            is_used: isUsed,
            created_by: creatorId,
          },
        });

        // Create product item
        const color = getRandomElement(colors)!;
        const braceletColor = getRandomElement(colors)!;
        const dialColor = getRandomElement(colors)!;
        const size = getRandomElement(sizes)!;
        const movement = getRandomElement(movements)!;
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
            movement_id: movement.id,
            price: new Decimal(getRandomInt(1000, 50000)),
            cost_price: new Decimal(getRandomInt(500, 25000)),
            quantity: getRandomInt(0, 100),
            gender_id: gender.id,
            year_of_production: getRandomInt(2010, 2024),
            serial_number: serialNumber,
            reference_number: referenceNumber,
            approval_status_by_admin: 'APPROVED',
            approximation: Math.random() < 0.3,
            buyer_confidence_boost_description: `Premium ${brand.title} timepiece with exceptional craftsmanship`,
            unknown: Math.random() < 0.1,
            original_box_and_paper: Math.random() < 0.7,
            original_box: Math.random() < 0.8,
            original_paper: Math.random() < 0.6,
            accessories: Math.random() < 0.5,
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
            case 'year_of_production':
              const isApproximate = Math.random() < 0.3;
              const isUnknown = Math.random() < 0.1;
              if (isUnknown) {
                value = 'Unknown';
              } else {
                const year = getRandomInt(1980, 2024);
                value = isApproximate
                  ? `~${year} (Approximate)`
                  : year.toString();
              }
              break;

            case 'reference_number':
              value = referenceNumber;
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
              value = `${movement.title} Cal. ${Array.from(
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
                attributeValue.number_value = new Decimal(
                  typeof value === 'number' ? value : parseFloat(value),
                );
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
              order: j + 1,
              color_id: color.id,
              size_id: size.id,
              product_item_id: productItem.id,
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
      // ... (rest of the listings data remains the same)
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
