import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const txOnchainSchema = new mongoose.Schema({
    tx: {
        type: String,
        required: true,
        unique: true
    },
    action: { 
        type: String, 
        enum: ['buy_voucher', 'mint_nft', 'save_streak', 'buy_quizz', 'withdraw'], 
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    amount: {
        type: Number,
        require: true
    },
    voucherId: {
        type: mongoose.Types.ObjectId,
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.TxOnchain || mongoose.model('TxOnchain', txOnchainSchema);