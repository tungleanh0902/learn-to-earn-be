import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const trackingSchema = new mongoose.Schema({
    userIds: {
        type: [mongoose.Types.ObjectId],
        required: true,
    },
}, {
    timestamps: true
});

module.exports = mongoose.models.Tracking || mongoose.model('Tracking', trackingSchema);