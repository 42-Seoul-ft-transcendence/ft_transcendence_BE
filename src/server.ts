import Fastify from 'fastify'
import prismaPlugin from './plugins/prisma'
import authRoute from './routes/auth'

const fastify = Fastify({ logger: true })

fastify.register(prismaPlugin)
fastify.register(authRoute)

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err
})
