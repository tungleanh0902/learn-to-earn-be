import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const questionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        required: true,
    },
    lessonId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);