import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ProxyMiddleware } from "./middleware/proxy-middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Need to upgrade this logic...
  const allServiceKeys = ["product", "buyer", "seller", "auth"];

  // Build pattern: ^/(product|buyer|seller|auth)(/|$)
  const pattern = `^/(${allServiceKeys.join("|")})(/|$)`;

  const routeRegex = new RegExp(pattern);

  app.use(routeRegex, new ProxyMiddleware().use);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
