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

import fs from 'fs';
import csv from 'csv-parser';

type ImportOptions = {
  filePath: string; // CSV file path
  skipDuplicates?: boolean; // skip duplicates or not
  logErrors?: boolean; // log row-level errors
  limit?: number; // max rows to insert
  offset?: number; // skip first N rows
};

type WatchRow = {
  Brand: string;
  Category: string;
  'Model Name': string;
  'Reference No.': string;
  'Price (USD)': string;
  Currency: string;
  'Release Date': string; // dd/mm/yyyy
  Gender: string;
  'Case Material': string;
  'Case Diameter (mm)': string;
  'Case Thickness (mm)': string;
  'Dial Color': string;
  'Strap Material': string;
  'Strap Color': string;
  'Water Resistance (m)': string;
  'Crystal Type': string;
  'Movement Type': string;
  'Power Reserve (hours)': string;
  Complications: string;
  Availability: string;
  'Warranty (Years)': string;
  'Country of Origin': string;
};

async function importCsv(options: ImportOptions) {
  const rows: WatchRow[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(options.filePath)
      .pipe(csv())
      .on('data', (row: WatchRow) => rows.push(row))
      .on('end', async () => {
        try {
          let filteredRows = rows;

          // Apply offset
          if (options.offset) {
            filteredRows = filteredRows.slice(options.offset);
          }

          // Apply limit
          if (options.limit) {
            filteredRows = filteredRows.slice(0, options.limit);
          }

          const data = filteredRows
            .map((row, index) => {
              try {
                return {
                  brand: row.Brand,
                  category: row.Category,
                  modelName: row['Model Name'],
                  referenceNo: row['Reference No.'],
                  priceUsd: parseFloat(row['Price (USD)']),
                  currency: row.Currency,
                  releaseDate: new Date(
                    row['Release Date'].split('/').reverse().join('-'),
                  ),
                  gender: row.Gender,
                  caseMaterial: row['Case Material'],
                  caseDiameterMm: parseFloat(row['Case Diameter (mm)']),
                  caseThicknessMm: parseFloat(row['Case Thickness (mm)']),
                  dialColor: row['Dial Color'],
                  strapMaterial: row['Strap Material'],
                  strapColor: row['Strap Color'],
                  waterResistanceM: parseInt(row['Water Resistance (m)']),
                  crystalType: row['Crystal Type'],
                  movementType: row['Movement Type'],
                  powerReserveHours: parseInt(row['Power Reserve (hours)']),
                  complications: row.Complications,
                  availability: row.Availability,
                  warrantyYears: parseInt(row['Warranty (Years)']),
                  countryOfOrigin: row['Country of Origin'],
                };
              } catch (err) {
                if (options.logErrors) {
                  console.error(`❌ Failed row ${index + 1}:`, row, err);
                }
                return null;
              }
            })
            .filter(Boolean); // remove invalid rows

          await prisma.product_listings.createMany({
            data: data as any[],
            skipDuplicates: options.skipDuplicates ?? true,
          });

          console.log(
            `✅ Imported ${data.length} rows from ${options.filePath}`,
          );
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          await prisma.$disconnect();
        }
      })
      .on('error', reject);
  });
}

// Example usage
importCsv({
  filePath: 'watches.csv',
  skipDuplicates: true,
  logErrors: true,
  limit: 50, // insert only 50 rows
  offset: 100, // skip first 100 rows
}).catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
