import { Project } from '../../models/index.js';
import mongoose from 'mongoose';

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
    createProject: async (_, { name, description, members, endDate }) => {
      try {
        const project = new Project({ name, description, members, endDate });
        await project.save();
        return project;
      } catch (err) {
        throw new Error('Failed to create project');
      }
    },
    updateProject: async (_, { id, name, description, members, endDate }) => {
      try {
        // id를 ObjectId로 변환
        const projectId = new mongoose.Types.ObjectId(id);

        // members가 존재하면 ObjectId로 변환
        const membersObjectIds = members
          ? members.map((m) => new mongoose.Types.ObjectId(m))
          : undefined;

        const project = await Project.findByIdAndUpdate(
          projectId,
          { name, description, members: membersObjectIds, endDate },
          { new: true }
        ).populate({
          path: 'members',
          select: '_id nickname email isActive',
        });

        if (!project)
          throw new Error(`Project with ID ${id} not found or update failed`);

        return project;
      } catch (err) {
        throw new Error(`Failed to update project: ${err.message}`);
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
