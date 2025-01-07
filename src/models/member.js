import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  email: { type: String, required: true },
  nickname: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const Member = mongoose.model('Member', memberSchema);
export default Member;
