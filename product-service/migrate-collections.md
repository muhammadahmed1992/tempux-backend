# Migration Guide: Adding Collections and Renaming Type to Gender

## Overview

This migration adds a new `collection` entity and renames the `type` table to `gender` to better reflect its purpose.

## Changes Made

### 1. Database Schema Changes

- Added `collection` model with brand relationship
- Added `collection_id` to `product` model (nullable for safe rollout)
- Renamed `type` model to `gender`
- Updated `product` model to use `gender_id` instead of `type_id`
- Added proper indexes and constraints

### 2. New Files Created

- `src/collection/collection.module.ts`
- `src/collection/collection.repository.ts`
- `src/collection/collection.service.ts`
- `src/collection/collection.controller.ts`
- `src/gender/gender.module.ts`
- `src/gender/gender.repository.ts`
- `src/gender/gender.service.ts`
- `src/gender/gender.controller.ts`

### 3. Updated Files

- `prisma/schema.prisma` - Added collection model, renamed type to gender
- `src/app.module.ts` - Added CollectionModule, replaced TypeModule with GenderModule
- `src/product/product.service.ts` - Added collection to product listing and summary
- `src/product/product.repository.ts` - Added collection to product summary query
- `src/common/dto/product-summary.info.dto.ts` - Added collection field
- `src/common/helper/seed.helper.ts` - Added collection seeding, renamed type to gender

## Migration Steps

### 1. Generate and Run Migration

```bash
# Generate the migration
npx prisma migrate dev --name add_collections_and_rename_type_to_gender

# Apply the migration
npx prisma migrate deploy
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Seed the Database

```bash
# Run the seed script to populate collections and genders
npm run seed
```

### 4. Update Existing Products (Optional)

If you have existing products that should be assigned to collections, you can run a data migration script:

```sql
-- Example: Assign products to collections based on brand
UPDATE product
SET collection_id = (
  SELECT c.id
  FROM collection c
  WHERE c.brand_id = product.brand_id
  LIMIT 1
)
WHERE collection_id IS NULL;
```

## API Endpoints

### Collections

- `GET /collections` - List all collections with filtering
- `GET /collections/:id` - Get collection by ID
- `POST /collections` - Create new collection (admin only)
- `PUT /collections/:id` - Update collection (admin only)
- `DELETE /collections/:id` - Delete collection (admin only)

### Genders

- `GET /genders` - List all genders with filtering

### Product Filtering Examples

- Filter by collection ID: `GET /list/p?filter[product][collection_id][eq]=12`
- Filter by collection title: `GET /list/p?filter[product][collection][title][eq][in]=submariner`
- Filter by gender: `GET /list/p?filter[product][gender_id][eq]=1`

## Data Structure

### Collection Model

```typescript
{
  id: number;
  title: string;
  order?: number;
  image_url?: string;
  brand_id: number;
  brand: Brand;
  products: Product[];
  // ... audit fields
}
```

### Product Model (Updated)

```typescript
{
  // ... existing fields
  gender_id: number;        // Changed from type_id
  gender: Gender;           // Changed from type
  collection_id?: number;   // New field
  collection?: Collection;  // New relation
  // ... other fields
}
```

## Notes

- The `collection_id` field is nullable to allow for a safe rollout
- Existing products will have `collection_id` as null until manually assigned
- The `type` table has been renamed to `gender` with all existing data preserved
- All API responses now include collection information where applicable
