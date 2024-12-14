const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Project {
    id: ID!
    name: String!
    description: String
    createdAt: String
  }

  type Query {
    getProjects: [Project]
  }

  type Mutation {
    createProject(name: String!, description: String): Project
  }
`;

module.exports = typeDefs;