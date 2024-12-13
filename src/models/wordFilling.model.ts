import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const wordFillingSchema = new mongoose.Schema({
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

module.exports = mongoose.models.WordFillingAnswer || mongoose.model('WordFillingAnswer', wordFillingSchema);