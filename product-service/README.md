<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Query Filters

✅ 1️⃣ Basic equality
GET /brands?filter[title][eq]=Hamilton
// Prisma equivalent:
{
title: "Hamilton"
}

✅ 2️⃣ Case-insensitive equality
GET /brands?filter[title][eq][in]=hamilton
// Prisma equivalent:
{
title: { equals: "hamilton", mode: "insensitive" }
}

✅ 3️⃣ IN condition
GET /brands?filter[title][in]=Hamilton,Omega,Rolex

// Prisma equivalent:
{
title: { in: ["Hamilton", "Omega", "Rolex"] }
}
✅ 4️⃣ Greater than
GET /brands?filter[price][gt]=500
// Prisma equivalent:
{
price: { gt: 500 }
}
✅ 5️⃣ AND group
GET /brands?filter[and][0][price][gt]=500&filter[and][1][stock][gt]=0
// Prisma equivalent:
{
AND: [
{ price: { gt: 500 } },
{ stock: { gt: 0 } }
]
}
✅ 6️⃣ OR group
GET /brands?filter[or][0][title][eq]=Hamilton&filter[or][1][title][eq]=Omega
// Prisma equivalent:
{
OR: [
{ title: "Hamilton" },
{ title: "Omega" }
]
}
✅ 7️⃣ OR + base filter
GET /brands?filter[or][0][title][eq]=Hamilton&filter[or][1][title][eq]=Omega&filter[is_deleted][eq]=false
{
OR: [
{ title: "Hamilton" },
{ title: "Omega" }
],
is_deleted: false
}
✅ 8️⃣ Nested (OR) and (AND)
GET /brands?filter[or][0][title][eq]=Hamilton
&filter[or][1][and][0][price][gt]=500
&filter[or][1][and][1][stock][gt]=0
// Prisma equivalent:
{
OR: [
{ title: "Hamilton" },
{
AND: [
{ price: { gt: 500 } },
{ stock: { gt: 0 } }
]
}
]
}
→ Finds brands where (title = "Hamilton") OR (price > 500 AND stock > 0`)
✅ 9️⃣ Triple nesting: (A) OR (B AND (C OR D))
GET /brands?filter[or][0][title][eq]=Hamilton
&filter[or][1][and][0][price][gt]=500
&filter[or][1][and][1][or][0][stock][eq]=0
&filter[or][1][and][1][or][1][status][eq]=inactive
// Prisma equivalent:
{
OR: [
{ title: "Hamilton" },
{
AND: [
{ price: { gt: 500 } },
{
OR: [
{ stock: 0 },
{ status: "inactive" }
]
}
]
}
]
}
→ Finds brands where (title = "Hamilton") OR (price > 500 AND (stock = 0 OR status = "inactive"))
✅ 🔟 Full combo: (OR A) OR (AND B AND (OR C))
GET /brands?filter[or][0][title][contains][in]=hamilton
&filter[or][1][and][0][price][gt]=1000
&filter[or][1][and][1][category][eq]=luxury
&filter[or][1][and][2][or][0][stock][eq]=0
&filter[or][1][and][2][or][1][status][eq]=soldout
&filter[is_deleted][eq]=false
// Prisma equivalent:
{
OR: [
{
title: { contains: "hamilton", mode: "insensitive" }
},
{
AND: [
{ price: { gt: 1000 } },
{ category: "luxury" },
{
OR: [
{ stock: 0 },
{ status: "soldout" }
]
}
]
}
],
is_deleted: false
}
→ Finds brands that are not deleted AND (title contains "hamilton" case-insensitive OR (price > 1000 AND category = "luxury" AND (stock = 0 OR status = "soldout")))
✅ 🚦 How grouping works
filter[field][op] → simple filter

[in] → case-insensitive (where supported)

[se] → strict

filter[or][0] → OR group

filter[and][0] → AND group

Nest and or or inside each other for complex trees

If no group is used → conditions combine with AND by default
✅ 🎉 Supported operators
URL Operator Prisma Equivalent
eq equals
ne not
gt gt
gte gte
lt lt
lte lte
contains contains
startsWith startsWith
endsWith endsWith
in in
notIn notIn

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
