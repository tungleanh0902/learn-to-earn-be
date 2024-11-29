import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const cvProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.models.CVProfile || mongoose.model('CVProfile', cvProfileSchema);