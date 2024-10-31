import mongoose from "mongoose"

const User = require('../../models/users.model')
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

                return res.status(200).send({
                    data: "success"
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

    doCheckDailyAttendance: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            if (await checkDailyAttendance(_id) == false) {
                return res.status(200).send({
                    data: "false"
                });
            } else {
                return res.status(200).send({
                    data: "true"
                });
            }
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetUserInfo: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ _id })

            return res.status(200).send({
                data: user
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
    }
}

async function checkDailyAttendance(userId: string) {
    let da = await DailyAttendence.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });

    var today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (da && da.createdAt > today) {
        return true;
    } else {
        return false;
    }
}