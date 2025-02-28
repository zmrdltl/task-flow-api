import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['ToDo', 'InProgress', 'Done'],
    required: true,
  },
  managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  startDate: { type: Date },
  endDate: { type: Date },
  progress: { type: Number, min: 0, max: 100 },
  subTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  priority: { type: Boolean, default: false },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
