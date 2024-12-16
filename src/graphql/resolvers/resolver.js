const Project = require('../../models/project');

const projectResolver = {
  Query: {
    getProjects: async () => {
      try {
        const projects = await Project.find();
        return projects;
      } catch (err) {
        throw new Error('Failed to fetch projects');
      }
    },
  },
  Mutation: {
    createProject: async (_, { name, description }) => {
      try {
        const project = new Project({ name, description });
        await project.save();
        return project;
      } catch (err) {
        throw new Error('Failed to create project');
      }
    },
  },
};

module.exports = projectResolver;
