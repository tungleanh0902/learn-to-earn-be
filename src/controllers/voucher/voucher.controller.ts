import mongoose from "mongoose"
import { Address, Cell } from "@ton/ton";
import { getTxData } from "../../helper/helper";
import { getNftAddress } from "../users/user.controller";
import { tonQuery, OWNER_ADDRESS, BUY_VOUCHER, SHARE_REF, MINT_NFT_FEE, STORE_FEE, TON_CENTER_RPC } from "../../config"

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

    doBuyVoucher: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const boc = req.body.boc
            
            let tx = Cell.fromBase64(boc).hash().toString("base64")
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

            let time = txData.data["utime"] * 1000
            let txTime = new Date(time)
            let now = new Date()
            let diffMins = Math.round((now.getTime() - txTime.getTime()) / (60 * 60 * 1000));
            let ownerAddress = Address.parse(OWNER_ADDRESS).toRawString()

            if (BUY_VOUCHER != txData.data["out_msgs"][0].value.toString()
                || user.address != txData.data["out_msgs"][0].source.address
                || ownerAddress != txData.data["out_msgs"][0].destination.address
                || txData.data["success"] != true
                || diffMins > 10
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
    }
}