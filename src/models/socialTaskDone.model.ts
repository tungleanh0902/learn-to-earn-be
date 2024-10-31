import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const socialTaskDoneSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.models.SocialTaskDone || mongoose.model('SocialTaskDone', socialTaskDoneSchema);