import mongoose from "mongoose"
import { Address, Cell } from "@ton/ton";
import { getTransactionByMessage, getTxData, sleep } from "../../helper/helper";
import { getNftAddress } from "../users/user.controller";
import { tonQuery, OWNER_ADDRESS, BUY_VOUCHER, SHARE_REF, MINT_NFT_FEE, STORE_FEE, TON_CENTER_RPC, OWNER_ADDRESS_EVM, BUY_VOUCHER_EVM, BADGE_CONTRACT } from "../../config"
import Web3 from 'web3';

const User = require('../../models/users.model')
const TxOnchain = require('../../models/txOnchain.model')
const Voucher = require('../../models/voucher.model')

require('dotenv').config()

export const onManageVoucher = {
    doCreateVoucher: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const vouchers = req.body.vouchers

            for (let index = 0; index < vouchers.length; index++) {
                const voucher = vouchers[index];

                await Voucher.create({
                    code: voucher.code,
                    title: voucher.title,
                    activationDate: voucher?.activationDate,
                    activationPeriod: voucher?.activationPeriod,
                    createdBy: _id
                })
            }

            return res.status(200).send({
                data: "success"
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doChangeVoucher: async (req: any, res: any, next: any) => {
        try {
            const voucherId = req.body.voucherId
            const code = req.body.code
            const title = req.body.title
            const isHidden = req.body.isHidden

            await Voucher.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(voucherId)
            }, {
                code,
                title,
                isHidden
            })

            return res.status(200).send({
                data: "success"
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doBuyVoucherKaia: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const tx = req.body.tx
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            if (!user.evmAddress) {
                return res.status(400).send({
                    message: "Account not link evm wallet yet"
                });
            }
            const web3 = new Web3(process.env.RPC_KAIA);
            let txReceipt = await web3.eth.getTransactionReceipt(tx)
            let txData = await web3.eth.getTransaction(tx)
            console.log(txData.from);
            console.log(user.evmAddress);
            if (txReceipt.status.toString() != "1"
                || user.evmAddress != txData.from
                || OWNER_ADDRESS_EVM != txData.to
                || BUY_VOUCHER_EVM != txData.value
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            let voucher = await Voucher.findOneAndUpdate({ owner: null }, {
                owner: _id
            }, {
                new: true
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "buy_voucher",
                amount: BUY_VOUCHER,
                voucherId: voucher._id
            })
            
            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser,
                    voucher
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doBuyVoucher: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const boc = req.body?.boc
            const voucherId = req.body?.voucherId
            let tx = "null"
            let txOnChain = await TxOnchain.find({action: 'buy_voucher'})
            let voucher
            
            if (voucherId) {
                voucher = await Voucher.aggregate([
                    {
                        $match: {
                            _id: new mongoose.Types.ObjectId(voucherId)
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    { $unwind: "$owner" },
                ])
            } else {
                voucher = await Voucher.aggregate([
                    {
                        $match: {
                            owner: null
                        }
                    },
                ])
            }
            voucher = voucher[0]
            
            let amount = BUY_VOUCHER
            if (boc != null && txOnChain.length >= 24) {
                let message_hash = Cell.fromBase64(boc).hash().toString("hex")
                tx = await getTransactionByMessage(message_hash)
                let txData = await getTxData({
                    hash: tx,
                    refetchLimit: 60
                })
                if (txData == null) {
                    return res.status(400).send({
                        message: "Invalid boc"
                    });
                }
                let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

                let time = txData["utime"] * 1000
                let txTime = new Date(time)
                let now = new Date()
                let diffMins = Math.round((now.getTime() - txTime.getTime()) / (60 * 60 * 1000));
                let ownerAddress = Address.parse(OWNER_ADDRESS).toRawString()

                if (voucherId) {
                    ownerAddress = voucher.owner.address
                    amount = voucher.price
                }

                // if (amount != txData["out_msgs"][0].value.toString()
                //     || user.address != txData["out_msgs"][0].source.address
                //     || ownerAddress != txData["out_msgs"][0].destination.address
                //     || txData["success"] != true
                //     || diffMins > 10
                // ) {
                //     return res.status(400).send({
                //         message: "Invalid tx"
                //     });
                // }
            } else if (!boc && txOnChain >= 23) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            if (voucherId) {
                await Voucher.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(voucherId) }, {
                    owner: _id,
                    forSale: false,
                    price: "0"
                }, {
                    new: true
                })
            } else {
                await Voucher.findOneAndUpdate({ owner: null }, {
                    owner: _id,
                    forSale: false,
                    price: "0"
                }, {
                    new: true
                })
            }

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "buy_voucher",
                amount: amount,
                voucherId: voucher._id
            })
            
            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser,
                    voucher
                }
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetVoucher: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            
            const tx = await TxOnchain.aggregate([
                { 
                    $match: { 
                        userId: new mongoose.Types.ObjectId(_id),
                        action: 'buy_voucher'
                    }
                },
                {
                    $lookup: {
                        from: "vouchers",
                        localField: "voucherId",
                        foreignField: "_id",
                        as: "voucher"
                    }
                },
                { $unwind: "$voucher" },
                { 
                    $sort: { createdAt: -1 }
                }
            ])
            return res.status(200).send({
                data: tx
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetTxs: async (req: any, res: any, next: any) => {
        try {
            const tx = await TxOnchain.aggregate([
                { 
                    $match: { 
                        action: 'buy_voucher'
                    }
                }
            ])
            return res.status(200).send({
                data: tx.length
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetAvailableVoucher: async (req: any, res: any, next: any) => {
        try {
            const vouchers = await Voucher.find({
                owner: null
            })
            return res.status(200).send({
                data: {
                    vouchers
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetVoucherBoughtFromRef: async (req: any, res: any, next: any) => {
        try {
            let userId = req.body?.userId
            let lookup: any = [
                { 
                    $match: { 
                        action: "buy_voucher",
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$user" },
            ]
            if (userId) {
                lookup.push({
                    "$match": {
                        "user.refUser": new mongoose.Types.ObjectId(userId) 
                    }
                })
            } else {
                lookup.push({
                    "$match": {
                        "user.refUser" : {
                            "$ne": null
                        }
                    }
                })
            }
            let rs = await TxOnchain.aggregate(lookup)
            return res.status(200).send({
                data: rs
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doCancelListing: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const voucherId = req.body.voucherId
            let voucher = await Voucher.findOne({
                _id: new mongoose.Types.ObjectId(voucherId)
            })

            if (voucher.owner.toString() != _id) {
                return res.status(400).send({
                    message: "Voucher not yours"
                });
            }

            await Voucher.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(voucherId)
            }, {
                forSale: false,
                price: "0"
            })
            const voucherHistory = await TxOnchain.aggregate([
                { 
                    $match: { 
                        userId: new mongoose.Types.ObjectId(_id),
                        action: 'buy_voucher'
                    }
                },
                {
                    $lookup: {
                        from: "vouchers",
                        localField: "voucherId",
                        foreignField: "_id",
                        as: "voucher"
                    }
                },
                { $unwind: "$voucher" },
                { 
                    $sort: { createdAt: -1 }
                }
            ])
           
            const rs = await Voucher.aggregate([
                {
                    $match: { 
                        forSale: true
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                { $unwind: "$owner" },
                {
                    $project: {
                      code: 0, // Exclude this field
                    }
                }
            ])
            return res.status(200).send({
                data: {
                    sellingLicense: rs,
                    voucherHistory
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doListForSale: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const voucherId = req.body.voucherId
            const price = req.body.price
            let voucher = await Voucher.findOne({
                _id: new mongoose.Types.ObjectId(voucherId)
            })

            if (voucher.owner.toString() != _id) {
                return res.status(400).send({
                    message: "Voucher not yours"
                });
            }

            await Voucher.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(voucherId)
            }, {
                forSale: true,
                price
            })

            const voucherHistory = await TxOnchain.aggregate([
                { 
                    $match: { 
                        userId: new mongoose.Types.ObjectId(_id),
                        action: 'buy_voucher'
                    }
                },
                {
                    $lookup: {
                        from: "vouchers",
                        localField: "voucherId",
                        foreignField: "_id",
                        as: "voucher"
                    }
                },
                { $unwind: "$voucher" },
                { 
                    $sort: { createdAt: -1 }
                }
            ])
           
            const rs = await Voucher.aggregate([
                {
                    $match: { 
                        forSale: true
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                { $unwind: "$owner" },
                {
                    $project: {
                      code: 0, // Exclude this field
                    }
                }
            ])
            return res.status(200).send({
                data: {
                    sellingLicense: rs,
                    voucherHistory
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetSellingLicense: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const rs = await Voucher.aggregate([
                {
                    $match: { 
                        forSale: true
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                { $unwind: "$owner" },
                {
                    $project: {
                      code: 0, // Exclude this field
                    }
                }
            ])
            return res.status(200).send({
                data: rs
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    }
}