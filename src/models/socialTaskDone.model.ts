import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const socialTaskSchema = new mongoose.Schema({
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

module.exports = mongoose.models.SocialTask || mongoose.model('SocialTask', socialTaskSchema);