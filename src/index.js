import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import typeDefs from './graphql/schema/index.js';
import resolver from './graphql/resolvers/index.js';
import { express as voyagerMiddleware } from 'graphql-voyager/middleware/index.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

dotenv.config(); // .env 파일 로드
connectDB(); // MongoDB 연결

const app = express();

// Voyager 추가 (GraphQL 스키마 시각화)
app.use('/voyager', voyagerMiddleware({ endpointUrl: '/graphql' }));

const server = new ApolloServer({
  typeDefs,
  resolvers: resolver,
  context: async ({ req }) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new Error('❌ 인증 토큰이 없습니다.');
    }

    const token = authHeader.replace('Bearer ', ''); // "Bearer " 제거

    try {
      const user = await authMiddleware(token); // ✅ Google ID Token 검증
      return { user }; // ✅ 모든 Resolver에서 context.user로 접근 가능
    } catch (error) {
      console.error('❌ 인증 실패:', error.message);
      throw new Error('❌ 유효하지 않은 토큰입니다.');
    }
  },
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
