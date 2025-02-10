import mongoose from 'mongoose';
import { Role, Member } from '../../models/index.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const roleResolver = {
  Query: {
    getRoles: async (_, __, context) => {
      await authMiddleware({ request: context.request });
      try {
        return await Role.find();
      } catch (err) {
        throw new Error('Failed to fetch roles');
      }
    },
    getRolesByProjectId: async (_, { projectId }, context) => {
      await authMiddleware({ request: context.request });
      try {
        return await Role.find({ projectId });
      } catch (err) {
        throw new Error(`Failed to fetch roles: ${err.message}`);
      }
    },
    getRoleById: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });
      try {
        const role = await Role.findById(id);
        if (!role) throw new Error('Role not found');
        return role;
      } catch (err) {
        throw new Error('Failed to fetch role');
      }
    },
  },
  Mutation: {
    createRole: async (
      _,
      { name, permissions, projectId, memberId },
      context
    ) => {
      await authMiddleware({ request: context.request });
      try {
        const role = new Role({
          name,
          permissions: permissions || [],
          projectId: projectId,
          memberId: memberId,
        });

        await role.save();
        return await Role.findById(role._id);
      } catch (err) {
        throw new Error(`Failed to create role: ${err.message}`);
      }
    },
    createRoleByMemberEmail: async (_, { projectId, email }, context) => {
      await authMiddleware({ request: context.request });
      try {
        // 이메일로 멤버 조회
        const member = await Member.findOne({ email });
        if (!member) {
          throw new Error(`Member with email ${email} not found`);
        }

        // Role 생성
        const role = new Role({
          name: 'MEMBER',
          permissions: ['READ_AND_COMMENT'],
          projectId: projectId,
          memberId: member._id,
        });
        await role.save();

        const createdRole = await Role.findById(role._id);

        // member와 생성된 role 반환
        return {
          member,
          role: createdRole,
        };
      } catch (err) {
        throw new Error(`Failed to create role: ${err.message}`);
      }
    },
    updateRole: async (
      _,
      { id, name, permissions, projectId, memberId },
      context
    ) => {
      await authMiddleware({ request: context.request });
      try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (permissions !== undefined) updateData.permissions = permissions;
        if (projectId !== undefined) {
          if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new Error(`Invalid projectId: ${projectId}`);
          }
          updateData.projectId = new mongoose.Types.ObjectId(projectId);
        }
        if (memberId !== undefined) {
          if (!mongoose.Types.ObjectId.isValid(memberId)) {
            throw new Error(`Invalid memberId: ${memberId}`);
          }
          updateData.memberId = new mongoose.Types.ObjectId(memberId);
        }
        const role = await Role.findByIdAndUpdate(id, updateData, {
          new: true,
        });

        if (!role) throw new Error('Role not found');
        return role;
      } catch (err) {
        throw new Error(`Failed to update role: ${err.message}`);
      }
    },
    deleteRole: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });
      try {
        const role = await Role.findById(id);
        if (!role) throw new Error('Role not found');
        await Role.findByIdAndDelete(id);
        return role;
      } catch (err) {
        throw new Error(`Failed to delete role: ${err.message}`);
      }
    },
  },
};

export default roleResolver;
