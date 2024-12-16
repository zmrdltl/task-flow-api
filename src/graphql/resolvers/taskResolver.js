import { Task } from '../../models/index.js';

const taskResolver = {
  Query: {
    getTasks: async () => {
      try {
        return await Task.find().populate('managers projectId subTasks');
      } catch (err) {
        throw new Error('Failed to fetch tasks');
      }
    },
    getTaskById: async (_, { id }) => {
      try {
        const task = await Task.findById(id).populate('managers projectId subTasks');
        if (!task) throw new Error('Task not found');
        return task;
      } catch (err) {
        throw new Error('Failed to fetch task');
      }
    },
  },
  Mutation: {
    createTask: async (_, { projectId, name, description, status, managers, startDate, endDate, progress, priority }) => {
      try {
        const task = new Task({ projectId, name, description, status, managers, startDate, endDate, progress, priority });
        await task.save();
        return task;
      } catch (err) {
        throw new Error('Failed to create task');
      }
    },
    updateTask: async (_, { id, name, description, status, managers, startDate, endDate, progress, priority }) => {
      try {
        const task = await Task.findByIdAndUpdate(
          id,
          { name, description, status, managers, startDate, endDate, progress, priority },
          { new: true }
        );
        if (!task) throw new Error('Task not found');
        return task;
      } catch (err) {
        throw new Error('Failed to update task');
      }
    },
    deleteTask: async (_, { id }) => {
      try {
        const task = await Task.findByIdAndDelete(id);
        if (!task) throw new Error('Task not found');
        return task;
      } catch (err) {
        throw new Error('Failed to delete task');
      }
    },
  },
};

export default taskResolver;
