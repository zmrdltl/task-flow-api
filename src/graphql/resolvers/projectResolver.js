import { Project, Member, Task, Role } from '../../models/index.js';
import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const projectResolver = {
  Query: {
    getProjects: async (_, __, context) => {
      await authMiddleware({ request: context.request });

      try {
        return await Project.find().populate('members').populate('tasks');
      } catch (err) {
        throw new Error('Failed to fetch projects');
      }
    },
    getProjectById: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });

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
    createProject: async (
      _,
      { name, description, members, endDate },
      context
    ) => {
      // 현재 로그인한 Google 사용자 정보 획득
      const googleUserData = await authMiddleware({ request: context.request });
      try {
        // 1. 현재 로그인한 사용자를 Member 컬렉션에서 조회 (없으면 생성)
        let currentMember = await Member.findOne({
          email: googleUserData.email,
        });
        if (!currentMember) {
          currentMember = new Member({
            googleId: googleUserData.sub,
            email: googleUserData.email,
            nickname: googleUserData.name,
            profileImage: googleUserData.picture,
            isActive: true,
            // projectId는 나중에 프로젝트 생성 후 업데이트할 수 있습니다.
          });
          await currentMember.save();
        }

        // 2. 전달된 members 배열에 현재 사용자의 ID가 없다면 추가

        const membersObjectIds = [
          new mongoose.Types.ObjectId(currentMember._id),
        ];

        // 3. 프로젝트 생성
        const project = new Project({
          name,
          description,
          members: membersObjectIds,
          endDate,
        });
        await project.save();

        // 4. 프로젝트 생성 후, 현재 사용자에게 ADMIN Role 부여
        const adminRole = new Role({
          name: 'ADMIN',
          permissions: ['ALL'],
          projectId: project._id,
          memberId: currentMember._id,
        });
        await adminRole.save();

        currentMember.role = adminRole._id;
        await currentMember.save();

        console.log('📌 Admin Role:', adminRole);
        // 5. 생성된 프로젝트를 populate 하여 반환
        return await Project.findById(project._id)
          .populate({
            path: 'members',
            populate: { path: 'role' },
          })
          .populate('tasks');
      } catch (err) {
        throw new Error(`Failed to create project: ${err.message}`);
      }
    },
    updateProject: async (
      _,
      { id, name, description, members, tasks, endDate },
      context
    ) => {
      await authMiddleware({ request: context.request });

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

    deleteProject: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });

      try {
        const project = await Project.findByIdAndDelete(id);
        if (!project) throw new Error('Project not found');

        // 연관된 Task 삭제
        await Task.deleteMany({ projectId: project._id });
        // 연관된 Role 삭제
        await Role.deleteMany({ projectId: project._id });
        return project;
      } catch (err) {
        throw new Error('Failed to delete project');
      }
    },
  },
};

export default projectResolver;
