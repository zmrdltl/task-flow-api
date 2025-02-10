import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false,
  },
  email: { type: String, required: true },
  nickname: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  profileImage: { type: String },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
});

const Member = mongoose.model('Member', memberSchema);
export default Member;
