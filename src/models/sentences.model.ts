import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const sentenceSchema = new mongoose.Schema({
    content: {
        type: [String],
        required: true,
    },
    createdBy: {
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

module.exports = mongoose.models.Sentence || mongoose.model('Sentence', sentenceSchema);