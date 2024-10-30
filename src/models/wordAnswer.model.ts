import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const wordAnswerSchema = new mongoose.Schema({
    wordIds: {
        type: [mongoose.Types.ObjectId],
        required: true,
    },
    topicId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    point: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.WordAnswer || mongoose.model('WordAnswer', wordAnswerSchema);