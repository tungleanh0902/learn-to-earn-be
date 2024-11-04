import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    isCampaign: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);