import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const wordSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    topicId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Word || mongoose.model('Word', wordSchema);