import { helperFunction } from "../seasonBadge/seasonBadge.controller"
import mongoose from "mongoose"
import { tonQuery, OWNER_ADDRESS, SAVE_STREAK_FEE, MORE_QUIZZ_FEE, SHARE_REF, MINT_NFT_FEE, STORE_FEE, TON_CENTER_RPC } from "../../config"
import { Address, beginCell, Cell, toNano, TonClient } from "@ton/ton";
import { getTxData } from "../../helper/helper";
require('dotenv').config()

const User = require('../../models/users.model')
const TxOnchain = require('../../models/txOnchain.model')
const DailyAttendence = require('../../models/dailyAttendance.model')

require('dotenv').config()

export const onManageUser = {
    doDailyAttendance: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            if (await checkDailyAttendance(_id) == false) {
                await DailyAttendence.create({
                    userId: _id
                })

                let yesterdayCheckin = await checkYesterdayAttendance(_id)
                let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
                let bonusPoint = 0
                if (yesterdayCheckin == true || user.hasStreakSaver == true) {
                    bonusPoint = user.streak * 1000
                } else {
                    bonusPoint = 1000
                }

                let checkBoughtSeasonBadge = await helperFunction.checkBoughtSeasonBadge(_id)
                if (checkBoughtSeasonBadge[0]) {
                    bonusPoint = 2 * bonusPoint
                }

                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + bonusPoint * user.multiplier,
                    streak: yesterdayCheckin || user.hasStreakSaver ? user.streak + 1 : 1,
                    hasStreakSaver: false,
                })

                if (user.refUser != null) {
                    await updatePointForRefUser(user.refUser.toString(), bonusPoint * user.multiplier)
                }

                let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

                return res.status(200).send({
                    data: {
                        point: bonusPoint * user.multiplier,
                        user: newUser
                    }
                });
            } else {
                return res.status(400).send({
                    message: "Already daily checkin"
                });
            }
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doRef: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const ref = req.body.ref

            let refUser = await User.findOne({
                refCode: ref
            })

            let user = await User.findOne({
                _id: new mongoose.Types.ObjectId(_id)
            })

            if (ref == user.telegramUserId) {
                return res.status(400).send({
                    message: "Cannot self referal"
                });
            }

            if (user.refUser != null) {
                return res.status(400).send({
                    message: "Already have referal"
                });
            } else {
                let checkBoughtSeasonBadge = await helperFunction.checkBoughtSeasonBadge(_id)
                let points = checkBoughtSeasonBadge[0] ? 2000 : 1000
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + points * user.multiplier,
                    refUser: refUser._id
                })

                checkBoughtSeasonBadge = await helperFunction.checkBoughtSeasonBadge(refUser._id.toString())
                points = checkBoughtSeasonBadge[0] ? 2000 : 1000

                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(refUser._id.toString())
                }, {
                    points: refUser.points + points * refUser.multiplier,
                    refCount: refUser.refCount + 1,
                })
                let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

                return res.status(200).send({
                    data: {
                        points: points * user.multiplier,
                        user: newUser
                    }
                });
            }

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doConnectWallet: async (req: any, res: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ address: req.body.address })
            if (user != null) {
                return res.status(400).send({
                    message: "This wallet is already connected"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                address: req.body.address,
            })
            return res.status(200).send({
                message: "Success"
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doCheckYesterdayCheckin: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            return res.status(200).send({
                data: await checkYesterdayAttendance(_id)
            })
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doCheckDailyAttendance: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            if (await checkDailyAttendance(_id) == false) {
                return res.status(200).send({
                    data: false
                });
            } else {
                return res.status(200).send({
                    data: true
                });
            }
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doSaveStreak: async (req: any, res: any, next: any) => {
        try {
            const boc = req.body.boc
            const _id = req.user.id
            
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

            if (SAVE_STREAK_FEE != txData.data["out_msgs"][0].value.toString()
                || user.address != txData.data["out_msgs"][0].source.address
                || ownerAddress != txData.data["out_msgs"][0].destination.address
                || txData.data["success"] != true
                || diffMins > 10
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                hasStreakSaver: true,
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "transfer",
                amount: SAVE_STREAK_FEE
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser
                }
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doBuyMoreQuizz: async (req: any, res: any, next: any) => {
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

            if (MORE_QUIZZ_FEE != txData.data["out_msgs"][0].value.toString()
                || user.address != txData.data["out_msgs"][0].source.address
                || ownerAddress != txData.data["out_msgs"][0].destination.address
                || txData.data["success"] != true
                || diffMins > 10
            ) {
                return res.status(400).send({
                    message: "Invalid tx"
                });
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                moreQuizz: user.moreQuizz + 8,
            })

            await TxOnchain.create({
                userId: _id,
                tx,
                action: "transfer",
                amount: MORE_QUIZZ_FEE
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            return res.status(200).send({
                data: {
                    user: newUser
                }
            });

        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetLeaderboard: async (req: any, res: any, next: any) => {
        try {
            let limit = parseInt(req.query.limit) || 100000;

            const users = await User.aggregate([
                { $sort: { points: -1 } },
                {
                    $group: {
                        _id: null,
                        users: { $push: "$$ROOT" }
                    }
                },
                { $unwind: { path: "$users", includeArrayIndex: "rank" } },
                {
                    $addFields: {
                        "users.rank": { $add: ["$rank", 1] }
                    }
                },
                { $replaceRoot: { newRoot: "$users" } },
                { $skip: 0 },
                { $limit: limit }
            ]);

            let userRank = 0
            if (req.query.userId != null) {
                let userId = req.query.userId
                const allUsers = await User.find().sort({ points: -1 });
                userRank = allUsers.findIndex((u: any) => u._id.equals(new mongoose.Types.ObjectId(userId))) + 1;
            }

            return res.status(200).send({
                data: {
                    leaderboard: users,
                    currentRank: userRank
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetMintBodyData: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const refUserId = req.body.refUserId // ref user
            const tokenId = req.body.tokenId

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) }) 
            let userAddress = Address.parse(OWNER_ADDRESS)
            if (refUserId != null) {
                let refUserFrom = await User.findOne({ _id: new mongoose.Types.ObjectId(refUserId) })
                console.log(refUserFrom.address);
                if (refUserFrom.address == null || refUserFrom.address == "") {
                    userAddress = Address.parse(OWNER_ADDRESS)
                } else {
                    userAddress = Address.parse(refUserFrom.address)
                }
            }
            const nftItemContent = beginCell();
            if (user.address == null) {
                return res.status(400).send({
                    message: "Please link your account with your wallet"
                });
            }
            nftItemContent.storeAddress(Address.parse(user.address));

            const uriContent = beginCell();
            uriContent.storeBuffer(Buffer.from("https://shorturl.at/LBsGq"));
            nftItemContent.storeRef(uriContent.endCell());
            let coins = MINT_NFT_FEE + STORE_FEE
            let body = beginCell()
                .storeUint(1, 32)
                .storeUint(Date.now(), 64)
                .storeUint(tokenId, 64)
                .storeCoins(coins)
                .storeRef(nftItemContent)
                .storeAddress(userAddress)
                .endCell()
            return res.status(200).send({
                data: {
                    body_data: body.toBoc().toString("base64")
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGrantAdmin: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const address = req.body.address

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
                return res.status(400).send({
                    message: "invalid call"
                });

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                role: "admin",
            })

            await User.findOneAndUpdate({
                address: address
            }, {
                role: "admin",
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
    }
}

async function checkDailyAttendance(userId: string) {
    let da = await DailyAttendence.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (da && da.createdAt > today) {
        return true;
    } else {
        return false;
    }
}

async function checkYesterdayAttendance(userId: string) {
    var startDay = new Date();
    startDay.setHours(0, 0, 0, 0)
    startDay.setDate(startDay.getDate() - 1)

    var endDay = new Date();
    endDay.setHours(23, 59, 59, 999);
    endDay.setDate(endDay.getDate() - 1)

    let badge = await DailyAttendence.find({
        "userId": new mongoose.Types.ObjectId(userId),
        "createdAt": { $lt: endDay, $gt: startDay }
    })

    if (badge[0] != null) {
        return true;
    } else {
        return false;
    }
} 

export async function updatePointForRefUser(_id: string, newPonts: number) {
    let refUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
    await User.findOneAndUpdate({
        _id: new mongoose.Types.ObjectId(_id)
    }, {
        points: refUser.points + (newPonts * SHARE_REF)/100,
    })
}

export async function getNftAddress(collectionAddress: Address, itemIndex: number) {
    const client = new TonClient({ 
        endpoint: TON_CENTER_RPC,
        apiKey: process.env.API_KEY
    });
    let response = await client.runMethod(
        collectionAddress,
        "get_nft_address_by_index",
        [{ type: "int", value: BigInt(itemIndex) }]
    );
    return response.stack.readAddress();
}
