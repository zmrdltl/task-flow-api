import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 'ADMIN', 'MEMBER', 'GUEST'
  permissions: [{ type: String, required: false }], // 'ALL', 'READ_AND_COMMENT', 'READONLY'
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
});

const Role = mongoose.model('Role', roleSchema);
export default Role;
