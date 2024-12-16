const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const typeDefs = require('./graphql/schema');
const projectResolver = require('./graphql/resolvers/resolver');
const { express: voyagerMiddleware } = require('graphql-voyager/middleware');

dotenv.config(); // .env 파일 로드
connectDB(); // MongoDB 연결

const app = express();

// Voyager 추가 (GraphQL 스키마 시각화)
app.use('/voyager', voyagerMiddleware({ endpointUrl: '/graphql' }));

const server = new ApolloServer({
  typeDefs,
  resolvers: projectResolver,
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  // REST 엔드포인트 추가
  app.get('/projects', async (req, res) => {
    try {
      const result = await server.executeOperation({
        query: `
          query {
            getProjects {
              id
              name
              description
              createdAt
            }
          }
        `,
      });
      res.json(result.data.getProjects);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`GraphQL Voyager: http://localhost:${PORT}/voyager`);
  });
}

startServer();
