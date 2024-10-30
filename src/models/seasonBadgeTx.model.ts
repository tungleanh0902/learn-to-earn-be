import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const seasonBadgeTxSchema = new mongoose.Schema({
    badgeId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    tokenId: {
        type: String,
        required: true
    },
    tx: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.SeasonBadgeTx || mongoose.model('SeasonBadgeTx', seasonBadgeTxSchema);