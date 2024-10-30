import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const sentenceAnswerSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.models.SentenceAnswer || mongoose.model('SentenceAnswer', sentenceAnswerSchema);