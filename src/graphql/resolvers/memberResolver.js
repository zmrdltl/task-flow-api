import { Member } from '../../models/index.js';

const memberResolver = {
  Query: {
    getMembers: async () => {
      try {
        return await Member.find();
      } catch (err) {
        throw new Error('Failed to fetch members');
      }
    },
    getMemberById: async (_, { id }) => {
      try {
        const member = await Member.findById(id);
        if (!member) throw new Error('Member not found');
        return member;
      } catch (err) {
        throw new Error('Failed to fetch member');
      }
    },
  },
  Mutation: {
    createMember: async (_, { email, nickname, isActive }) => {
      try {
        const member = new Member({ email, nickname, isActive });
        await member.save();
        return member;
      } catch (err) {
        throw new Error('Failed to create member');
      }
    },
    updateMember: async (_, { id, email, nickname, isActive }) => {
      try {
        const member = await Member.findByIdAndUpdate(
          id,
          { email, nickname, isActive },
          { new: true }
        );
        if (!member) throw new Error('Member not found');
        return member;
      } catch (err) {
        throw new Error('Failed to update member');
      }
    },
    deleteMember: async (_, { id }) => {
      try {
        const member = await Member.findByIdAndDelete(id);
        if (!member) throw new Error('Member not found');
        return member;
      } catch (err) {
        throw new Error('Failed to delete member');
      }
    },
  },
};

export default memberResolver;
