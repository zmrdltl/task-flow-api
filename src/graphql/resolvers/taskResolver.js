import mongoose from 'mongoose';
import { Project, Task } from '../../models/index.js';

const taskResolver = {
  Query: {
    getTasks: async () => {
      try {
        return await Task.find().populate('managers').populate('subTasks');
      } catch (err) {
        throw new Error('Failed to fetch tasks');
      }
    },
    getTaskById: async (_, { id }) => {
      try {
        const task = await Task.findById(id)
          .populate('managers')
          .populate('subTasks');
        if (!task) throw new Error('Task not found');
        return task;
      } catch (err) {
        throw new Error('Failed to fetch task');
      }
    },
  },
  Mutation: {
    createTask: async (
      _,
      {
        projectId,
        name,
        description,
        status,
        managers,
        startDate,
        endDate,
        progress,
        priority,
      }
    ) => {
      try {
        console.log('📌 Received Input:', {
          projectId,
          name,
          description,
          status,
          managers,
          startDate,
          endDate,
          progress,
          priority,
        });

        // ✅ Step 1: projectId 유효성 검사
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          throw new Error(`Invalid projectId: ${projectId}`);
        }

        // ✅ Step 2: managers ID 유효성 검사
        const managersObjectIds = managers
          ? managers.map((m) => {
              if (!mongoose.Types.ObjectId.isValid(m)) {
                throw new Error(`Invalid manager ID: ${m}`);
              }
              return new mongoose.Types.ObjectId(m);
            })
          : [];

        console.log('✅ Converted managers:', managersObjectIds);

        // ✅ Step 3: Task 생성 (이제 projectId 포함)
        const task = new Task({
          projectId: new mongoose.Types.ObjectId(projectId), // ✅ projectId 추가
          name,
          description: description || '',
          status,
          managers: managersObjectIds,
          startDate: startDate || null,
          endDate: endDate || null,
          progress: progress || 0,
          priority: priority || false,
        });

        await task.save();
        console.log('✅ Task created successfully:', task);

        // ✅ Step 4: Project에 Task 추가
        const updatedProject = await Project.findByIdAndUpdate(
          projectId,
          { $push: { tasks: task._id } },
          { new: true }
        );

        if (!updatedProject) {
          throw new Error(`Project with ID ${projectId} not found`);
        }

        console.log('✅ Task added to Project:', updatedProject);

        return await Task.findById(task._id)
          .populate('managers')
          .populate('subTasks')
          .populate('projectId'); // ✅ 프로젝트 정보도 가져오기
      } catch (err) {
        console.error('❌ Error in createTask:', err.message);
        throw new Error(`Failed to create task: ${err.message}`);
      }
    },
    updateTask: async (
      _,
      {
        id,
        name,
        description,
        status,
        managers,
        startDate,
        endDate,
        progress,
        priority,
      }
    ) => {
      try {
        const managersObjectIds = managers
          ? managers.map((m) => {
              if (!mongoose.Types.ObjectId.isValid(m)) {
                throw new Error(`Invalid manager ID: ${m}`);
              }
              return new mongoose.Types.ObjectId(m);
            })
          : [];

        const task = await Task.findByIdAndUpdate(
          id,
          {
            name,
            description,
            status,
            managers: managersObjectIds,
            startDate,
            endDate,
            progress,
            priority,
          },
          { new: true }
        )
          .populate('managers')
          .populate('subTasks');
        if (!task) throw new Error('Task not found');
        return task;
      } catch (err) {
        throw new Error('Failed to update task');
      }
    },
    deleteTask: async (_, { id }) => {
      try {
        const task = await Task.findById(id);
        if (!task) throw new Error('Task not found');

        await Task.findByIdAndDelete(id);

        await Project.updateMany({ tasks: id }, { $pull: { tasks: id } });

        return task;
      } catch (err) {
        console.error('❌ Failed to delete task:', err.message);
        throw new Error('Failed to delete task');
      }
    },
  },
};

export default taskResolver;
