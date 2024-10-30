import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const seasonBadgeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.SeasonBadge || mongoose.model('SeasonBadge', seasonBadgeSchema);