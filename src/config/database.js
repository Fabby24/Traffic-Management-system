const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error']
})

prisma.$connect()
    .then(() => console.log('PostgreSQL connected via Prisma'))
    .catch((error) => {
        console.error('PostgreSQL connection failed:', error.message)
        process.exit(1)
    })

process.on('beforeExit', async () => {
    await prisma.$disconnect()
})

module.exports = { prisma }