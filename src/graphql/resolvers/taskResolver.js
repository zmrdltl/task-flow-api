import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { Project, Task, Member } from '../../models/index.js';

const taskResolver = {
  Query: {
    getTasks: async (_, __, context) => {
      await authMiddleware({ request: context.request });

      try {
        return await Task.find().populate('managers').populate('subTasks');
      } catch (err) {
        throw new Error('Failed to fetch tasks');
      }
    },
    getTaskById: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });
      try {
        const task = await Task.findById(id)
          .populate('managers')
          .populate({
            path: 'comments',
            populate: { path: 'memberId' },
          })
          .populate({
            path: 'subTasks',
            populate: {
              path: 'comments', // subTask 내의 comments도 populate
              populate: { path: 'memberId' }, // comment의 memberId도 populate
            },
          });

        if (!task) throw new Error('Task not found');

        // ID 변환 및 필드 처리
        const processedTask = {
          ...task._doc,
          id: task._id.toString(),
          comments:
            task.comments && task.comments.length > 0
              ? task.comments.map((comment) => ({
                  ...comment._doc,
                  id: comment._id.toString(),
                  member: comment.memberId,
                  taskId: task._id.toString(),
                }))
              : [],
          subTasks:
            task.subTasks && task.subTasks.length > 0
              ? task.subTasks.map((subTask) => ({
                  ...subTask._doc,
                  id: subTask._id.toString(),
                  comments:
                    subTask.comments && subTask.comments.length > 0
                      ? subTask.comments.map((comment) => ({
                          ...comment._doc,
                          id: comment._id.toString(),
                          member: comment.memberId,
                          taskId: subTask._id.toString(),
                        }))
                      : [],
                }))
              : [],
        };

        return processedTask;
      } catch (err) {
        console.error('Error in getTaskById:', err);
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
      },
      context
    ) => {
      await authMiddleware({ request: context.request });

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
      },
      context
    ) => {
      await authMiddleware({ request: context.request });

      try {
        const task = await Task.findByIdAndUpdate(
          id,
          {
            name,
            description,
            status,
            managers,
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
    deleteTask: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });

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
    createSubTask: async (_, { parentTaskId, task }, context) => {
      await authMiddleware({ request: context.request });

      try {
        // parentTaskId 유효성 검사
        if (!mongoose.Types.ObjectId.isValid(parentTaskId)) {
          throw new Error(`Invalid parentTaskId: ${parentTaskId}`);
        }

        const parentTask = await Task.findById(parentTaskId);
        if (!parentTask) {
          throw new Error(`Parent task with ID ${parentTaskId} not found`);
        }

        // SubTask 생성
        const subTask = new Task({
          projectId: parentTask.projectId,
          ...task,
        });

        await subTask.save();

        // 부모 Task에 SubTask 추가
        await Task.findByIdAndUpdate(
          parentTaskId,
          { $push: { subTasks: subTask._id } },
          { new: true }
        );

        return await Task.findById(subTask._id)
          .populate('managers')
          .populate('subTasks');
      } catch (err) {
        console.error('❌ Error in createSubTask:', err.message);
        throw new Error(`Failed to create subtask: ${err.message}`);
      }
    },
    deleteSubTask: async (_, { parentTaskId, subTaskId }, context) => {
      await authMiddleware({ request: context.request });

      try {
        // parentTaskId와 subTaskId 유효성 검사
        if (
          !mongoose.Types.ObjectId.isValid(parentTaskId) ||
          !mongoose.Types.ObjectId.isValid(subTaskId)
        ) {
          throw new Error(`Invalid parentTaskId or subTaskId`);
        }

        // 부모 Task 찾기
        const parentTask = await Task.findById(parentTaskId);
        if (!parentTask) {
          throw new Error(`Parent task with ID ${parentTaskId} not found`);
        }

        // SubTask 찾기
        const subTask = await Task.findById(subTaskId);
        if (!subTask) {
          throw new Error(`SubTask with ID ${subTaskId} not found`);
        }

        // 부모 Task에서 SubTask 제거
        await Task.findByIdAndUpdate(
          parentTaskId,
          { $pull: { subTasks: subTaskId } },
          { new: true }
        );

        // SubTask 삭제
        await Task.findByIdAndDelete(subTaskId);

        return subTask;
      } catch (err) {
        console.error('❌ Error in deleteSubTask:', err.message);
        throw new Error(`Failed to delete subtask: ${err.message}`);
      }
    },
    addMemberToTask: async (_, { taskId, memberId }, context) => {
      await authMiddleware({ request: context.request });

      try {
        // 유효한 ID인지 확인
        if (
          !mongoose.Types.ObjectId.isValid(taskId) ||
          !mongoose.Types.ObjectId.isValid(memberId)
        ) {
          throw new Error('Invalid taskId or memberId');
        }

        // Task 확인
        const task = await Task.findById(taskId);
        if (!task) throw new Error('Task not found');

        // Member 확인
        const member = await Member.findById(memberId);
        if (!member) throw new Error('Member not found');

        // 이미 멤버가 추가되어 있는지 확인
        if (task.managers.includes(memberId)) {
          throw new Error('Member is already assigned to this task');
        }

        // 멤버 추가
        task.managers.push(memberId);
        await task.save();

        return await Task.findById(taskId)
          .populate('managers')
          .populate('subTasks');
      } catch (err) {
        throw new Error(`Failed to add member to task: ${err.message}`);
      }
    },
    removeMemberFromTask: async (_, { taskId, memberId }, context) => {
      await authMiddleware({ request: context.request });

      try {
        if (
          !mongoose.Types.ObjectId.isValid(taskId) ||
          !mongoose.Types.ObjectId.isValid(memberId)
        ) {
          throw new Error('Invalid taskId or memberId');
        }

        const task = await Task.findById(taskId);
        if (!task) throw new Error('Task not found');

        // 멤버가 존재하는지 확인
        if (!task.managers.includes(memberId)) {
          throw new Error('Member is not assigned to this task');
        }

        // 멤버 삭제
        task.managers = task.managers.filter(
          (id) => id.toString() !== memberId
        );
        await task.save();

        return await Task.findById(taskId)
          .populate('managers')
          .populate('subTasks');
      } catch (err) {
        throw new Error(`Failed to remove member from task: ${err.message}`);
      }
    },
  },
};

export default taskResolver;
