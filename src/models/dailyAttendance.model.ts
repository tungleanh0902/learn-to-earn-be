import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const dailyAttendenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.DailyAttendence || mongoose.model('DailyAttendence', dailyAttendenceSchema);