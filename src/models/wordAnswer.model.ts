import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const wordAnswerSchema = new mongoose.Schema({
    wordIdsAnswer: {
        type: [mongoose.Types.ObjectId],
    },
    topicId: {
        type: mongoose.Types.ObjectId,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    points: {
        type: Number,
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.WordAnswer || mongoose.model('WordAnswer', wordAnswerSchema);