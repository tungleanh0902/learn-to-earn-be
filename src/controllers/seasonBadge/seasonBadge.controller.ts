import { tonQuery, MINT_NFT_OPCODE, MINT_NFT_FEE } from "../../config"
import mongoose from "mongoose"
import { Address } from "@ton/ton";

const User = require('../../models/users.model')
const SeasonBadgeTx = require('../../models/seasonBadgeTx.model')
const SeasonBadge = require('../../models/seasonBadge.model')
const TxOnchain = require('../../models/txOnchain.model')

require('dotenv').config()

export const onManageSeasonBadge = {
    doPublishNewSeasonBadge: async (req: any, res: any, next: any) => {
        try {
            const title = req.body.title
            const _id = req.user.id
            const seasonBegin = req.body.seasonBegin
            const seasonEnd = req.body.seasonEnd
            const metadata = req.body.metadata
            const contentUrl = req.body.contentUrl
            const mintPrice = req.body.mintPrice
            const nextItemIndex = req.body.nextItemIndex
            const address = req.body.address
            const explorerUrl = req.body.explorerUrl

            await SeasonBadge.create({
                title,
                userId: _id,
                seasonBegin,
                seasonEnd,
                metadata,
                contentUrl,
                mintPrice,
                nextItemIndex,
                address,
                explorerUrl
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

    doBuyNft: async (req: any, res: any, next: any) => {
        try {
            const badgeId = req.body.badgeId
            const _id = req.user.id
            const tokenId = req.body.tokenId
            const tx = req.body.tx
            const itemAddress = req.body.itemAddress
            const explorerUrl = req.body.explorerUrl

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            let badge = await SeasonBadge.findOne({
                _id: new mongoose.Types.ObjectId(badgeId)
            })
            let txData = await tonQuery.get(tx)
            let time = txData.data["utime"] * 1000
            let txTime = new Date(time)
            let now = new Date()
            let diffMins = Math.round((now.getTime() - txTime.getTime()) / (60 * 60 * 1000));

            if (MINT_NFT_OPCODE != txData.data["out_msgs"][0].op_code
                || user.address != txData.data["out_msgs"][0].source.address
                || Address.parse(badge.address).toRawString() != txData.data["out_msgs"][0].destination.address
                || txData.data["success"] != true
                || diffMins > 10
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            let checkBoughtSeasonBadge = await helperFunction.checkBoughtSeasonBadge(_id)
            if (checkBoughtSeasonBadge[0] == true) {
                return res.status(400).send({
                    message: "Already bought this season badge"
                });
            }

            await SeasonBadgeTx.create({
                badgeId,
                userId: _id,
                tokenId,
                tx,
                itemAddress,
                explorerUrl
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "mint_nft",
                amount: MINT_NFT_FEE
            })

            await SeasonBadge.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(badgeId)
            }, {
                nextItemIndex: badge.nextItemIndex + 1
            })

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                multiplier: user.multiplier + 1
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

    doCheckBoughtSeasonBadge: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let checkBoughtSeasonBadge = await helperFunction.checkBoughtSeasonBadge(_id)
            if (checkBoughtSeasonBadge[0] == false) {
                return res.status(200).send({
                    data: {
                        itemAddress: null,
                        tokenId: null
                    }
                })
            }
            let seasonBadge = checkBoughtSeasonBadge[1]
            let userBadge = SeasonBadgeTx.findOne({
                badgeId: seasonBadge._id,
                userId: new mongoose.Types.ObjectId(_id)
            })
            return res.status(200).send({
                data: {
                    itemAddress: userBadge.itemAddress,
                    tokenId: userBadge.tokenId
                }
            })
        } catch (err: any) {
            console.log(err.message)
            return res.status(200).send({
                data: {
                    itemAddress: null,
                    tokenId: null
                }
            });
        }
    },

    doGetCurrentBadge: async (req: any, res: any, next: any) => {
        try {
            return res.status(200).send({
                data: await helperFunction.getCurrentBadge()
            })
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },
}

export const helperFunction = {
    getCurrentBadge: async () => {
        const startOfToday = new Date();
        let badge = await SeasonBadge.find({
            "seasonBegin": { $lt: startOfToday },
            "seasonEnd": { $gt: startOfToday },
        })
        return badge[0]
    },

    checkBoughtSeasonBadge: async (userId: string) => {
        let seasonBadgeTx = await SeasonBadgeTx.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 })
        let seasonBadge = await helperFunction.getCurrentBadge()

        let hasThisSeasonBadge = false
        if (seasonBadgeTx && seasonBadgeTx.createdAt < seasonBadge.seasonEnd && seasonBadgeTx.createdAt > seasonBadge.seasonBegin) {
            hasThisSeasonBadge = true
        }
        return [hasThisSeasonBadge, seasonBadge]
    }
}