import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Types.ObjectId,
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    forSale: {
        type: Boolean, 
        default: false
    },
    price: {
        type: String,
        default: "0"
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Voucher || mongoose.model('Voucher', voucherSchema);