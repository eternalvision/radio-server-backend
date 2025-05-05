import Fastify from 'fastify';
import cors from '@fastify/cors';
import { corsOptions, randomRoute, tracksRoute, streamRoute } from './src/index.js';

const server = Fastify();

await server.register(cors, corsOptions);

server.get('/random', randomRoute);
server.get('/tracks', tracksRoute);
server.get('/stream', streamRoute);

server.listen({ port: 9999 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Radio server running at ${address}`);
});
