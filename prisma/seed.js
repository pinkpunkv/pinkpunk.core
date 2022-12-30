import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const langData = [
  {
    name: 'English',
    symbol: 'EN',
  },
  {
    name: 'Русский',
    symbol: 'RU',
  },
]
const currencyData = [
  {
    symbol: 'BYN',
  },
]

async function main() {
  console.log(`Start seeding Languages...`)
  try {
    for await (const u of langData) {
      const data = await prisma.Language.create({
        data: u,
      })
      console.log(`Created event with name: ${data.name}`)
    }
  } catch (e) {
    // console.error(e)
  }
  console.log(`Start seeding Currencies...`)
  try {
    for await (const u of currencyData) {
      const data = await prisma.Currency.create({
        data: u,
      })
      console.log(`Created event with symbol: ${data.symbol}`)
    }
  } catch (e) {
    // console.error(e)
  }

  let byn = await prisma.Currency.findFirst({ where: { symbol: 'BYN' } })
  let ru = await prisma.Language.findFirst({ where: { symbol: 'RU' } })
  let en = await prisma.Language.findFirst({ where: { symbol: 'EN' } })

  const categoryData = [
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Головные уборы',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Hats',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Свитшоты',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Sweatshirts',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Костюмы',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Costumes',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Рубашки',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Shirts',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Футболки',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'T-Shirts',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Плащи',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Cloak',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Шорты',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Shorts',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Штаны',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Pants',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Платья',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Dresses',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Куртки',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Jackets',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Косухи',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Leather Jackets',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Пальто',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Coats',
            languageId: en.id,
          },
        ],
      },
    },
    {
      isMain: true,
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Худи',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'Hoodies',
            languageId: en.id,
          },
        ],
      },
    },
  ]

  const productData = [
    {
      path: 'best_hoodie',
      slug: 'best_hoodie',
      price: 23.4,
      active: true,
      currencySymbol: byn.symbol,
      images: {
        create: [{ imageId: 1, number: 0, isMain: true }],
      },
      fields: {
        create: [
          {
            fieldName: 'name',
            fieldValue: 'Самый крутой худак',
            languageId: ru.id,
          },
          {
            fieldName: 'name',
            fieldValue: 'The best hoodie',
            languageId: en.id,
          },
          {
            fieldName: 'description',
            fieldValue: 'Самый крутой худак и его описание тут',
            languageId: ru.id,
          },
          {
            fieldName: 'decription',
            fieldValue: 'The best hoodie and his description is here',
            languageId: en.id,
          },
        ],
      },
    },
  ]

  console.log(`Start seeding Categories...`)

  for (const u of categoryData) {
    const data = await prisma.Category.create({
      data: u,
    })
    console.log(`Created event with id: ${data.id}`)
  }
  console.log(`Start seeding Products...`)

  for (const u of productData) {
    const data = await prisma.Product.create({
      data: u,
    })
    console.log(`Created event with id: ${data.id}`)
  }

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })