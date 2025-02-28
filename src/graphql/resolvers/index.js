import authResolver from './authResolver.js';
import commentResolver from './commentResolver.js';
import likeResolver from './likeResolver.js';
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
    ...commentResolver.Query,
    ...likeResolver.Query,
  },
  Mutation: {
    ...projectResolver.Mutation,
    ...memberResolver.Mutation,
    ...taskResolver.Mutation,
    ...authResolver.Mutation,
    ...roleResolver.Mutation,
    ...commentResolver.Mutation,
    ...likeResolver.Mutation,
  },
};

export default resolvers;
