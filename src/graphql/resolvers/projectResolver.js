import { Project } from '../../models/index.js';

const projectResolver = {
  Query: {
    getProjects: async () => {
      try {
        return await Project.find().populate('members tasks');
      } catch (err) {
        throw new Error('Failed to fetch projects');
      }
    },
    getProjectById: async (_, { id }) => {
      try {
        const project = await Project.findById(id).populate('members tasks');
        if (!project) throw new Error('Project not found');
        return project;
      } catch (err) {
        throw new Error('Failed to fetch project');
      }
    },
  },
  Mutation: {
    createProject: async (_, { name, description, members }) => {
      try {
        const project = new Project({ name, description, members });
        await project.save();
        return project;
      } catch (err) {
        throw new Error('Failed to create project');
      }
    },
    updateProject: async (_, { id, name, description, members }) => {
      try {
        const project = await Project.findByIdAndUpdate(
          id,
          { name, description, members },
          { new: true }
        );
        if (!project) throw new Error('Project not found');
        return project;
      } catch (err) {
        throw new Error('Failed to update project');
      }
    },
    deleteProject: async (_, { id }) => {
      try {
        const project = await Project.findByIdAndDelete(id);
        if (!project) throw new Error('Project not found');
        return project;
      } catch (err) {
        throw new Error('Failed to delete project');
      }
    },
  },
};

export default projectResolver;
