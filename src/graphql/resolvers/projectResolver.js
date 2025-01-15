import { Project } from '../../models/index.js';
import mongoose from 'mongoose';

const projectResolver = {
  Query: {
    getProjects: async () => {
      try {
        return await Project.find().populate('members').populate('tasks');
      } catch (err) {
        throw new Error('Failed to fetch projects');
      }
    },
    getProjectById: async (_, { id }) => {
      try {
        const project = await Project.findById(id)
          .populate('members')
          .populate({
            path: 'tasks',
            populate: [{ path: 'managers' }, { path: 'subTasks' }],
          });

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
        const membersObjectIds = members
          ? members.map((m) => new mongoose.Types.ObjectId(m))
          : [];

        const project = new Project({
          name,
          description,
          members: membersObjectIds,
          endDate,
        });

        await project.save();
        return await Project.findById(project._id)
          .populate('members')
          .populate('tasks');
      } catch (err) {
        throw new Error(`Failed to create project: ${err.message}`);
      }
    },
    updateProject: async (
      _,
      { id, name, description, members, tasks, endDate }
    ) => {
      try {
        console.log('📌 Received Input:', {
          id,
          name,
          description,
          members,
          endDate,
        });

        const membersObjectIds = members
          ? members.map((m) => new mongoose.Types.ObjectId(m))
          : [];

        const project = await Project.findByIdAndUpdate(
          id,
          { name, description, members: membersObjectIds, endDate },
          { new: true }
        )
          .populate('members')
          .populate('tasks');

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
