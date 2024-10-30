import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const userSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
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
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
    timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);