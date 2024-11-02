import mongoose from "mongoose"

const User = require('../../models/users.model')
const SeasonBadgeTx = require('../../models/seasonBadgeTx.model')
const SeasonBadge = require('../../models/seasonBadge.model')

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

            let checkBoughtSeaconBadge = await helperFunction.checkBoughtSeaconBadge(_id)
            if (checkBoughtSeaconBadge[0] == true) {
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

            let badge = await SeasonBadge.findOne({
                _id: new mongoose.Types.ObjectId(badgeId)
            })

            await SeasonBadge.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(badgeId)
            }, {
                nextItemIndex: badge.nextItemIndex + 1
            })

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(badgeId) })
            await User.findOneAndUpdate({
                _id
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
            let checkBoughtSeaconBadge = await helperFunction.checkBoughtSeaconBadge(_id)
            if (checkBoughtSeaconBadge[0] == false) {
                return res.status(200).send({
                    data: {
                        itemAddress: null,
                        tokenId: null
                    }
                }) 
            }
            let seasonBadge = checkBoughtSeaconBadge[1]
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
            "seasonBegin" : {$lt: startOfToday},
            "seasonEnd" : {$gt: startOfToday},
        })
        return badge[0]
    },
    
    checkBoughtSeaconBadge: async(userId: string) => {
        let seasonBadgeTx = await SeasonBadgeTx.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 })
        let seasonBadge = await helperFunction.getCurrentBadge()
    
        let hasThisSeasonBadge = false
        if (seasonBadgeTx && seasonBadgeTx.createdAt < seasonBadge.seasonEnd && seasonBadgeTx.createdAt > seasonBadge.seasonBegin) {
            hasThisSeasonBadge = true
        }
        return [hasThisSeasonBadge, seasonBadge]
    }
}