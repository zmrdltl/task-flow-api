import { Project, Member, Task, Role } from '../../models/index.js';
import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const projectResolver = {
  Query: {
    getProjects: async (_, __, context) => {
      await authMiddleware({ request: context.request });

      try {
        return await Project.find()
          .populate({
            path: 'members',
            populate: { path: 'role' },
          })
          .populate('tasks');
      } catch (err) {
        throw new Error('Failed to fetch projects');
      }
    },
    getProjectById: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });

      try {
        const project = await Project.findById(id)
          .populate({
            path: 'members',
            populate: { path: 'role' },
          })
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
          .populate({
            path: 'members',
            populate: { path: 'role' },
          })
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

    createMemberFromProject: async (
      _,
      { projectId, email, name = 'MEMBER', permissions = ['READ_AND_COMMENT'] },
      context
    ) => {
      await authMiddleware({ request: context.request });

      try {
        // 프로젝트 존재 여부 확인
        const project = await Project.findById(projectId);
        if (!project) throw new Error(`Project with ID ${projectId} not found`);

        // 이메일로 멤버 조회 (없으면 생성)
        let member = await Member.findOne({ email });
        if (!member) {
          member = new Member({
            email,
            nickname: email.split('@')[0], // 기본 닉네임
            isActive: true,
          });
          await member.save();
        }

        // 프로젝트에 이미 추가된 멤버인지 확인
        if (project.members.includes(member._id)) {
          throw new Error(
            `Member with email ${email} is already in the project`
          );
        }

        // 프로젝트에 멤버 추가
        await Project.findByIdAndUpdate(
          projectId,
          { $addToSet: { members: member._id } }, // 중복 방지
          { new: true }
        );

        // Role 생성 (기본적으로 MEMBER 권한 부여)
        const role = new Role({
          name,
          permissions,
          projectId: projectId,
          memberId: member._id,
        });
        await role.save();

        return {
          member,
          role,
          message: `Member ${email} added to project successfully`,
        };
      } catch (err) {
        throw new Error(`Failed to add member to project: ${err.message}`);
      }
    },

    removeMemberFromProject: async (_, { projectId, memberId }, context) => {
      await authMiddleware({ request: context.request });

      try {
        // 프로젝트 존재 여부 확인
        const project = await Project.findById(projectId);
        if (!project) throw new Error(`Project with ID ${projectId} not found`);

        // 멤버 존재 여부 확인
        const member = await Member.findById(memberId);
        if (!member) throw new Error(`Member with ID ${memberId} not found`);

        // 프로젝트에서 멤버 제거
        await Project.findByIdAndUpdate(
          projectId,
          { $pull: { members: memberId } }, // 멤버 제거
          { new: true }
        );

        // 해당 멤버의 Role 제거 (프로젝트에 속한 Role 삭제)
        await Role.deleteOne({ projectId: projectId, memberId: memberId });

        return {
          message: `Member ${member.email} removed from project successfully`,
        };
      } catch (err) {
        throw new Error('Failed to remove member from project');
      }
    },
  },
};

export default projectResolver;
