import Fastify from 'fastify';
import cors from '@fastify/cors';
import config from './src/config.js';
import { corsOptions, randomRoute } from './src/index.js';

const { PORT, HOST } = config;

const server = Fastify();

await server.register(cors, corsOptions);

server.get('/random', randomRoute);

server.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Radio server running at ${address}`);
});
