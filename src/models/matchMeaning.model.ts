import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const matchMeaningSchema = new mongoose.Schema({
    answer: {
        type: [],
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

module.exports = mongoose.models.MeanMatchingAnswer || mongoose.model('MeanMatchingAnswer', matchMeaningSchema);