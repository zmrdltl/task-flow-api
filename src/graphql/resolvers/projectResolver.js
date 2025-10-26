import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { Project, Member, Role, Task, Comment } from '../../models/index.js';
import { getIsClicked, getLikeCount } from '../../utils/commentUtils.js';
const projectResolver = {
  Query: {
    getProjects: async (_, __, context) => {
      try {
        const userData = await authMiddleware({ request: context.request });
        const member = await Member.findOne({ email: userData.email });

        const projects = await Project.find()
          .populate({
            path: 'members',
            populate: { path: 'role' },
          })
          .populate({
            path: 'tasks',
            populate: [
              { path: 'managers' },
              {
                path: 'subTasks',
                populate: [
                  { path: 'managers' },
                  {
                    path: 'comments',
                    populate: [{ path: 'memberId' }],
                  },
                ],
              },
              {
                path: 'comments',
                populate: [{ path: 'memberId' }],
              },
            ],
          });

        const response = await Promise.all(
          projects.map((project) => ({
            ...project._doc,
            id: project._id.toString(),
            tasks: project.tasks.map((task) => ({
              ...task._doc,
              id: task._id.toString(),
              comments: task.comments.map(async (comment) => ({
                ...comment._doc,
                id: comment._id.toString(),
                member: comment.memberId, // ✅ `memberId`를 `member`로 변환
                taskId: comment.taskId ? comment.taskId.toString() : null,
                isClicked: await getIsClicked(comment._id, member._id),
                likeCount: await getLikeCount(comment._id),
              })),
              subTasks: task.subTasks.map((subTask) => ({
                ...subTask._doc,
                id: subTask._id.toString(),
                comments: subTask.comments.map(async (comment) => ({
                  ...comment._doc,
                  id: comment._id.toString(),
                  member: comment.memberId, // ✅ `memberId`를 `member`로 변환
                  taskId: comment.taskId ? comment.taskId.toString() : null,
                  isClicked: await getIsClicked(comment._id, member._id),
                  likeCount: await getLikeCount(comment._id),
                })),
              })),
            })),
          }))
        );

        console.log('📌 최종 Projects:', JSON.stringify(response, null, 2));
        return response;
      } catch (err) {
        throw new Error('Failed to fetch projects');
      }
    },
    getProjectById: async (_, { id }, context) => {
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

      try {
        const project = await Project.findById(id)
          .populate({
            path: 'members',
            populate: { path: 'role' },
          })
          .populate({
            path: 'tasks',
            populate: [
              { path: 'managers' },
              {
                path: 'subTasks',
                populate: [
                  { path: 'managers' },
                  {
                    path: 'comments',
                    populate: [{ path: 'memberId' }],
                  },
                ],
              },
              {
                path: 'comments',
                populate: [{ path: 'memberId' }],
              },
            ],
          });

        if (!project) throw new Error('Project not found');
        console.log('📌 project:', JSON.stringify(project, null, 2));
        const response = {
          ...project._doc,
          id: project._id.toString(),
          tasks: await Promise.all(
            project.tasks.map(async (task) => ({
              ...task._doc,
              id: task._id.toString(),
              comments: await Promise.all(
                task.comments.map(async (comment) => ({
                  ...comment._doc,
                  id: comment._id.toString(),
                  member: comment.memberId,
                  taskId: comment.taskId ? comment.taskId.toString() : null,
                  isClicked: await getIsClicked(comment._id, member._id),
                  likeCount: await getLikeCount(comment._id),
                }))
              ),
              subTasks: await Promise.all(
                task.subTasks.map(async (subTask) => ({
                  ...subTask._doc,
                  id: subTask._id.toString(),
                  comments: await Promise.all(
                    subTask.comments.map(async (comment) => ({
                      ...comment._doc,
                      id: comment._id.toString(),
                      member: comment.memberId,
                      taskId: comment.taskId ? comment.taskId.toString() : null,
                      isClicked: await getIsClicked(comment._id, member._id),
                      likeCount: await getLikeCount(comment._id),
                    }))
                  ),
                }))
              ),
            }))
          ),
        };

        return response;
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
        const project = await Project.findById(projectId);
        if (!project) throw new Error(`Project with ID ${projectId} not found`);

        let member = await Member.findOne({ email });
        if (!member) {
          member = new Member({
            email,
            nickname: email.split('@')[0], // 기본 닉네임
            isActive: true,
          });
          await member.save();
        }

        if (project.members.includes(member._id)) {
          throw new Error(
            `Member with email ${email} is already in the project`
          );
        }

        // Role 생성
        const role = new Role({
          name,
          permissions,
          projectId: projectId,
          memberId: member._id,
        });
        await role.save();

        // Member 객체에 Role 연결
        member.role = role._id;
        await member.save();

        // 프로젝트에 멤버 추가
        project.members.push(member._id);
        await project.save();

        // Member 객체를 role 정보와 함께 populate
        const populatedMember = await Member.findById(member._id).populate(
          'role'
        );

        return {
          member: populatedMember,
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
        const project = await Project.findById(projectId);
        if (!project) throw new Error(`Project with ID ${projectId} not found`);

        const member = await Member.findById(memberId);
        if (!member) throw new Error(`Member with ID ${memberId} not found`);

        // 1. 프로젝트에서 멤버 제거
        await Project.findByIdAndUpdate(
          projectId,
          { $pull: { members: memberId } },
          { new: true }
        );

        // 2. 해당 멤버의 Role 제거
        await Role.deleteOne({ projectId: projectId, memberId: memberId });

        // 3. 모든 Task에서 해당 멤버를 managers에서 제거 (배열 업데이트)
        await Task.updateMany(
          { projectId, managers: memberId }, // 프로젝트와 해당 멤버가 managers에 포함된 문서 찾기
          { $pull: { managers: memberId } } // 해당 멤버 제거
        );

        // 4. 모든 SubTask에서 해당 멤버를 managers에서 제거 (배열 업데이트)
        await Task.updateMany(
          { 'subTasks.managers': memberId }, // 하위 Task에 해당 멤버가 managers에 포함된 경우
          { $pull: { 'subTasks.managers': memberId } } // 하위 Task에서 해당 멤버 제거
        );

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
