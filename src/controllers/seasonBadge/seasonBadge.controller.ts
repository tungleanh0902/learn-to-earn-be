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
            const image = req.body.image
            const address = req.body.address
            
            await SeasonBadge.create({
                title,
                userId: _id,
                seasonBegin,
                seasonEnd,
                image,
                address
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

            if (await helperFunction.checkBoughtSeaconBadge(_id) == true) {
                return res.status(400).send({
                    message: "Already bought this season badge"
                });
            }

            await SeasonBadgeTx.create({
                badgeId,
                userId: _id,
                tokenId,
                tx
            })

            let user = await User.findOne({ _id })
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
            return res.status(200).send({
                data: await helperFunction.checkBoughtSeaconBadge(_id)
            })   
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
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
        return await SeasonBadge.find({
            "seasonBegin" : {$lt: startOfToday},
            "seasonEnd" : {$gt: startOfToday},
        }).sort({ createdAt: -1 })
    },
    
    checkBoughtSeaconBadge: async(userId: string) => {
        let seasonBadgeTx = await SeasonBadgeTx.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 })
        let seasonBadge = await helperFunction.getCurrentBadge()
    
        let hasThisSeasonBadge = false
        if (seasonBadgeTx && seasonBadgeTx.createdAt < seasonBadge.seasonEnd && seasonBadgeTx.createdAt > seasonBadge.seasonBegin) {
            hasThisSeasonBadge = true
        }
        return hasThisSeasonBadge
    }
}