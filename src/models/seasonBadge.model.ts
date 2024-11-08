import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const seasonBadgeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    seasonBegin: {
        type: Date,
        required: true
    },
    seasonEnd: {
        type: Date,
        required: true
    },
    metadata: {
        type: String,
        required: true
    },
    contentUrl: {
        type: String,
        required: true
    },
    mintPrice: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    nextItemIndex: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true
});

module.exports = mongoose.models.SeasonBadge || mongoose.model('SeasonBadge', seasonBadgeSchema);