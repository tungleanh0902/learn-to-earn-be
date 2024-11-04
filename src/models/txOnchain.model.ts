import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const txOnchainSchema = new mongoose.Schema({
    tx: {
        type: String,
        required: true,
    },
    action: { 
        type: String, 
        enum: ['transfer', 'mint_nft'], 
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    amount: {
        type: Number,
        require: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.TxOnchain || mongoose.model('TxOnchain', txOnchainSchema);