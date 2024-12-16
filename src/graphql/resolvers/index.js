import projectResolver from './projectResolver.js';
import memberResolver from './memberResolver.js';
import taskResolver from './taskResolver.js';

const resolvers = {
  Query: {
    ...projectResolver.Query,
    ...memberResolver.Query,
    ...taskResolver.Query,
  },
  Mutation: {
    ...projectResolver.Mutation,
    ...memberResolver.Mutation,
    ...taskResolver.Mutation,
  },
};

export default resolvers;
