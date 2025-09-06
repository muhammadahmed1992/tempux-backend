import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  const userId = BigInt('1');

  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed basic reference data
    console.log('📦 Seeding basic reference data...');

    // Product Conditions
    const conditionData = [
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

    const productConditions: any[] = [];
    for (const cond of conditionData) {
      const condition = await prisma.productCondition.upsert({
        where: { condition: cond.condition },
        update: {},
        create: {
          condition: cond.condition,
          description: cond.description,
          created_by: userId,
        },
      });
      productConditions.push(condition);
    }

    console.log('✅ Product conditions seeded');

    // Brands
    const brandData = [
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

    const brands: any[] = [];
    for (const brandName of brandData) {
      const brand = await prisma.brand.upsert({
        where: { title: brandName },
        update: {},
        create: {
          title: brandName,
          order: brands.length + 1,
          created_by: userId,
          image_url: faker.image.url(),
        },
      });
      brands.push(brand);
    }

    // Categories
    const categoryData = ['Watch', 'Bracelet', 'Case', 'Strap'];
    const categories: any[] = [];
    for (const categoryName of categoryData) {
      const category = await prisma.category.upsert({
        where: { title: categoryName },
        update: {},
        create: {
          title: categoryName,
          order: categories.length + 1,
          created_by: userId,
          image_url: faker.image.url(),
        },
      });
      categories.push(category);
    }

    // Genders
    const genderData = ['Men', 'Women', 'Unisex'];
    const genders: any[] = [];
    for (const genderName of genderData) {
      const gender = await prisma.gender.upsert({
        where: { title: genderName },
        update: {},
        create: {
          title: genderName,
          order: genders.length + 1,
          created_by: userId,
          image_url: faker.image.url(),
        },
      });
      genders.push(gender);
    }

    // Colors
    const colorData = [
      { name: 'Black', code: '#000000', desc: 'Pure Black' },
      { name: 'White', code: '#FFFFFF', desc: 'Pure White' },
      { name: 'Silver', code: '#C0C0C0', desc: 'Silver' },
      { name: 'Gold', code: '#FFD700', desc: 'Gold' },
      { name: 'Blue', code: '#0000FF', desc: 'Blue' },
      { name: 'Green', code: '#008000', desc: 'Green' },
      { name: 'Red', code: '#FF0000', desc: 'Red' },
      { name: 'Brown', code: '#8B4513', desc: 'Brown' },
      { name: 'Rose Gold', code: '#E8B4B8', desc: 'Rose Gold' },
      { name: 'Champagne', code: '#F7E7CE', desc: 'Champagne' },
    ];

    const colors: any[] = [];
    for (const color of colorData) {
      const colorRecord = await prisma.color.upsert({
        where: { name: color.name },
        update: {},
        create: {
          name: color.name,
          colorCode: color.code,
          description: color.desc,
          created_by: userId,
        },
      });
      colors.push(colorRecord);
    }

    // Sizes
    const sizeData = [
      { width: 36, height: 36 },
      { width: 38, height: 38 },
      { width: 40, height: 40 },
      { width: 42, height: 42 },
      { width: 44, height: 44 },
      { width: 46, height: 46 },
      { width: 34, height: 34 },
      { width: 28, height: 28 },
      { width: 31, height: 31 },
    ];

    const sizes: any[] = [];
    for (const size of sizeData) {
      const sizeRecord = await prisma.size.upsert({
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
          created_by: userId,
        },
      });
      sizes.push(sizeRecord);
    }

    // Materials
    const materialData = [
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

    const materials: any[] = [];
    for (const materialName of materialData) {
      const material = await prisma.material.create({
        data: {
          title: materialName,
          created_by: userId,
        },
      });
      materials.push(material);
    }

    // Crystals
    const crystalData = ['Sapphire', 'Mineral', 'Acrylic', 'Hardlex'];
    const crystals: any[] = [];
    for (const crystalName of crystalData) {
      const crystal = await prisma.crystal.create({
        data: {
          title: crystalName,
          created_by: userId,
        },
      });
      crystals.push(crystal);
    }

    // Movements
    const movementData = [
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

    const movements: any[] = [];
    for (const movementName of movementData) {
      const movement = await prisma.movement.upsert({
        where: { title: movementName },
        update: {},
        create: {
          title: movementName,
          created_by: userId,
        },
      });
      movements.push(movement);
    }

    // Currency Exchange
    const currencyData = [
      { curr: 'USD', desc: 'US Dollar', rate: 1.0 },
      { curr: 'EUR', desc: 'Euro', rate: 0.85 },
      { curr: 'GBP', desc: 'British Pound', rate: 0.73 },
      { curr: 'JPY', desc: 'Japanese Yen', rate: 110.0 },
    ];

    const currencies: any[] = [];
    for (const currency of currencyData) {
      const currencyRecord = await prisma.currency_exchange.upsert({
        where: { curr: currency.curr },
        update: {},
        create: {
          curr: currency.curr,
          description: currency.desc,
          exchangeRate: currency.rate,
          created_by: userId,
        },
      });
      currencies.push(currencyRecord);
    }

    // Tax Rules
    const taxRule = await prisma.tax_rule.upsert({
      where: { description: 'Standard VAT' },
      update: {},
      create: {
        taxRate: 0.2,
        description: 'Standard VAT',
        created_by: userId,
      },
    });

    // Countries
    const countryData = [
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

    const countries: any[] = [];
    for (const countryName of countryData) {
      const country = await prisma.country.create({
        data: {
          name: countryName,
          created_by: userId,
        },
      });
      countries.push(country);
    }

    // Availability
    const availabilityData = [
      'In Stock',
      'Pre-order',
      'Out of Stock',
      'Discontinued',
    ];
    const availabilities: any[] = [];
    for (const status of availabilityData) {
      const availability = await prisma.availability.create({
        data: {
          status,
          created_by: userId,
        },
      });
      availabilities.push(availability);
    }

    // Complications
    const complicationData = [
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

    const complications: any[] = [];
    for (const complication of complicationData) {
      const complicationRecord = await prisma.complications.create({
        data: {
          title: complication,
          created_by: userId,
        },
      });
      complications.push(complicationRecord);
    }

    console.log('✅ Basic reference data seeded');

    // 2. Seed Dynamic Attribute System
    console.log('🏗️ Seeding dynamic attribute system...');

    // Product Attribute Categories
    const attributeCategoryData = [
      { name: 'Watch', is_active: true },
      { name: 'Bracelet/Strap', is_active: true },
      { name: 'Case', is_active: true },
      { name: 'Bezel', is_active: true },
      { name: 'Buckle', is_active: true },
      { name: 'Books/Calendar', is_active: true },
      { name: 'Box', is_active: true },
      { name: 'Case', is_active: true },
      { name: 'Crown/Pusher', is_active: true },
      { name: 'Cleaning', is_active: true },
      { name: 'Dial', is_active: true },
      { name: 'Hand(s)', is_active: true },
      { name: 'Movement(complete)', is_active: true },
      { name: 'Movement(parts)', is_active: true },
      { name: 'Link/Bar', is_active: true },
      { name: 'Other', is_active: true },
      { name: 'Tools', is_active: true },
      { name: 'Watch Winders', is_active: true },
    ];

    const attributeCategories: any[] = [];
    for (const category of attributeCategoryData) {
      const attrCategory = await prisma.productAttributeCategories.upsert({
        where: { name: category.name },
        update: {},
        create: {
          name: category.name,
          is_active: category.is_active,
          created_by: userId,
        },
      });
      attributeCategories.push(attrCategory);
    }

    // Attributes - Updated to remove data_type and properly use column_name for lookup references
    const attributeData = [
      // Free text attributes (column_name = 0 for no lookup)
      {
        name: 'year_of_production',
        display_name: 'Year of Production',
        column_name: 0,
        unit: null,
        description: 'Year of production (Approximate or Unknown)',
      },
      {
        name: 'reference_number',
        display_name: 'Reference Number',
        column_name: 0,
        unit: null,
        description: 'Watch reference number',
      },
      {
        name: 'caliber_movement',
        display_name: 'Caliber/Movement',
        column_name: 0,
        unit: null,
        description: 'Movement caliber information',
      },
      {
        name: 'clasp_type',
        display_name: 'Type of Clasp',
        column_name: 0,
        unit: null,
        description: 'Clasp mechanism type',
      },
      {
        name: 'functions',
        display_name: 'Functions',
        column_name: 0,
        unit: null,
        description: 'Watch functions and complications',
      },

      // Lookup table references (column_name references table IDs)
      {
        name: 'crystal_type',
        display_name: 'Crystal Type',
        column_name: 1,
        unit: null,
        description: 'Crystal material type (references crystal table)',
      },
      {
        name: 'dial_color',
        display_name: 'Dial Color',
        column_name: 2,
        unit: null,
        description: 'Color of the watch dial (references color table)',
      },
      {
        name: 'clasp_material',
        display_name: 'Clasp Material',
        column_name: 3,
        unit: null,
        description: 'Material of the clasp (references material table)',
      },
      {
        name: 'bezel_material',
        display_name: 'Bezel Material',
        column_name: 3,
        unit: null,
        description: 'Material of the bezel (references material table)',
      },

      // Numeric attributes
      {
        name: 'case_diameter',
        display_name: 'Case Diameter',
        column_name: 0,
        unit: 'mm',
        description: 'Case diameter in millimeters',
      },
      {
        name: 'lug_width',
        display_name: 'Lug Width',
        column_name: 0,
        unit: 'mm',
        description: 'Width between lugs',
      },
      {
        name: 'buckle_width',
        display_name: 'Buckle Width',
        column_name: 0,
        unit: 'mm',
        description: 'Width of the buckle',
      },
      {
        name: 'bracelet_length_long',
        display_name: 'Bracelet Length (Long Side)',
        column_name: 0,
        unit: 'mm',
        description: 'Length of bracelet long side',
      },
      {
        name: 'bracelet_length_short',
        display_name: 'Bracelet Length (Short Side)',
        column_name: 0,
        unit: 'mm',
        description: 'Length of bracelet short side',
      },
      {
        name: 'bracelet_thickness',
        display_name: 'Bracelet Thickness',
        column_name: 0,
        unit: 'mm',
        description: 'Thickness of the bracelet',
      },
      {
        name: 'water_resistance',
        display_name: 'Water Resistance',
        column_name: 0,
        unit: 'm',
        description: 'Water resistance in meters',
      },
      {
        name: 'power_reserve',
        display_name: 'Power Reserve',
        column_name: 0,
        unit: 'hours',
        description: 'Power reserve duration',
      },
      {
        name: 'case_thickness',
        display_name: 'Case Thickness',
        column_name: 0,
        unit: 'mm',
        description: 'Thickness of the case',
      },
      {
        name: 'weight',
        display_name: 'Weight',
        column_name: 0,
        unit: 'g',
        description: 'Weight of the watch',
      },
    ];

    const attributes: any[] = [];
    for (const attribute of attributeData) {
      const attr = await prisma.attributes.upsert({
        where: { name: attribute.name },
        update: {},
        create: {
          name: attribute.name,
          display_name: attribute.display_name,
          column_name: attribute.column_name,
          unit: attribute.unit,
          description: attribute.description,
          is_active: true,
          created_by: userId,
        },
      });
      attributes.push(attr);
    }

    // Attribute Category Mappings - Now with data_type specified here and expanded for all categories
    const mappingData = [
      // Watch category - core watch attributes
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
        attribute: 'serial_number',
        data_type: 'string',
        mandatory: false,
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

      // Bracelet/Strap category
      {
        category: 'Bracelet/Strap',
        attribute: 'clasp_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'strap_material',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'strap_color',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'lug_width',
        data_type: 'number',
        mandatory: true,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'bracelet_length_long',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'bracelet_length_short',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Bracelet/Strap',
        attribute: 'bracelet_thickness',
        data_type: 'number',
        mandatory: false,
      },

      // Case category
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
        attribute: 'case_material',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Case',
        attribute: 'case_shape',
        data_type: 'string',
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

      // Bezel category
      {
        category: 'Bezel',
        attribute: 'bezel_material',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Bezel',
        attribute: 'bezel_color',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Bezel',
        attribute: 'bezel_type',
        data_type: 'string',
        mandatory: true,
      },

      // Buckle category
      {
        category: 'Buckle',
        attribute: 'buckle_width',
        data_type: 'number',
        mandatory: true,
      },
      {
        category: 'Buckle',
        attribute: 'buckle_material',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Buckle',
        attribute: 'buckle_type',
        data_type: 'string',
        mandatory: true,
      },

      // Books/Calendar category
      {
        category: 'Books/Calendar',
        attribute: 'book_title',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Books/Calendar',
        attribute: 'publication_year',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Books/Calendar',
        attribute: 'language',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Books/Calendar',
        attribute: 'condition',
        data_type: 'string',
        mandatory: false,
      },

      // Box category
      {
        category: 'Box',
        attribute: 'box_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Box',
        attribute: 'box_material',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Box',
        attribute: 'box_color',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Box',
        attribute: 'box_size',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Box',
        attribute: 'condition',
        data_type: 'string',
        mandatory: false,
      },

      // Crown/Pusher category
      {
        category: 'Crown/Pusher',
        attribute: 'crown_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Crown/Pusher',
        attribute: 'crown_material',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Crown/Pusher',
        attribute: 'pusher_count',
        data_type: 'string',
        mandatory: false,
      },

      // Cleaning category
      {
        category: 'Cleaning',
        attribute: 'cleaning_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Cleaning',
        attribute: 'suitable_for',
        data_type: 'string',
        mandatory: false,
      },

      // Dial category
      {
        category: 'Dial',
        attribute: 'dial_color',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Dial',
        attribute: 'dial_pattern',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Dial',
        attribute: 'dial_markers',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Dial',
        attribute: 'dial_finish',
        data_type: 'string',
        mandatory: false,
      },

      // Hand(s) category
      {
        category: 'Hand(s)',
        attribute: 'hand_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Hand(s)',
        attribute: 'hand_material',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Hand(s)',
        attribute: 'hand_color',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Hand(s)',
        attribute: 'hand_style',
        data_type: 'string',
        mandatory: false,
      },

      // Movement(complete) category
      {
        category: 'Movement(complete)',
        attribute: 'movement_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Movement(complete)',
        attribute: 'power_reserve',
        data_type: 'number',
        mandatory: false,
      },
      {
        category: 'Movement(complete)',
        attribute: 'jewels',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Movement(complete)',
        attribute: 'frequency',
        data_type: 'string',
        mandatory: false,
      },

      // Movement(parts) category
      {
        category: 'Movement(parts)',
        attribute: 'part_name',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Movement(parts)',
        attribute: 'part_function',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Movement(parts)',
        attribute: 'compatible_movements',
        data_type: 'string',
        mandatory: false,
      },

      // Link/Bar category
      {
        category: 'Link/Bar',
        attribute: 'link_type',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Link/Bar',
        attribute: 'link_size',
        data_type: 'number',
        mandatory: true,
      },
      {
        category: 'Link/Bar',
        attribute: 'link_material',
        data_type: 'string',
        mandatory: false,
      },

      // Other category - flexible attributes
      {
        category: 'Other',
        attribute: 'condition',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Other',
        attribute: 'weight',
        data_type: 'number',
        mandatory: false,
      },

      // Tools category
      {
        category: 'Tools',
        attribute: 'tool_name',
        data_type: 'string',
        mandatory: true,
      },
      {
        category: 'Tools',
        attribute: 'tool_purpose',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Tools',
        attribute: 'tool_brand',
        data_type: 'string',
        mandatory: false,
      },

      // Watch Winders category
      {
        category: 'Watch Winders',
        attribute: 'winder_capacity',
        data_type: 'number',
        mandatory: true,
      },
      {
        category: 'Watch Winders',
        attribute: 'rotation_settings',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Watch Winders',
        attribute: 'power_source',
        data_type: 'string',
        mandatory: false,
      },
      {
        category: 'Watch Winders',
        attribute: 'winder_material',
        data_type: 'string',
        mandatory: false,
      },
    ];

    const mappings: any[] = [];
    for (const mapping of mappingData) {
      const category = attributeCategories.find(
        (c) => c.name === mapping.category,
      );
      const attribute = attributes.find((a) => a.name === mapping.attribute);

      if (category && attribute) {
        const attrMapping = await prisma.attributeCategoryMapping.upsert({
          where: {
            attribute_category_id_attribute_id: {
              attribute_category_id: category.id,
              attribute_id: attribute.id,
            },
          },
          update: {},
          create: {
            attribute_category_id: category.id,
            attribute_id: attribute.id,
            data_type: mapping.data_type,
            is_mandatory: mapping.mandatory,
            is_active: true,
            created_by: userId,
          },
        });
        mappings.push(attrMapping);
      }
    }

    console.log('✅ Dynamic attribute system seeded');

    // 3. Seed Products with Attributes
    console.log('🎯 Seeding products with dynamic attributes...');

    // First seed regular watch products
    const numberOfProducts = 450;
    const watchCategory = categories.find((c) => c.title === 'Watch');
    const watchMappings = mappings.filter((m) => {
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
    const referenceFormats = ['REF-', 'WR-', 'MT-', 'CL-', 'DX-'];

    for (let i = 0; i < numberOfProducts; i++) {
      try {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];

        // Generate unique reference number
        const refPrefix =
          referenceFormats[Math.floor(Math.random() * referenceFormats.length)];
        const refNumber = `${refPrefix}${brand.title
          .substring(0, 2)
          .toUpperCase()}${faker.string
          .alphanumeric({ length: 6 })
          .toUpperCase()}`;

        // Check if product with this reference already exists
        const existingItem = await prisma.product_items.findFirst({
          where: { reference_number: refNumber },
        });

        if (existingItem) {
          i--; // Retry this iteration
          continue;
        }

        // Create product
        const product = await prisma.product.create({
          data: {
            name: `${brand.title} ${faker.commerce.productName()}`,
            description: faker.commerce.productDescription(),
            title: `${brand.title} ${faker.commerce.productAdjective()} Watch`,
            brand_id: brand.id,
            category_id: watchCategory!.id,
            gender_id: gender.id,
            is_accessory: false,
            product_slug: faker.helpers
              .slugify(`${brand.title}-${faker.commerce.productName()}`)
              .toLowerCase(),
            created_by: userId,
          },
        });

        // Create product item
        const color = colors[Math.floor(Math.random() * colors.length)];
        const braceletColor = colors[Math.floor(Math.random() * colors.length)];
        const dialColor = colors[Math.floor(Math.random() * colors.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const movement =
          movements[Math.floor(Math.random() * movements.length)];
        const usdCurrency = currencies.find((c) => c.curr === 'USD')!;
        const crystal = crystals[Math.floor(Math.random() * crystals.length)];
        const caseMaterial =
          materials[Math.floor(Math.random() * materials.length)];
        const braceletMaterial =
          materials[Math.floor(Math.random() * materials.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const availability =
          availabilities[Math.floor(Math.random() * availabilities.length)];
        const complication =
          complications[Math.floor(Math.random() * complications.length)];

        const productItem = await prisma.product_items.create({
          data: {
            product_id: product.id,
            title: `${product.name} - ${color.name}`,
            color_id: color.id,
            bracelet_color_id: braceletColor.id,
            dial_color_id: dialColor.id,
            size_id: size.id,
            movement_id: movement.id,
            price: faker.number.float({
              min: 100,
              max: 50000,
              fractionDigits: 2,
            }),
            cost_price: faker.number.float({
              min: 50,
              max: 25000,
              fractionDigits: 2,
            }),
            quantity: faker.number.int({ min: 0, max: 100 }),
            gender_id: gender.id,
            year_of_production: faker.date.past({ years: 30 }).getFullYear(),
            serial_number: faker.string
              .alphanumeric({ length: 12 })
              .toUpperCase(),
            reference_number: refNumber,
            approval_status_by_admin: 'APPROVED',
            approximation: faker.datatype.boolean({ probability: 0.3 }),
            buyer_confidence_boost_description: faker.lorem.sentences(2),
            unknown: faker.datatype.boolean({ probability: 0.1 }),
            original_box_and_paper: faker.datatype.boolean({
              probability: 0.7,
            }),
            original_box: faker.datatype.boolean({ probability: 0.8 }),
            original_paper: faker.datatype.boolean({ probability: 0.6 }),
            accessories: faker.datatype.boolean({ probability: 0.5 }),
            crystal_id: crystal.id,
            case_material_id: caseMaterial.id,
            bracelet_material_id: braceletMaterial.id,
            complication_id: complication.id,
            release_date: faker.date.past({ years: 10 }),
            country_id: country.id,
            availability_id: availability.id,
            currency_id: usdCurrency.id,
            tax_rule_id: taxRule.id,
            seller_id: userId,
            power_reserve: faker.number.int({ min: 24, max: 168 }),
            base_image_url: faker.image.url(),
            sku: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
            discount: faker.number.float({
              min: 0,
              max: 20,
              fractionDigits: 2,
            }),
            warranty: faker.number.int({ min: 1, max: 5 }),
            created_by: userId,
          },
        });

        // Add dynamic attributes for the watch
        for (const mapping of watchMappings) {
          const attribute = attributes.find(
            (a) => a.id === mapping.attribute_id,
          );
          if (!attribute) continue;

          let value: any = null;

          // Handle attributes based on column_name for lookup references
          switch (attribute.name) {
            case 'year_of_production':
              const isApproximate = faker.datatype.boolean({
                probability: 0.3,
              });
              const isUnknown = faker.datatype.boolean({ probability: 0.1 });
              if (isUnknown) {
                value = 'Unknown';
              } else {
                const year = faker.date.past({ years: 50 }).getFullYear();
                value = isApproximate
                  ? `~${year} (Approximate)`
                  : year.toString();
              }
              break;

            case 'reference_number':
              value = refNumber;
              break;

            case 'crystal_type':
              // column_name = 1 references crystal table
              value = crystal.title;
              break;

            case 'case_diameter':
              value = faker.number.int({ min: 28, max: 50 });
              break;

            case 'dial_color':
              // column_name = 2 references color table
              value = dialColor.name;
              break;

            case 'caliber_movement':
              value = `${movement.title} Cal. ${faker.string
                .alphanumeric({ length: 4 })
                .toUpperCase()}`;
              break;

            case 'clasp_type':
              value = claspTypes[Math.floor(Math.random() * claspTypes.length)];
              break;

            case 'clasp_material':
              // column_name = 3 references material table
              value = braceletMaterial.title;
              break;

            case 'bezel_material':
              // column_name = 3 references material table
              value = caseMaterial.title;
              break;

            case 'lug_width':
              value = faker.number.int({ min: 16, max: 24 });
              break;

            case 'buckle_width':
              value = faker.number.int({ min: 14, max: 22 });
              break;

            case 'bracelet_length_long':
              value = faker.number.int({ min: 120, max: 140 });
              break;

            case 'bracelet_length_short':
              value = faker.number.int({ min: 75, max: 95 });
              break;

            case 'bracelet_thickness':
              value = faker.number.float({
                min: 2.5,
                max: 5.0,
                fractionDigits: 1,
              });
              break;

            case 'water_resistance':
              value = faker.helpers.arrayElement([
                30, 50, 100, 200, 300, 500, 1000,
              ]);
              break;

            case 'power_reserve':
              value = faker.number.int({ min: 24, max: 168 });
              break;

            case 'case_thickness':
              value = faker.number.float({
                min: 8.0,
                max: 18.0,
                fractionDigits: 1,
              });
              break;

            case 'weight':
              value = faker.number.int({ min: 80, max: 300 });
              break;

            case 'functions':
              const functionList = [
                'Date',
                'Day-Date',
                'GMT',
                'Chronograph',
                'Moon Phase',
              ];
              value = faker.helpers
                .arrayElements(functionList, { min: 1, max: 3 })
                .join(', ');
              break;
          }

          if (value !== null) {
            let attributeValue: any = {};

            switch (mapping.data_type) {
              case 'string':
                attributeValue.string_value = value.toString();
                break;
              case 'number':
                attributeValue.number_value =
                  typeof value === 'number' ? value : parseFloat(value);
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

            await prisma.productAttributeValueMapping.create({
              data: {
                attribute_category_mapping_id: mapping.id,
                product_id: product.id,
                ...attributeValue,
                created_by: userId,
              },
            });
          }
        }

        // Create product images
        const imageCount = faker.number.int({ min: 3, max: 8 });
        for (let j = 0; j < imageCount; j++) {
          await prisma.product_images.create({
            data: {
              img_url: faker.image.url(),
              alt_text: `${product.name} - Image ${j + 1}`,
              order: j + 1,
              color_id: color.id,
              size_id: size.id,
              product_item_id: productItem.id,
              created_by: userId,
            },
          });
        }

        if ((i + 1) % 50 === 0) {
          console.log(`✅ Seeded ${i + 1}/${numberOfProducts} products`);
        }
      } catch (error) {
        console.error(`❌ Failed to seed product ${i + 1}:`, error);
        // Continue with next product instead of failing completely
      }
    }

    console.log('✅ Products with dynamic attributes seeded');

    // Final verification
    const summary = {
      products: await prisma.product.count(),
      productItems: await prisma.product_items.count(),
      productImages: await prisma.product_images.count(),
      brands: await prisma.brand.count(),
      categories: await prisma.category.count(),
      attributes: await prisma.attributes.count(),
      attributeCategories: await prisma.productAttributeCategories.count(),
      attributeMappings: await prisma.attributeCategoryMapping.count(),
      attributeValues: await prisma.productAttributeValueMapping.count(),
      colors: await prisma.color.count(),
      materials: await prisma.material.count(),
    };

    console.log('\n📊 Seeding Summary:');
    Object.entries(summary).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
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
