import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const socialTaskSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    hidden: {
        type: Boolean,
        default: false
    },
    tag: { 
        type: String, 
        enum: ['onchain', 'academy', 'social'],
    },
}, {
    timestamps: true
});

module.exports = mongoose.models.SocialTask || mongoose.model('SocialTask', socialTaskSchema);