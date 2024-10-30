import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const answerSchema = new mongoose.Schema({
    optionId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    questionId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Answer || mongoose.model('Answer', answerSchema);