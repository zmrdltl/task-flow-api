import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { Project, Member } from '../../models/index.js';

const memberResolver = {
  Query: {
    getMembers: async (_, __, context) => {
      await authMiddleware({ request: context.request });

      try {
        return await Member.find().populate('role');
      } catch (err) {
        throw new Error('Failed to fetch members');
      }
    },
    getMemberById: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });

      try {
        const member = await Member.findById(id).populate('role');
        if (!member) throw new Error('Member not found');
        return member;
      } catch (err) {
        throw new Error('Failed to fetch member');
      }
    },
    getMembersByProject: async (_, { projectId }, context) => {
      await authMiddleware({ request: context.request });

      try {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          throw new Error(`Invalid projectId: ${projectId}`);
        }

        return await Member.find({ projectId }).populate('role');
      } catch (err) {
        console.error('❌ Failed to get members:', err.message);
        throw new Error(`Failed to get members: ${err.message}`);
      }
    },
    getMembersByEmail: async (_, { email }, context) => {
      await authMiddleware({ request: context.request });

      try {
        return await Member.find({ email }).populate('role');
      } catch (err) {
        console.error('❌ Failed to get members:', err.message);
        throw new Error(`Failed to get members: ${err.message}`);
      }
    },
  },
  Mutation: {
    createMember: async (
      _,
      { email, nickname, isActive, projectId },
      context
    ) => {
      await authMiddleware({ request: context.request });

      try {
        console.log('📌 Received Input:', {
          email,
          nickname,
          isActive,
          projectId,
        });

        if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
          throw new Error(`Invalid projectId: ${projectId}`);
        }

        const member = new Member({
          email,
          nickname,
          isActive: isActive ?? true, // ✅ 기본값 설정
          projectId: projectId ? new mongoose.Types.ObjectId(projectId) : null, // ✅ projectId 추가
        });

        await member.save();
        console.log('✅ Member created:', member);

        if (projectId) {
          await Project.findByIdAndUpdate(
            projectId,
            { $push: { members: member._id } }, // ✅ Project에도 추가
            { new: true }
          );
        }

        return member;
      } catch (err) {
        console.error('❌ Failed to create member:', err.message);
        throw new Error(`Failed to create member: ${err.message}`);
      }
    },
    updateMember: async (_, { id, email, nickname, isActive }, context) => {
      await authMiddleware({ request: context.request });

      try {
        const member = await Member.findById(id);
        if (!member) throw new Error('Member not found');

        // ✅ Member 정보 업데이트
        const updatedMember = await Member.findByIdAndUpdate(
          id,
          { email, nickname, isActive },
          { new: true }
        );

        return updatedMember;
      } catch (err) {
        console.error('❌ Failed to update member:', err.message);
        throw new Error('Failed to update member');
      }
    },
    deleteMember: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });

      try {
        const member = await Member.findById(id);
        if (!member) throw new Error('Member not found');

        // ✅ Project에서 해당 멤버 삭제
        await Project.updateMany({ members: id }, { $pull: { members: id } });

        // ✅ Member 삭제
        await Member.findByIdAndDelete(id);

        return member;
      } catch (err) {
        console.error('❌ Failed to delete member:', err.message);
        throw new Error('Failed to delete member');
      }
    },
  },
};

export default memberResolver;
