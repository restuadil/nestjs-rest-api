// src/seed/seeder.ts
import { NestFactory } from "@nestjs/core";
import { getModelToken } from "@nestjs/mongoose";

import { faker } from "@faker-js/faker";
import { Model, Types } from "mongoose";

import { User } from "src/api/users/entities/user.entitiy";

import { Brand } from "../api/brands/entities/brand.entity";
import { Category } from "../api/categories/entities/category.entity";
import { ProductVariant } from "../api/product-variant/entities/product-variant.entity";
import { Product } from "../api/products/entities/product.entity";
import { AppModule } from "../app.module";
import { generateSlug } from "../common/helpers/generate-slug";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const brandModel = app.get<Model<Brand>>(getModelToken(Brand.name));
  const productModel = app.get<Model<Product>>(getModelToken(Product.name));
  const variantModel = app.get<Model<ProductVariant>>(getModelToken(ProductVariant.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  // Clear old data
  await Promise.all([
    categoryModel.deleteMany({}),
    brandModel.deleteMany({}),
    productModel.deleteMany({}),
    variantModel.deleteMany({}),
    userModel.deleteMany({}),
  ]);
  console.log("🌳 Data cleared");
  console.log("🌳 Seeding data...");

  const users: Partial<User>[] = Array.from({ length: 1000 }).map((_, i) => {
    const username = faker.internet.username() + `-${i + 1}`;
    return {
      username,
      email: username + "@gmail.com",
      password: faker.internet.password(),
      activationCode: faker.internet.password(),
    };
  });

  const createdUsers = await userModel.insertMany(users);
  console.log(`✅ Seeded ${createdUsers.length} users`);
  // -------- Seed Categories --------
  const categories: Partial<Category>[] = Array.from({ length: 1000 }).map((_, i) => {
    const name = faker.commerce.department() + `-${i + 1}`;
    return {
      name,
      slug: generateSlug(faker.helpers.slugify(name.toLowerCase())),
    };
  });

  const createdCategories = await categoryModel.insertMany(categories);
  console.log(`✅ Seeded ${createdCategories.length} categories`);

  // -------- Seed Brands --------
  const brands: Partial<Brand>[] = Array.from({ length: 1000 }).map((_, i) => {
    const name = faker.company.name() + `-${i + 1}`;
    return {
      name,
      slug: generateSlug(faker.helpers.slugify(name.toLowerCase())),
      image: faker.image.urlLoremFlickr({ category: "business" }),
    };
  });

  const createdBrands = await brandModel.insertMany(brands);
  console.log(`✅ Seeded ${createdBrands.length} brands`);

  // -------- Seed Products & Variants --------
  const products: Partial<Product>[] = [];
  const variants: Partial<ProductVariant>[] = [];

  for (let i = 0; i < 3000; i++) {
    const name = faker.commerce.productName() + `-${i + 1}`;
    const brand = faker.helpers.arrayElement(createdBrands);
    const randomCategories = faker.helpers.arrayElements(
      createdCategories,
      faker.number.int({ min: 1, max: 5 }),
    );

    const product: Partial<Product> = {
      name,
      slug: generateSlug(faker.helpers.slugify(name.toLowerCase())),
      description: faker.commerce.productDescription(),
      image: faker.image.urlLoremFlickr({ category: "product" }),
      brandId: brand._id as Types.ObjectId,
      categoryIds: randomCategories.map((c) => c._id as Types.ObjectId),
      variantIds: [],
    };

    products.push(product);
  }

  const createdProducts = await productModel.insertMany(products);
  console.log(`✅ Seeded ${createdProducts.length} products (0%)`);

  // Buat variants untuk setiap product (progress log)
  const totalProducts = createdProducts.length;
  let processed = 0;

  for (const product of createdProducts) {
    const numVariants = faker.number.int({ min: 1, max: 3 });
    const productVariants: Partial<ProductVariant>[] = [];

    for (let i = 0; i < numVariants; i++) {
      productVariants.push({
        color: faker.color.human(),
        size: faker.helpers.arrayElement(["S", "M", "L", "XL"]),
        price: faker.number.int({ min: 5000, max: 100000 }),
        quantity: faker.number.int({ min: 1, max: 50 }),
        image: faker.image.urlLoremFlickr({ category: "fashion" }),
      });
    }

    const createdVariants = await variantModel.insertMany(productVariants);

    const hydrated = productModel.hydrate(product);
    hydrated.variantIds = createdVariants.map((v) => v._id as Types.ObjectId);
    await hydrated.save();

    variants.push(...createdVariants);

    processed++;
    if (processed % 100 === 0 || processed === totalProducts) {
      const percent = Math.floor((processed / totalProducts) * 100);
      console.log(`⏳ Progress: ${processed}/${totalProducts} products processed (${percent}%)`);
    }
  }

  console.log(
    `✅ Finished seeding: ${createdProducts.length} products & ${variants.length} variants`,
  );

  await app.close();
}

bootstrap().catch((err) => {
  console.error("❌ Seeder failed", err);
  process.exit(1);
});
