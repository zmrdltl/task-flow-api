import authResolver from './authResolver.js';
import memberResolver from './memberResolver.js';
import projectResolver from './projectResolver.js';
import roleResolver from './roleResolver.js';
import taskResolver from './taskResolver.js';

const resolvers = {
  Query: {
    ...projectResolver.Query,
    ...memberResolver.Query,
    ...taskResolver.Query,
    ...roleResolver.Query,
  },
  Mutation: {
    ...projectResolver.Mutation,
    ...memberResolver.Mutation,
    ...taskResolver.Mutation,
    ...authResolver.Mutation,
    ...roleResolver.Mutation,
  },
};

export default resolvers;
