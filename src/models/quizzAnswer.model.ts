import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const quizzAnswerSchema = new mongoose.Schema({
    optionId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    isCampaign: {
        type: Boolean,
        default: false
    },
    isAddition: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.QuizzAnswer || mongoose.model('QuizzAnswer', quizzAnswerSchema);