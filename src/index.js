import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { express as voyagerMiddleware } from 'graphql-voyager/middleware/index.js';
import connectDB from './config/db.js';
import resolver from './graphql/resolvers/index.js';
import typeDefs from './graphql/schema/index.js';

dotenv.config(); // .env 파일 로드
connectDB(); // MongoDB 연결

const app = express();

app.use(
  cors({
    origin: '*',
  })
);

// Voyager 추가 (GraphQL 스키마 시각화)
app.use('/voyager', voyagerMiddleware({ endpointUrl: '/graphql' }));

const server = new ApolloServer({
  typeDefs,
  resolvers: resolver,
  context: ({ req }) => ({ request: req }),
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(
      `🚀 Server running at http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(`🔍 GraphQL Voyager: http://localhost:${PORT}/voyager`);
  });
}

startServer();
