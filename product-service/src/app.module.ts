import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaService } from "@Services/prisma.service";
import { RepositoryModule } from "@Module/repository.module";
import { BrandService } from "@Services/brand.service";
import { BrandController } from "@Controllers/brand.controller";
import { TypeController } from "@Controllers/type.controller";
import { CategoryController } from "@Controllers/category.controller";
import { SizeController } from "@Controllers/size.controller";
import { ColorController } from "@Controllers/color.controller";
import { TypesService } from "@Services/types.service";
import { CategoryService } from "@Services/category.service";
import { ColorService } from "@Services/color.service";
import { SizeService } from "@Services/size.service";
import { AuthModule } from "@Module/auth.module";
import { ReviewsModule } from "@Module/reviews.module";
import { ProductService } from "@Services/product.service";
import { ProductController } from "@Controllers/product.controller";

@Module({
  imports: [RepositoryModule, AuthModule, ReviewsModule],
  controllers: [
    AppController,
    BrandController,
    TypeController,
    CategoryController,
    SizeController,
    ColorController,
    ProductController,
  ],
  providers: [
    AppService,
    BrandService,
    TypesService,
    CategoryService,
    ColorService,
    SizeService,
    ProductService,
  ],
})
export class AppModule {}
