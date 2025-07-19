import { CustomFilter } from "../enums/custom-filter.enum";
import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

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
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomChars = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const randomNumbers = String(Math.floor(Math.random() * 1000000)).padStart(
    6,
    "0"
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
  if (upperCaseCategory.includes("DIVE")) return "DVR";
  if (upperCaseCategory.includes("PILOT")) return "PLT";
  if (upperCaseCategory.includes("CHRONOGRAPH")) return "CHN";
  if (upperCaseCategory.includes("DRESS")) return "DRS";
  if (upperCaseCategory.includes("SMARTWATCH")) return "SMW";
  if (upperCaseCategory.includes("FIELD")) return "FLD";
  if (upperCaseCategory.includes("LUXURY")) return "LUX";
  if (upperCaseCategory.includes("DIGITAL")) return "DGT";
  return "GEN"; // Generic fallback if no specific match
};

const getColorCode = (colorName: string): string => {
  // Map common colors to 2-letter codes
  const lowerCaseColor = colorName.toLowerCase();
  if (lowerCaseColor.includes("stainless steel")) return "SS";
  if (lowerCaseColor.includes("black")) return "BK";
  if (lowerCaseColor.includes("white")) return "WH";
  if (lowerCaseColor.includes("gold")) return "GD"; // Covers Yellow Gold, Rose Gold, White Gold
  if (lowerCaseColor.includes("silver")) return "SV";
  if (lowerCaseColor.includes("blue")) return "BL";
  if (lowerCaseColor.includes("green")) return "GR";
  if (lowerCaseColor.includes("red")) return "RD";
  if (lowerCaseColor.includes("brown")) return "BR";
  if (lowerCaseColor.includes("ceramic")) return "CE";
  if (lowerCaseColor.includes("titanium")) return "TI";
  if (lowerCaseColor.includes("bronze")) return "BZ";
  return "OT"; // Other/Unknown
};

const getSizeCode = (sizeValue: number): string => {
  // Converts a number (e.g., 40, 42.5) to a 2-character string.
  // For simplicity and 2-char limit, we'll round and take last two digits.
  // If sizes are always integers (e.g., 38, 40, 42, 44), this is fine.
  // For 42.5, it will become '43'. If precision is needed, a 3-char code might be required.
  const roundedSize = Math.round(sizeValue);
  return String(roundedSize).padStart(2, "0").slice(-2); // Ensure 2 digits (e.g., "08", "42")
};

const generateSku = (
  brandTitle: string,
  categoryTitle: string,
  productReferenceNumber: number, // Full reference number (e.g., 123456)
  mainColorName: string,
  sizeValue: number,
  productionYear: number
): string => {
  const brandCode = getBrandCode(brandTitle); // 3 chars
  const categoryCode = getCategoryCode(categoryTitle); // 3 chars
  // Take last 4 digits of the product's reference number
  const productRefSnippet = String(productReferenceNumber)
    .padStart(6, "0")
    .slice(-4); // 4 chars
  const colorCode = getColorCode(mainColorName); // 2 chars
  const sizeCode = getSizeCode(sizeValue); // 2 chars
  const yearCode = String(productionYear).slice(-2); // Last 2 digits of year (2 chars)

  // Format: BRAND-CAT-REF4-CLR-SZ-YY (3+1+3+1+4+1+2+1+2+1+2 = 20 characters)
  return `${brandCode}-${categoryCode}-${productRefSnippet}-${colorCode}-${sizeCode}-${yearCode}`;
};

export default class SeedHelper {
  constructor(private prisma: PrismaClient) {}

  /**
   * Orchestrates the entire seeding process using upsert logic.
   * All operations are wrapped in a transaction to ensure atomicity.
   * @param userId The ID of the user performing the seeding (required for created_by fields).
   * @param numberOfProducts Target number of products to create (default 450).
   */
  async seedAllData(userId: string, numberOfProducts = 450): Promise<void> {
    const creatorId = BigInt(userId);

    console.log("Starting extensive data seeding with upsert logic...");

    try {
      await this.prisma.$transaction(
        async (tx: any) => {
          // Seed base data
          await this.seedColors(creatorId, tx);
          await this.seedSizes(creatorId, tx);
          await this.seedBrands(creatorId, tx);
          await this.seedCategories(creatorId, tx);
          await this.seedMovements(creatorId, tx);
          await this.seedTypes(creatorId, tx);
          await this.seedCurrenciesAndTaxes(creatorId, tx);

          // Seed products and variants (these must exist for dependent models)
          await this.seedProductsAndVariants(creatorId, numberOfProducts, tx);

          // Seed related media and user-generated content after products/variants are ready
          await this.seedOwnershipProofs(creatorId, tx);
          await this.seedSignOfWears(creatorId, tx);
          await this.seedProductImages(creatorId, tx);
          await this.seedTags(creatorId, tx); // Seed tags before product_tags
          await this.seedProductTags(creatorId, tx);
          await this.seedReviewsAndRatings(creatorId, tx); // Seed after products exist
          await this.seedFavorites(creatorId, tx); // Seed after products/variants exist
        },
        {
          timeout: 300000, // 5 minutes timeout for the entire transaction
        }
      );
      console.log("Extensive data seeding completed successfully!");
    } catch (error) {
      console.error(
        "Extensive data seeding failed and was rolled back:",
        error
      );
      throw error; // Re-throw to indicate overall failure
    }
  }

  private async seedColors(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log("Seeding colors (upserting)...");
    const colorsData = [
      {
        name: "Silver",
        colorCode: "#C0C0C0",
        description: "Classic metal finish".substring(0, 14),
      },
      {
        name: "Gold",
        colorCode: "#FFD700",
        description: "Luxurious yellow gold".substring(0, 14),
      },
      {
        name: "Black",
        colorCode: "#000000",
        description: "Deep black finish".substring(0, 14),
      },
      {
        name: "White",
        colorCode: "#FFFFFF",
        description: "Pristine white".substring(0, 14),
      },
      {
        name: "Rose Gold",
        colorCode: "#B76E79",
        description: "Warm pinkish gold".substring(0, 14),
      },
      {
        name: "Blue",
        colorCode: "#0000FF",
        description: "Vibrant blue".substring(0, 14),
      },
      {
        name: "Navy Blue",
        colorCode: "#000080",
        description: "Dark, deep blue".substring(0, 14),
      },
      {
        name: "Green",
        colorCode: "#008000",
        description: "Standard green".substring(0, 14),
      },
      {
        name: "Forest Green",
        colorCode: "#228B22",
        description: "Deep forest green".substring(0, 14),
      },
      {
        name: "Red",
        colorCode: "#FF0000",
        description: "Bright red".substring(0, 14),
      },
      {
        name: "Burgundy",
        colorCode: "#800020",
        description: "Rich deep red".substring(0, 14),
      },
      {
        name: "Gray",
        colorCode: "#808080",
        description: "Neutral gray".substring(0, 14),
      },
      {
        name: "Charcoal Gray",
        colorCode: "#36454F",
        description: "Dark matte gray".substring(0, 14),
      },
      {
        name: "Bronze",
        colorCode: "#CD7F32",
        description: "Earthy brown-orange".substring(0, 14),
      },
      {
        name: "Brown",
        colorCode: "#A52A2A",
        description: "Classic brown".substring(0, 14),
      },
      {
        name: "Titanium",
        colorCode: "#878A8F",
        description: "Matte gray titanium".substring(0, 14),
      },
      {
        name: "Ceramic Black",
        colorCode: "#080808",
        description: "Scratch-resistant black ceramic".substring(0, 14),
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
    console.log("Seeding sizes (upserting)...");
    const sizesData = [
      { value: 28, height: 28 },
      { value: 30, height: 30 },
      { value: 32, height: 32 },
      { value: 34, height: 34 },
      { value: 36, height: 36 },
      { value: 37, height: 37 },
      { value: 38, height: 38 },
      { value: 39, height: 39 },
      { value: 40, height: 40 },
      { value: 41, height: 41 },
      { value: 42, height: 42 },
      { value: 43, height: 43 },
      { value: 44, height: 44 },
      { value: 45, height: 45 },
      { value: 46, height: 46 },
      { value: 47, height: 47 },
      { value: 48, height: 48 },
      { value: 25, height: 30, widthUnit: "MM", heightUnit: "MM" },
      { value: 30, height: 40, widthUnit: "MM", heightUnit: "MM" },
    ];

    for (const data of sizesData) {
      await tx.size.upsert({
        where: { value_height: { value: data.value, height: data.height } },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${sizesData.length} sizes.`);
  }

  private async seedBrands(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log("Seeding brands (upserting)...");
    const brandsData = [
      { title: "Rolex", order: 1, image_url: "https://example.com/rolex.png" },
      { title: "Omega", order: 2, image_url: "https://example.com/omega.png" },
      {
        title: "Patek Philippe",
        order: 3,
        image_url: "https://example.com/patek.png",
      },
      {
        title: "Audemars Piguet",
        order: 4,
        image_url: "https://example.com/ap.png",
      },
      {
        title: "Vacheron Constantin",
        order: 5,
        image_url: "https://example.com/vc.png",
      },
      {
        title: "A. Lange & Söhne",
        order: 6,
        image_url: "https://example.com/alangesohne.png",
      },
      {
        title: "Jaeger-LeCoultre",
        order: 7,
        image_url: "https://example.com/jlc.png",
      },
      {
        title: "IWC Schaffhausen",
        order: 8,
        image_url: "https://example.com/iwc.png",
      },
      {
        title: "Breitling",
        order: 9,
        image_url: "https://example.com/breitling.png",
      },
      {
        title: "Zenith",
        order: 10,
        image_url: "https://example.com/zenith.png",
      },
      {
        title: "Blancpain",
        order: 11,
        image_url: "https://example.com/blancpain.png",
      },
      {
        title: "Cartier",
        order: 12,
        image_url: "https://example.com/cartier.png",
      },
      {
        title: "Longines",
        order: 13,
        image_url: "https://example.com/longines.png",
      },
      {
        title: "Tissot",
        order: 14,
        image_url: "https://example.com/tissot.png",
      },
      {
        title: "Hamilton",
        order: 15,
        image_url: "https://example.com/hamilton.png",
      },
      { title: "Oris", order: 16, image_url: "https://example.com/oris.png" },
      {
        title: "Citizen",
        order: 17,
        image_url: "https://example.com/citizen.png",
      },
      { title: "Seiko", order: 18, image_url: "https://example.com/seiko.png" },
      { title: "Casio", order: 19, image_url: "https://example.com/casio.png" },
      {
        title: "Fossil",
        order: 20,
        image_url: "https://example.com/fossil.png",
      },
      { title: "Timex", order: 21, image_url: "https://example.com/timex.png" },
      {
        title: "Swatch",
        order: 22,
        image_url: "https://example.com/swatch.png",
      },
      {
        title: "Grand Seiko",
        order: 23,
        image_url: "https://example.com/grandseiko.png",
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

  private async seedCategories(
    creatorId: bigint,
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding categories (upserting)...");
    const categoriesData = [
      {
        title: "Luxury Watches",
        order: 1,
        image_url: "https://example.com/cat_luxury.png",
      },
      {
        title: "Sports Watches",
        order: 2,
        image_url: "https://example.com/cat_sports.png",
      },
      {
        title: "Smartwatches",
        order: 3,
        image_url: "https://example.com/cat_smart.png",
      },
      {
        title: "Dress Watches",
        order: 4,
        image_url: "https://example.com/cat_dress.png",
      },
      {
        title: "Dive Watches",
        order: 5,
        image_url: "https://example.com/cat_dive.png",
      },
      {
        title: "Pilot Watches",
        order: 6,
        image_url: "https://example.com/cat_pilot.png",
      },
      {
        title: "Field Watches",
        order: 7,
        image_url: "https://example.com/cat_field.png",
      },
      {
        title: "Chronographs",
        order: 8,
        image_url: "https://example.com/cat_chrono.png",
      },
      {
        title: "GMT Watches",
        order: 9,
        image_url: "https://example.com/cat_gmt.png",
      },
      {
        title: "Fashion Watches",
        order: 10,
        image_url: "https://example.com/cat_fashion.png",
      },
      {
        title: "Digital Watches",
        order: 11,
        image_url: "https://example.com/cat_digital.png",
      },
      {
        title: "Skeleton Watches",
        order: 12,
        image_url: "https://example.com/cat_skeleton.png",
      },
      {
        title: "Complication Watches",
        order: 13,
        image_url: "https://example.com/cat_complication.png",
      },
      {
        title: "Vintage Watches",
        order: 14,
        image_url: "https://example.com/cat_vintage.png",
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
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding movements (upserting)...");
    const movementsData = [
      { title: "Automatic" },
      { title: "Quartz" },
      { title: "Manual Wind" },
      { title: "Smartwatch" },
      { title: "Solar-Powered" },
      { title: "Kinetic" },
      { title: "Spring Drive" },
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

  private async seedTypes(creatorId: bigint, tx: PrismaClient): Promise<void> {
    console.log("Seeding types (gender/style, upserting)...");
    const typesData = [
      {
        title: "Men's",
        order: 1,
        image_url: "https://example.com/type_mens.png",
      },
      {
        title: "Women's",
        order: 2,
        image_url: "https://example.com/type_womens.png",
      },
      {
        title: "Unisex",
        order: 3,
        image_url: "https://example.com/type_unisex.png",
      },
    ];
    for (const data of typesData) {
      await tx.type.upsert({
        where: { title: data.title },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${typesData.length} types (gender/style).`);
  }

  private async seedCurrenciesAndTaxes(
    creatorId: bigint,
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding currencies and tax rules (upserting)...");
    await tx.currency_exchange.upsert({
      where: { curr: "$" },
      update: {
        description: "United States Dollar",
        exchangeRate: new Decimal(1.0),
        updated_by: creatorId,
      },
      create: {
        curr: "$",
        description: "United States Dollar",
        exchangeRate: new Decimal(1.0),
        created_by: creatorId,
      },
    });
    await tx.currency_exchange.upsert({
      where: { curr: "RP" },
      update: {
        description: "Pakistani Rupee",
        exchangeRate: new Decimal(278.0),
        updated_by: creatorId,
        is_deleted: true,
      },
      create: {
        curr: "RP",
        description: "Pakistani Rupee",
        exchangeRate: new Decimal(278.0),
        created_by: creatorId,
        is_deleted: true,
      },
    });

    await tx.tax_rule.upsert({
      where: { description: "Standard Sales Tax (10%)" },
      update: { taxRate: new Decimal(0.1), updated_by: creatorId },
      create: {
        taxRate: new Decimal(0.1),
        description: "Standard Sales Tax (10%)",
        created_by: creatorId,
      },
    });
    await tx.tax_rule.upsert({
      where: { description: "Luxury Goods Tax (20%)" },
      update: { taxRate: new Decimal(0.2), updated_by: creatorId },
      create: {
        taxRate: new Decimal(0.2),
        description: "Luxury Goods Tax (20%)",
        created_by: creatorId,
      },
    });
    await tx.tax_rule.upsert({
      where: { description: "No Tax" },
      update: { taxRate: new Decimal(0.0), updated_by: creatorId },
      create: {
        taxRate: new Decimal(0.0),
        description: "No Tax",
        created_by: creatorId,
      },
    });
    console.log("Currencies and Tax Rules seeded.");
  }

  private async seedProductsAndVariants(
    creatorId: bigint,
    numberOfProducts: number,
    tx: PrismaClient // Use the transactional client
  ): Promise<void> {
    console.log(`Attempting to seed up to ${numberOfProducts} products...`);

    const allColors = await tx.color.findMany();
    const allSizes = await tx.size.findMany();
    const allBrands = await tx.brand.findMany();
    const allCategories = await tx.category.findMany();
    const allMovements = await tx.movement.findMany();
    const allTypes = await tx.type.findMany();
    const defaultCurrency = await tx.currency_exchange.findUnique({
      where: { curr: "USD" },
    });
    const standardTax = await tx.tax_rule.findUnique({
      where: { description: "Standard Sales Tax (10%)" },
    });
    const luxuryTax = await tx.tax_rule.findUnique({
      where: { description: "Luxury Goods Tax (20%)" },
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
      allTypes.length === 0
    ) {
      console.error(
        "Missing required base data (currency, tax, or lookup entities like brands, categories, movements, colors, sizes, types) for product variant seeding. Please ensure they are seeded."
      );
      return;
    }

    // --- STEP 1: Seed CustomFilterConfigurator (mapped to 'configurator' table) ---
    const customCategoryConfigs: {
      [key: string]: { id: bigint; key: string };
    } = {};
    // Use CustomFilter enum for consistent keys
    const customFilterKeys = Object.values(CustomFilter);

    for (const key of customFilterKeys) {
      const configValue =
        key === CustomFilter.NEW_ARRIVAL ? "30" : "category_marker"; // '30' for New Arrival days, 'category_marker' for others
      const description =
        key === CustomFilter.NEW_ARRIVAL
          ? "Number of days to consider a product as new arrival"
          : `Marker for ${key} custom product category`;

      const config = await tx.customFilterConfigurator.upsert({
        where: { key },
        update: {
          value: configValue,
          description: description,
          updated_by: creatorId,
          is_deleted: false, // Ensure it's not marked as deleted
          deleted_at: null,
          deleted_by: null,
        },
        create: {
          key: key,
          value: configValue,
          description: description,
          created_by: creatorId,
          is_deleted: false,
        },
      });
      customCategoryConfigs[key] = { id: config.id, key: config.key }; // Store ID and key for later use
    }
    console.log("Seeded CustomFilterConfigurator entries.");

    // --- End STEP 1 ---

    const getNameSuffix = (categoryTitle: string) => {
      if (categoryTitle.includes("Dive")) return "Pro Diver";
      if (categoryTitle.includes("Pilot")) return "Pilot Chrono";
      if (categoryTitle.includes("Chronograph")) return "Racing";
      if (categoryTitle.includes("Dress")) return "Elegance";
      if (categoryTitle.includes("Smartwatch")) return "Connect";
      if (categoryTitle.includes("Field")) return "Explorer";
      if (categoryTitle.includes("Luxury")) return "Masterpiece";
      if (categoryTitle.includes("Digital")) return "Digital";
      return "Classic";
    };

    let productsCreated = 0;
    const existingReferenceNumbers = new Set(
      (await tx.product.findMany({ select: { reference_number: true } })).map(
        (p) => Number(p.reference_number)
      )
    );
    const existingSerialNumbers = new Set(
      (await tx.product.findMany({ select: { serial_number: true } })).map(
        (p) => p.serial_number
      )
    );
    const existingSkus = new Set(
      (await tx.product_variants.findMany({ select: { sku: true } })).map(
        (pv) => pv.sku
      )
    );

    const MAX_GENERATION_ATTEMPTS = numberOfProducts * 10;
    let overallAttemptCount = 0;

    const createdVariantIds: bigint[] = []; // Collect IDs of newly created variants

    for (
      let i = 0;
      productsCreated < numberOfProducts &&
      overallAttemptCount < MAX_GENERATION_ATTEMPTS;
      i++
    ) {
      overallAttemptCount++;

      const brand = getRandomElement(allBrands);
      const category = getRandomElement(allCategories);
      const type = getRandomElement(allTypes);

      if (!brand || !category || !type) {
        console.warn(
          "Skipping product creation due to missing base data (brand, category, or type). This should not happen if initial checks pass."
        );
        continue;
      }

      let basePrice: number;
      switch (brand.title) {
        case "Patek Philippe":
        case "Audemars Piguet":
        case "Vacheron Constantin":
        case "A. Lange & Söhne":
          basePrice = getRandomInt(40000, 250000);
          break;
        case "Rolex":
        case "Omega":
        case "Jaeger-LeCoultre":
        case "IWC Schaffhausen":
        case "Breitling":
        case "Zenith":
        case "Blancpain":
        case "Cartier":
        case "Grand Seiko":
          basePrice = getRandomInt(5000, 40000);
          break;
        case "Longines":
          basePrice = getRandomInt(1000, 4000);
          break;
        case "Tissot":
        case "Hamilton":
        case "Oris":
          basePrice = getRandomInt(300, 1500);
          break;
        case "Citizen":
        case "Seiko":
          basePrice = getRandomInt(150, 800);
          break;
        case "Casio":
        case "Timex":
          basePrice = getRandomInt(50, 300);
          break;
        case "Fossil":
        case "Swatch":
          basePrice = getRandomInt(100, 400);
          break;
        default:
          basePrice = getRandomInt(200, 1000);
      }

      if (category.title.includes("Smartwatch"))
        basePrice = getRandomInt(150, 600);
      if (category.title.includes("Chronographs"))
        basePrice += getRandomInt(100, 500);
      if (category.title.includes("Complication"))
        basePrice += getRandomInt(1000, 10000);
      if (category.title.includes("Digital")) basePrice = getRandomInt(50, 250);

      const productNameSuffix = getNameSuffix(category.title);
      const productName = `${brand.title} ${productNameSuffix} ${getRandomInt(
        100,
        999
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
            `Could not generate unique serial number for product after ${MAX_SERIAL_ATTEMPTS} attempts. Skipping this product.`
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
            `Could not generate unique reference number for product after ${MAX_SERIAL_ATTEMPTS} attempts. Skipping this product.`
          );
          break;
        }
      } while (existingReferenceNumbers.has(referenceNumber));
      if (refAttemptCount > MAX_SERIAL_ATTEMPTS) continue;

      existingSerialNumbers.add(serialNumber);
      existingReferenceNumbers.add(referenceNumber);

      const productionYear = getRandomInt(2010, 2024);

      let createdProduct;
      try {
        createdProduct = await tx.product.upsert({
          where: { reference_number: referenceNumber },
          update: {
            updated_by: creatorId,
            name: productName,
            description: productDescription,
            title: productTitle,
            brand_id: brand.id,
            category_id: category.id,
            type_id: type.id,
            year_of_production: productionYear,
            serial_number: serialNumber,
          },
          create: {
            name: productName,
            description: productDescription,
            title: productTitle,
            brand_id: brand.id,
            category_id: category.id,
            type_id: type.id,
            is_accessory: false,
            year_of_production: productionYear,
            serial_number: serialNumber,
            reference_number: referenceNumber,
            created_by: creatorId,
            approval_status_by_admin: "APPROVED",
          },
        });
        productsCreated++;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          console.warn(
            `Product with serial number ${serialNumber} or reference number ${referenceNumber} already exists in DB. Retrying with a new one.`
          );
          i--;
          continue;
        } else {
          console.error(`Error creating product ${productName}:`, error);
          throw error;
        }
      }

      const numberOfVariants = getRandomInt(1, 4);
      const usedVariantCombos = new Set<string>();
      const MAX_VARIANT_ATTEMPTS = 10;

      for (let j = 0; j < numberOfVariants; j++) {
        let variantAttemptCount = 0;
        let mainColor, braceletColor, dialColor, size, movement;
        let variantSku;

        do {
          mainColor = getRandomElement(allColors);
          braceletColor = getRandomElement(allColors);
          dialColor = getRandomElement(allColors);
          size = getRandomElement(allSizes);
          const tempMovement = getRandomElement(allMovements);

          if (
            category.title.includes("Smartwatch") &&
            tempMovement?.title !== "Smartwatch"
          ) {
            movement = allMovements.find((m) => m.title === "Smartwatch");
          } else if (
            !category.title.includes("Smartwatch") &&
            tempMovement?.title === "Smartwatch"
          ) {
            movement = getRandomElement(
              allMovements.filter((m) => m.title !== "Smartwatch")
            );
          } else {
            movement = tempMovement;
          }

          if (
            !mainColor ||
            !braceletColor ||
            !dialColor ||
            !size ||
            !movement
          ) {
            console.warn(
              `Incomplete data for variant creation (color, size, or movement). Retrying variant.`
            );
            variantAttemptCount++;
            continue;
          }

          const comboKey = `${mainColor.id}-${braceletColor.id}-${dialColor.id}-${size.id}`;
          if (usedVariantCombos.has(comboKey)) {
            variantAttemptCount++;
            continue;
          }

          variantSku = generateSku(
            brand.title,
            category.title,
            Number(createdProduct.reference_number),
            mainColor.name,
            size.value,
            createdProduct.year_of_production
          ).substring(0, 19);

          if (existingSkus.has(variantSku)) {
            variantAttemptCount++;
            continue;
          }

          break;
        } while (variantAttemptCount < MAX_VARIANT_ATTEMPTS);

        if (variantAttemptCount >= MAX_VARIANT_ATTEMPTS) {
          console.warn(
            `Could not create unique variant for product ${createdProduct.id} after ${MAX_VARIANT_ATTEMPTS} attempts. Skipping this variant.`
          );
          continue;
        }

        usedVariantCombos.add(
          `${mainColor!.id}-${braceletColor!.id}-${dialColor!.id}-${size!.id}`
        );
        existingSkus.add(variantSku!);

        let variantPrice = basePrice + getRandomInt(-100, 500);
        if (
          mainColor!.name.includes("Gold") ||
          mainColor!.name.includes("Rose Gold")
        ) {
          variantPrice += getRandomInt(500, 5000);
        } else if (mainColor!.name.includes("Bronze")) {
          variantPrice += getRandomInt(100, 500);
        }

        let caseMaterial = "Stainless Steel";
        let braceletMaterial = "Stainless Steel";

        if (mainColor!.name.includes("Gold")) {
          caseMaterial = "Gold";
          braceletMaterial = "Gold";
        } else if (mainColor!.name.includes("Bronze")) {
          caseMaterial = "Bronze";
        } else if (mainColor!.name.includes("Ceramic")) {
          caseMaterial = "Ceramic";
          braceletMaterial = "Ceramic";
        } else if (mainColor!.name.includes("Titanium")) {
          caseMaterial = "Titanium";
          braceletMaterial = "Titanium";
        }

        if (getRandomInt(0, 100) < 30) {
          if (getRandomInt(0, 1) === 0) {
            braceletMaterial = "Leather";
            variantPrice -= getRandomInt(50, 200);
          } else {
            braceletMaterial = "Rubber";
            variantPrice -= getRandomInt(20, 100);
          }
        }

        if (variantPrice < 50) variantPrice = 50;

        const brandSlug = brand.title.toLowerCase().replace(/\s/g, "-");
        const categorySlug = category.title.toLowerCase().replace(/\s/g, "-");
        const mainColorSlug = mainColor!.name.toLowerCase().replace(/\s/g, "-");
        const sizeSlug = String(size!.value).replace(".", "-").toLowerCase();

        const baseImageUrl = `https://images.watchstore.com/watches/${brandSlug}-${categorySlug}-${mainColorSlug}-${sizeSlug}.jpg`;

        try {
          const createdProductVariant = await tx.product_variants.upsert({
            where: { sku: variantSku! },
            update: {
              updated_by: creatorId,
              quantity: getRandomInt(1, 20),
              base_image_url: baseImageUrl,
              sku: variantSku!,
            },
            create: {
              product_id: createdProduct.id,
              color_id: mainColor!.id,
              bracelet_color_id: braceletColor!.id,
              dial_color_id: dialColor!.id,
              size_id: size!.id,
              movement_id: movement!.id,
              price: new Decimal(variantPrice),
              cost_price: new Decimal(variantPrice * 0.7),
              quantity: getRandomInt(1, 20),
              original_box_and_paper: getRandomInt(0, 1) === 1,
              original_box: getRandomInt(0, 1) === 1,
              original_paper: getRandomInt(0, 1) === 1,
              accessories: getRandomInt(0, 1) === 1,
              case_material: caseMaterial,
              bracelet_material: braceletMaterial,
              currency_id: defaultCurrency.id,
              tax_rule_id:
                category.title.includes("Luxury") || basePrice > 5000
                  ? luxuryTax.id
                  : standardTax.id,
              created_by: creatorId,
              base_image_url: baseImageUrl,
              sku: variantSku!,
            },
          });
          createdVariantIds.push(createdProductVariant.id); // Collect ID
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            error.meta?.target === "sku"
          ) {
            console.warn(
              `SKU ${variantSku} already exists in DB. Retrying this variant.`
            );
            j--;
            existingSkus.delete(variantSku!);
            continue;
          }
          console.error(
            `Error upserting product variant for product ${createdProduct.id} (Color: ${mainColor?.name}, Size: ${size?.value}mm):`,
            error
          );
          throw error;
        }
      }
    }
    console.log(`Seeded ${productsCreated} new products and their variants.`);

    // --- STEP 2: Populate CustomProductCategory for *some* variants ---
    const assignableCustomCategories = [
      CustomFilter.TOP_SELLER,
      CustomFilter.BEST_SELLER,
      CustomFilter.POPULAR,
      // CustomFilter.NEW_ARRIVAL is handled dynamically in service, not stored here
    ];

    for (const variantId of createdVariantIds) {
      // Randomly assign between 0 and 2 custom categories to each new variant
      const numCategoriesToAssign = getRandomInt(0, 2);
      const assignedTypesForVariant = new Set<CustomFilter>();

      for (let k = 0; k < numCategoriesToAssign; k++) {
        const categoryType = getRandomElement(assignableCustomCategories);
        if (!categoryType || assignedTypesForVariant.has(categoryType)) {
          continue; // Skip if no type found or already assigned this type
        }

        const configEntry = customCategoryConfigs[categoryType];
        if (!configEntry) {
          console.warn(
            `Config entry for custom filter type '${categoryType}' not found. Skipping CustomProductCategory assignment for variant ${variantId}.`
          );
          continue;
        }

        try {
          await tx.customProductCategory.upsert({
            where: {
              product_variant_id_custom_filter_configuration_id: {
                product_variant_id: variantId,
                custom_filter_configuration_id: configEntry.id,
              },
            },
            update: {
              valid_from: new Date(), // Refresh 'valid_from' on update
              valid_to: null, // Keep valid indefinitely for seeding
            },
            create: {
              product_variant_id: variantId,
              custom_filter_configuration_id: configEntry.id,
              valid_from: new Date(),
              valid_to: null, // For seeding, make them perpetually valid
            },
          });
          assignedTypesForVariant.add(categoryType);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            console.warn(
              `CustomProductCategory for variant ${variantId} and config ${configEntry.key} already exists. Skipping duplicate.`
            );
          } else {
            console.error(
              `Error upserting CustomProductCategory for variant ${variantId} and type ${categoryType}:`,
              error
            );
            // Decide if you want to rethrow or just log for seeding
          }
        }
      }
    }
    console.log(`Populated CustomProductCategory for newly created variants.`);
  }

  // --- NEW SEEDING METHODS FOR THE MISSED MODELS ---

  private async seedOwnershipProofs(
    creatorId: bigint,
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding ownership proofs...");
    const products = await tx.product.findMany({ select: { id: true } });
    const productVariants = await tx.product_variants.findMany({
      select: { id: true, product_id: true },
    });

    if (products.length === 0 || productVariants.length === 0) {
      console.warn(
        "No products or product variants found to attach ownership proofs. Skipping."
      );
      return;
    }

    const maxProofsPerVariant = 2; // Max number of proofs per product variant
    const proofsCreated = new Set<string>(); // To track unique product_id, product_variant_id combos

    for (const variant of productVariants) {
      if (proofsCreated.has(`${variant.product_id}-${variant.id}`)) {
        continue; // Already added proofs for this variant
      }

      const numProofs = getRandomInt(0, maxProofsPerVariant); // 0, 1, or 2 proofs
      for (let i = 0; i < numProofs; i++) {
        const imageUrl = `https://picsum.photos/id/${getRandomInt(
          100,
          200
        )}/600/400`;
        const altText = `Proof image for product variant ${variant.id}`;

        try {
          await tx.ownership_proof.upsert({
            where: {
              product_id_product_variant_id: {
                product_id: variant.product_id,
                product_variant_id: variant.id,
              },
            },
            update: {
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1,
              updated_by: creatorId,
            },
            create: {
              product_id: variant.product_id,
              product_variant_id: variant.id,
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1,
              created_by: creatorId,
            },
          });
          proofsCreated.add(`${variant.product_id}-${variant.id}`); // Mark combo as used
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            // Unique constraint violation, means it was upserted or another loop iteration already added it
            // This can happen if numProofs > 1 and we are trying to create multiple for the same unique combo.
            // We only allow one unique product_id, product_variant_id combo per entry as per your schema.
            // If you want multiple proofs, the unique constraint should be on just `id`.
            // For now, based on your schema `@@unique([product_id, product_variant_id])`, we'll only create one.
            if (numProofs > 1) {
              console.warn(
                `Attempted to add multiple ownership proofs for product variant ${variant.id}, but schema only allows one unique entry per product_id, product_variant_id combination. Only one will be created.`
              );
              break; // Stop trying to add more for this variant if unique constraint hit
            }
          } else {
            console.error(
              `Error seeding ownership proof for variant ${variant.id}:`,
              error
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
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding signs of wear...");
    const products = await tx.product.findMany({ select: { id: true } });
    const productVariants = await tx.product_variants.findMany({
      select: { id: true, product_id: true },
    });

    if (products.length === 0 || productVariants.length === 0) {
      console.warn(
        "No products or product variants found to attach signs of wear. Skipping."
      );
      return;
    }

    const maxSignsPerVariant = 3; // Max number of signs of wear per product variant
    const signsCreated = new Set<string>(); // To track unique product_id, product_variant_id combos

    for (const variant of productVariants) {
      if (signsCreated.has(`${variant.product_id}-${variant.id}`)) {
        continue; // Already added signs for this variant
      }

      const numSigns = getRandomInt(0, maxSignsPerVariant); // 0 to 3 signs
      for (let i = 0; i < numSigns; i++) {
        const imageUrl = `https://picsum.photos/id/${getRandomInt(
          200,
          300
        )}/600/400`;
        const altText = `Sign of wear image for product variant ${variant.id}`;

        try {
          await tx.sign_of_wear.upsert({
            where: {
              product_id_product_variant_id: {
                product_id: variant.product_id,
                product_variant_id: variant.id,
              },
            },
            update: {
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1,
              updated_by: creatorId,
            },
            create: {
              product_id: variant.product_id,
              product_variant_id: variant.id,
              image_url: imageUrl,
              alt_text: altText,
              order: i + 1,
              created_by: creatorId,
            },
          });
          signsCreated.add(`${variant.product_id}-${variant.id}`); // Mark combo as used
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            // Same logic as ownership_proof: your schema unique constraint means only one unique entry.
            if (numSigns > 1) {
              console.warn(
                `Attempted to add multiple signs of wear for product variant ${variant.id}, but schema only allows one unique entry per product_id, product_variant_id combination. Only one will be created.`
              );
              break;
            }
          } else {
            console.error(
              `Error seeding sign of wear for variant ${variant.id}:`,
              error
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
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding product images...");
    const productVariants = await tx.product_variants.findMany({
      select: { id: true, color_id: true, size_id: true },
    });

    if (productVariants.length === 0) {
      console.warn("No product variants found to attach images. Skipping.");
      return;
    }

    let imagesCreatedCount = 0;
    const maxImagesPerVariant = 5;

    for (const variant of productVariants) {
      const numImages = getRandomInt(1, maxImagesPerVariant); // At least 1 image per variant

      for (let i = 0; i < numImages; i++) {
        const imgUrl = `https://picsum.photos/id/${getRandomInt(
          1,
          100
        )}/800/600?random=${variant.id}-${i}`;
        const altText = `Image ${i + 1} for variant ${variant.id}`;

        try {
          // product_images doesn't have a unique constraint on product_variant_id,
          // so we don't need upsert for uniqueness here if we intend to add multiple.
          // If you *do* want uniqueness for img_url + variant combo, you'd add @@unique([img_url, product_variant_id]) to schema.
          await tx.product_images.create({
            data: {
              img_url: imgUrl,
              alt_text: altText,
              order: i + 1,
              color_id: variant.color_id, // Link to variant's color
              size_id: variant.size_id, // Link to variant's size
              product_variant_id: variant.id,
              created_by: creatorId,
            },
          });
          imagesCreatedCount++;
        } catch (error) {
          console.error(
            `Error seeding product image for variant ${variant.id}:`,
            error
          );
          throw error;
        }
      }
    }
    console.log(`Seeded ${imagesCreatedCount} product images.`);
  }

  private async seedReviewsAndRatings(
    creatorId: bigint,
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding reviews and ratings...");
    const products = await tx.product.findMany({
      select: { id: true, name: true },
    });
    // For `reviewedBy`, assuming `creatorId` can act as a user ID for seeding purposes.
    // In a real app, you'd fetch actual user IDs.

    if (products.length === 0) {
      console.warn("No products found to add reviews to. Skipping.");
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
            error.code === "P2002"
          ) {
            console.warn(
              `Review for product ${product.id} by user ${creatorId} already exists. Skipping duplicate.`
            );
          } else {
            console.error(
              `Error seeding review for product ${product.id}:`,
              error
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
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding favorites...");
    // For `user_id`, assuming `creatorId` can act as a user ID for seeding purposes.
    const products = await tx.product.findMany({ select: { id: true } });
    const productVariants = await tx.product_variants.findMany({
      select: { id: true, product_id: true },
    });

    if (products.length === 0 || productVariants.length === 0) {
      console.warn(
        "No products or product variants found for favorites. Skipping."
      );
      return;
    }

    const favoritesAdded = new Set<string>(); // To track unique [user_id, product_id, product_variant_id]
    let favoritesCount = 0;

    // Pick a random subset of product variants to mark as favorite
    const variantsToFavorite = getRandomInt(
      1,
      Math.min(50, productVariants.length)
    );

    for (let i = 0; i < variantsToFavorite; i++) {
      const variant = getRandomElement(productVariants);
      if (!variant) continue;

      const comboKey = `${creatorId}-${variant.product_id}-${variant.id}`;
      if (favoritesAdded.has(comboKey)) {
        i--; // Retry if this combo already exists
        continue;
      }

      try {
        await tx.favorite.upsert({
          where: {
            user_id_product_id_product_variant_id: {
              user_id: creatorId,
              product_id: variant.product_id,
              product_variant_id: variant.id,
            },
          },
          update: { updated_by: creatorId },
          create: {
            user_id: creatorId,
            product_id: variant.product_id,
            product_variant_id: variant.id,
            created_by: creatorId,
          },
        });
        favoritesAdded.add(comboKey);
        favoritesCount++;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          console.warn(
            `Favorite for user ${creatorId}, product ${variant.product_id}, variant ${variant.id} already exists. Skipping duplicate.`
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
    console.log("Seeding tags...");
    const tagsData = [
      { name: "New Arrival", description: "Recently added to stock" },
      { name: "Best Seller", description: "Our most popular products" },
      { name: "Limited Edition", description: "Exclusive and rare timepieces" },
      { name: "On Sale", description: "Currently discounted items" },
      { name: "Luxury Pick", description: "Handpicked high-end watches" },
      { name: "Smart Tech", description: "Watches with advanced features" },
      { name: "Durable", description: "Built to last" },
      { name: "Classic Design", description: "Timeless aesthetic" },
    ];

    for (const data of tagsData) {
      await tx.tags.upsert({
        where: { name: data.name },
        update: { ...data, updated_by: creatorId },
        create: { ...data, created_by: creatorId },
      });
    }
    console.log(`Seeded ${tagsData.length} tags.`);
  }

  private async seedProductTags(
    creatorId: bigint,
    tx: PrismaClient
  ): Promise<void> {
    console.log("Seeding product tags...");
    const products = await tx.product.findMany({ select: { id: true } });
    const tags = await tx.tags.findMany({ select: { id: true } });

    if (products.length === 0 || tags.length === 0) {
      console.warn(
        "No products or tags found to create product tags. Skipping."
      );
      return;
    }

    const productTagsCreated = new Set<string>(); // To track unique [product_id, tag_id] combos
    let count = 0;

    for (const product of products) {
      const numTags = getRandomInt(0, Math.min(3, tags.length)); // Assign 0 to 3 tags per product

      for (let i = 0; i < numTags; i++) {
        const tag = getRandomElement(tags);
        if (!tag) continue;

        const comboKey = `${product.id}-${tag.id}`;
        if (productTagsCreated.has(comboKey)) {
          continue; // Skip if this product-tag combo already exists
        }

        try {
          await tx.product_tag.upsert({
            where: {
              product_id_tag_id: { product_id: product.id, tag_id: tag.id },
            },
            update: { updated_by: creatorId },
            create: {
              product_id: product.id,
              tag_id: tag.id,
              created_by: creatorId,
            },
          });
          productTagsCreated.add(comboKey);
          count++;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            console.warn(
              `Product tag for product ${product.id} and tag ${tag.id} already exists. Skipping duplicate.`
            );
          } else {
            console.error(`Error seeding product tag:`, error);
            throw error;
          }
        }
      }
    }
    console.log(`Seeded ${count} product tags.`);
  }
}
