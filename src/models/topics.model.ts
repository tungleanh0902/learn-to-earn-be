import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const topicSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Topic || mongoose.model('Topic', topicSchema);