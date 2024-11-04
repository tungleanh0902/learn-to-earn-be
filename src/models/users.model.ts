import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const userSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true
    },
    points: {
        type: Number,
        default: 0,
    },
    tickets: {
        type: Number,
        default: 0,
    },
    multiplier: {
        type: Number,
        default: 1
    },
    streak: {
        type: Number,
        default: 1
    },
    refCode: {
        type: String,
        required: true,
    },
    refUser: {
        type: mongoose.Types.ObjectId
    },
    hasStreakSaver: {
        type: Boolean,
        default: false,
    },
    moreQuizz: {
        type: Number,
        default: 0
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
    timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);