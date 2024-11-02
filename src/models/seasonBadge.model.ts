import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const seasonBadgeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    seasonBegin: {
        type: Number,
        required: true
    },
    seasonEnd: {
        type: Number,
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
    explorerUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.SeasonBadge || mongoose.model('SeasonBadge', seasonBadgeSchema);