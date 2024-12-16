import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    email: { type: String, required: true },
    nickname: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  });

const Member = mongoose.model('Member', memberSchema);
export default Member;