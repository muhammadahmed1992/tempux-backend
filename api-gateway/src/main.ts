import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ProxyMiddleware } from "./middleware/proxy-middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Need to upgrade this logic...
  const allServiceKeys = ["product", "buyer", "seller"];
  ///product/{1,1}|/auth/{1,1}
  const pattern = `/(${allServiceKeys}/{1,1}`;
  const routeRegex = new RegExp(`/${allServiceKeys.join("{1,}|")}/`);

  app.use(routeRegex, new ProxyMiddleware().use);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
