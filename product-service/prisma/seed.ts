import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const SEED_USER_ID = 2;
  // --- Dummy Data for 'color' model ---
  const colorsData = [
    { name: "Black", colorCode: "#000000", description: "Deep shade" },
    { name: "White", colorCode: "#FFFFFF", description: "Bright hue" },
    { name: "Silver", colorCode: "#C0C0C0", description: "Metallic finish" },
    { name: "Gold", colorCode: "#FFD700", description: "Luxurious tone" },
    { name: "Red", colorCode: "#FF0000", description: "Vibrant shade" },
    { name: "Blue", colorCode: "#0000FF", description: "Cool tone" },
    { name: "Green", colorCode: "#008000", description: "Natural shade" },
    { name: "Pink", colorCode: "#FFC0CB", description: "Soft pastel" },
    { name: "Brown", colorCode: "#A52A2A", description: "Earthy tone" },
    { name: "Grey", colorCode: "#808080", description: "Neutral shade" },
    { name: "Yellow", colorCode: "#FFFF00", description: "Sunny hue" },
    { name: "Orange", colorCode: "#FFA500", description: "Warm tone" },
    { name: "Purple", colorCode: "#800080", description: "Rich shade" },
    { name: "Cyan", colorCode: "#00FFFF", description: "Aqua tone" },
    { name: "Magenta", colorCode: "#FF00FF", description: "Bold shade" },
    { name: "Bronze", colorCode: "#CD7F32", description: "Warm metallic" },
    { name: "Rose Gold", colorCode: "#B76E79", description: "Elegant" },
    { name: "Navy Blue", colorCode: "#000080", description: "Deep ocean" },
    { name: "Forest Green", colorCode: "#228B22", description: "Deep forest" },
    { name: "Burgundy", colorCode: "#800020", description: "Rich red" },
  ];

  for (const data of colorsData) {
    await prisma.color.upsert({
      where: { name: data.name }, // Assuming 'name' is unique for colors
      update: {
        colorCode: data.colorCode,
        description: data.description,
        updated_at: new Date(),
        updated_by: SEED_USER_ID,
      },
      create: {
        name: data.name,
        colorCode: data.colorCode,
        description: data.description,
        created_by: SEED_USER_ID,
      },
    });
  }
  console.log(`Seeded ${colorsData.length} colors.`);

  // --- Dummy Data for 'size' model ---
  const sizesData = [
    { value: 30, widthUnit: "MM", height: 8, heightUnit: "MM" },
    { value: 32, widthUnit: "MM", height: 9, heightUnit: "MM" },
    { value: 34, widthUnit: "MM", height: 10, heightUnit: "MM" },
    { value: 36, widthUnit: "MM", height: 11, heightUnit: "MM" },
    { value: 38, widthUnit: "MM", height: 12, heightUnit: "MM" },
    { value: 40, widthUnit: "MM", height: 13, heightUnit: "MM" },
    { value: 42, widthUnit: "MM", height: 14, heightUnit: "MM" },
    { value: 44, widthUnit: "MM", height: 15, heightUnit: "MM" },
    { value: 46, widthUnit: "MM", height: 8, heightUnit: "MM" },
    { value: 48, widthUnit: "MM", height: 9, heightUnit: "MM" },
    { value: 50, widthUnit: "MM", height: 10, heightUnit: "MM" },
    { value: 30, widthUnit: "MM", height: 11, heightUnit: "MM" },
    { value: 32, widthUnit: "MM", height: 12, heightUnit: "MM" },
    { value: 34, widthUnit: "MM", height: 13, heightUnit: "MM" },
    { value: 36, widthUnit: "MM", height: 14, heightUnit: "MM" },
    { value: 38, widthUnit: "MM", height: 15, heightUnit: "MM" },
    { value: 40, widthUnit: "MM", height: 8, heightUnit: "MM" },
    { value: 42, widthUnit: "MM", height: 9, heightUnit: "MM" },
    { value: 44, widthUnit: "MM", height: 10, heightUnit: "MM" },
    { value: 46, widthUnit: "MM", height: 11, heightUnit: "MM" },
    { value: 48, widthUnit: "MM", height: 12, heightUnit: "MM" },
    { value: 50, widthUnit: "MM", height: 13, heightUnit: "MM" },
    { value: 30, widthUnit: "MM", height: 14, heightUnit: "MM" },
    { value: 32, widthUnit: "MM", height: 15, heightUnit: "MM" },
    { value: 34, widthUnit: "MM", height: 8, heightUnit: "MM" },
  ];

  for (const data of sizesData) {
    await prisma.size.upsert({
      where: {
        value_height: {
          value: data.value,
          height: data.height,
        },
      },
      update: {
        widthUnit: data.widthUnit,
        height: data.height,
        heightUnit: data.heightUnit,
        updated_at: new Date(),
        updated_by: SEED_USER_ID,
      },
      create: {
        value: data.value,
        widthUnit: data.widthUnit,
        height: data.height,
        heightUnit: data.heightUnit,
        created_by: SEED_USER_ID,
      },
    });
  }
  console.log(`Seeded ${sizesData.length} sizes.`);

  // --- Dummy Data for 'brand' model ---
  const brandsData = [
    {
      title: "Rolex",
      order: 1,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Rolex",
    },
    {
      title: "Omega",
      order: 2,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Omega",
    },
    {
      title: "Tag Heuer",
      order: 3,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Tag%20Heuer",
    },
    {
      title: "Casio",
      order: 4,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Casio",
    },
    {
      title: "Seiko",
      order: 5,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Seiko",
    },
    {
      title: "Citizen",
      order: 6,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Citizen",
    },
    {
      title: "Timex",
      order: 7,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Timex",
    },
    {
      title: "Fossil",
      order: 8,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Fossil",
    },
    {
      title: "Swatch",
      order: 9,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Swatch",
    },
    {
      title: "Tissot",
      order: 10,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Tissot",
    },
    {
      title: "Longines",
      order: 11,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Longines",
    },
    {
      title: "Patek Philippe",
      order: 12,
      image_url:
        "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Patek%20Philippe",
    },
    {
      title: "Audemars Piguet",
      order: 13,
      image_url:
        "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Audemars%20Piguet",
    },
    {
      title: "Hublot",
      order: 14,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Hublot",
    },
    {
      title: "Breitling",
      order: 15,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Breitling",
    },
    {
      title: "Cartier",
      order: 16,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Cartier",
    },
    {
      title: "IWC",
      order: 17,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=IWC",
    },
    {
      title: "Jaeger-LeCoultre",
      order: 18,
      image_url:
        "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Jaeger-LeCoultre",
    },
    {
      title: "Vacheron Constantin",
      order: 19,
      image_url:
        "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Vacheron%20Constantin",
    },
    {
      title: "Grand Seiko",
      order: 20,
      image_url:
        "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Grand%20Seiko",
    },
    {
      title: "Orient",
      order: 21,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Orient",
    },
    {
      title: "Hamilton",
      order: 22,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Hamilton",
    },
    {
      title: "Certina",
      order: 23,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Certina",
    },
    {
      title: "Rado",
      order: 24,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Rado",
    },
    {
      title: "Victorinox",
      order: 25,
      image_url: "https://placehold.co/200x100/A0A0A0/FFFFFF?text=Victorinox",
    },
  ];

  for (const data of brandsData) {
    await prisma.brand.upsert({
      where: { title: data.title }, // Assuming 'title' is unique for brands
      update: {
        order: data.order,
        image_url: data.image_url,
        updated_at: new Date(),
        updated_by: SEED_USER_ID,
      },
      create: {
        title: data.title,
        order: data.order,
        image_url: data.image_url,
        created_by: SEED_USER_ID,
      },
    });
  }
  console.log(`Seeded ${brandsData.length} brands.`);

  // --- Dummy Data for 'type' model ---
  const typesData = [
    {
      title: "Automatic",
      order: 1,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Automatic",
    },
    {
      title: "Quartz",
      order: 2,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Quartz",
    },
    {
      title: "Manual Wind",
      order: 3,
      image_url:
        "https://placehold.co/200x100/B0B0B0/000000?text=Manual%20Wind",
    },
    {
      title: "Smartwatch",
      order: 4,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Smartwatch",
    },
    {
      title: "Chronograph",
      order: 5,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Chronograph",
    },
    {
      title: "Diver",
      order: 6,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Diver",
    },
    {
      title: "Dress",
      order: 7,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Dress",
    },
    {
      title: "Field",
      order: 8,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Field",
    },
    {
      title: "Pilot",
      order: 9,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Pilot",
    },
    {
      title: "GMT",
      order: 10,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=GMT",
    },
    {
      title: "Digital",
      order: 11,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Digital",
    },
    {
      title: "Analog-Digital",
      order: 12,
      image_url:
        "https://placehold.co/200x100/B0B0B0/000000?text=Analog-Digital",
    },
    {
      title: "Tourbillon",
      order: 13,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Tourbillon",
    },
    {
      title: "Perpetual Calendar",
      order: 14,
      image_url:
        "https://placehold.co/200x100/B0B0B0/000000?text=Perpetual%20Calendar",
    },
    {
      title: "Moonphase",
      order: 15,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Moonphase",
    },
    {
      title: "Skeleton",
      order: 16,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Skeleton",
    },
    {
      title: "Open Heart",
      order: 17,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Open%20Heart",
    },
    {
      title: "Jump Hour",
      order: 18,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Jump%20Hour",
    },
    {
      title: "Regulator",
      order: 19,
      image_url: "https://placehold.co/200x100/B0B0B0/000000?text=Regulator",
    },
    {
      title: "Minute Repeater",
      order: 20,
      image_url:
        "https://placehold.co/200x100/B0B0B0/000000?text=Minute%20Repeater",
    },
    {
      title: "Grand Complication",
      order: 21,
      image_url:
        "https://placehold.co/200x100/B0B0B0/000000?text=Grand%20Complication",
    },
  ];

  for (const data of typesData) {
    await prisma.type.upsert({
      where: { title: data.title }, // Assuming 'title' is unique for types
      update: {
        order: data.order,
        image_url: data.image_url,
        updated_at: new Date(),
        updated_by: SEED_USER_ID,
      },
      create: {
        title: data.title,
        order: data.order,
        image_url: data.image_url,
        created_by: SEED_USER_ID,
      },
    });
  }
  console.log(`Seeded ${typesData.length} types.`);

  // --- Dummy Data for 'category' model ---
  const categoriesData = [
    {
      title: "Luxury Watches",
      order: 1,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Luxury%20Watches",
    },
    {
      title: "Sport Watches",
      order: 2,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Sport%20Watches",
    },
    {
      title: "Dress Watches",
      order: 3,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Dress%20Watches",
    },
    {
      title: "Casual Watches",
      order: 4,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Casual%20Watches",
    },
    {
      title: "Dive Watches",
      order: 5,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Dive%20Watches",
    },
    {
      title: "Pilot Watches",
      order: 6,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Pilot%20Watches",
    },
    {
      title: "Field Watches",
      order: 7,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Field%20Watches",
    },
    {
      title: "Smartwatches",
      order: 8,
      image_url: "https://placehold.co/200x100/C0C0C0/333333?text=Smartwatches",
    },
    {
      title: "Vintage Watches",
      order: 9,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Vintage%20Watches",
    },
    {
      title: "Chronograph Watches",
      order: 10,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Chronograph%20Watches",
    },
    {
      title: "Automatic Watches",
      order: 11,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Automatic%20Watches",
    },
    {
      title: "Quartz Watches",
      order: 12,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Quartz%20Watches",
    },
    {
      title: "Skeleton Watches",
      order: 13,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Skeleton%20Watches",
    },
    {
      title: "GMT Watches",
      order: 14,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=GMT%20Watches",
    },
    {
      title: "Classic Watches",
      order: 15,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Classic%20Watches",
    },
    {
      title: "Modern Watches",
      order: 16,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Modern%20Watches",
    },
    {
      title: "Fashion Watches",
      order: 17,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Fashion%20Watches",
    },
    {
      title: "Limited Edition",
      order: 18,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Limited%20Edition",
    },
    {
      title: "Collector's Items",
      order: 19,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Collector's%20Items",
    },
    {
      title: "Unisex Watches",
      order: 20,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Unisex%20Watches",
    },
    {
      title: "Men's Watches",
      order: 21,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Men's%20Watches",
    },
    {
      title: "Women's Watches",
      order: 22,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Women's%20Watches",
    },
    {
      title: "Kids' Watches",
      order: 23,
      image_url:
        "https://placehold.co/200x100/C0C0C0/333333?text=Kids'%20Watches",
    },
  ];

  for (const data of categoriesData) {
    await prisma.category.upsert({
      where: { title: data.title }, // Assuming 'title' is unique for categories
      update: {
        order: data.order,
        image_url: data.image_url,
        updated_at: new Date(),
        updated_by: SEED_USER_ID,
      },
      create: {
        title: data.title,
        order: data.order,
        image_url: data.image_url,
        created_by: SEED_USER_ID,
      },
    });
  }
  console.log(`Seeded ${categoriesData.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
