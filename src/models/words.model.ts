import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const wordSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    meaning: {
        type: String,
        required: true,
    },
    topicIds: {
        type: [mongoose.Types.ObjectId],
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Word || mongoose.model('Word', wordSchema);