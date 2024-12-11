import mongoose from "mongoose"

const Tracking = require('../../models/tracking.model')
const QuizzAnswer = require('../../models/quizzAnswer.model')
const Cvprofile = require('../../models/cvprofile.model')
const MeanMatchingAnswer = require('../../models/matchMeaning.model')
const WordAnswer = require('../../models/wordAnswer.model')

export const onManageTracking = {
    doGetDAU: async (req: any, res: any, next: any) => {
        try {
            const results = await Tracking.aggregate([
                // Unwind the userIds array to consider each userId individually
                { $unwind: "$userIds" },
                // Group by the date and user ID
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            userId: "$userIds",
                        },
                    }
                },
                // Group by the date to count unique user IDs per day
                {
                    $group: {
                        _id: "$_id.date",
                        activeUsers: { $sum: 1 }
                    }
                },
                // Sort by date in ascending order
                {
                    $sort: { _id: 1 }
                }
            ]);
            return res.status(200).send({
                data: results
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetMAU: async (req: any, res: any, next: any) => {
        try {
            const results = await Tracking.aggregate([
                { $unwind: "$userIds" },
                // Group by the month and user ID
                {
                    $group: {
                        _id: {
                            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, // Extract year and month
                            userId: "$userIds",
                        },
                    }
                },
                // Group by the month to count unique user IDs
                {
                    $group: {
                        _id: "$_id.month",
                        activeUsers: { $sum: 1 }
                    }
                },
                // Sort by month in ascending order
                {
                    $sort: { _id: 1 }
                }
            ]);

            return res.status(200).send({
                data: results
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetDailyAnswerQuizz: async (req: any, res: any, next: any) => {
        try {
            const results = await QuizzAnswer.aggregate([
                {
                    $match: {
                        isCampaign: false,
                    }
                },
                {
                    $project: {
                        date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                        },
                        userId: 1, // Include userId for unique user counting
                    },
                },
                {
                    $group: {
                        _id: "$date", // Group by normalized date
                        totalAnswers: { $sum: 1 }, // Count total answers
                        uniqueUsers: { $addToSet: "$userId" }, // Collect unique user IDs
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        totalAnswers: 1,
                        totalUniqueUsers: { $size: "$uniqueUsers" }, // Count unique users
                        answersPerUser: {
                            $cond: {
                                if: { $eq: [{ $size: "$uniqueUsers" }, 0] }, // Avoid division by zero
                                then: 0,
                                else: { $divide: ["$totalAnswers", { $size: "$uniqueUsers" }] },
                            },
                        },
                    },
                },
                {
                    $sort: { date: 1 }, // Sort by date in ascending order
                },
            ]);
            return res.status(200).send({
                data: results
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetDailyDropGame: async (req: any, res: any, next: any) => {
        try {
            let results = await WordAnswer.aggregate([
                {
                    $project: {
                        date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                        },
                        userId: 1, // Include userId for unique user counting
                    },
                },
                {
                    $group: {
                        _id: "$date", // Group by normalized date
                        totalAnswers: { $sum: 1 }, // Count total answers
                        uniqueUsers: { $addToSet: "$userId" }, // Collect unique user IDs
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        totalAnswers: 1,
                        totalUniqueUsers: { $size: "$uniqueUsers" }, // Count unique users
                        answersPerUser: {
                            $cond: {
                                if: { $eq: [{ $size: "$uniqueUsers" }, 0] }, // Avoid division by zero
                                then: 0,
                                else: { $divide: ["$totalAnswers", { $size: "$uniqueUsers" }] },
                            },
                        },
                    },
                },
                {
                    $sort: { date: 1 }, // Sort by date in ascending order
                },
            ])
            return res.status(200).send({
                data: results
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetDailyMatchMeaning: async (req: any, res: any, next: any) => {
        try {
            let results = await MeanMatchingAnswer.aggregate([
                {
                    $project: {
                        date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                        },
                        userId: 1, // Include userId for unique user counting
                    },
                },
                {
                    $group: {
                        _id: "$date", // Group by normalized date
                        totalAnswers: { $sum: 1 }, // Count total answers
                        uniqueUsers: { $addToSet: "$userId" }, // Collect unique user IDs
                    },
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        totalAnswers: 1,
                        totalUniqueUsers: { $size: "$uniqueUsers" }, // Count unique users
                        answersPerUser: {
                            $cond: {
                                if: { $eq: [{ $size: "$uniqueUsers" }, 0] }, // Avoid division by zero
                                then: 0,
                                else: { $divide: ["$totalAnswers", { $size: "$uniqueUsers" }] },
                            },
                        },
                    },
                },
                {
                    $sort: { date: 1 }, // Sort by date in ascending order
                },
            ])
            return res.status(200).send({
                data: results
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetAllCv: async (req: any, res: any, next: any) => {
        try {
            let rs = await Cvprofile.find();
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

export async function createTracking(userId: string) {
    var startDay = new Date();
    startDay.setHours(0, 0, 0, 0)

    var endDay = new Date();
    endDay.setHours(23, 59, 59, 999);

    let tracking = await Tracking.findOne({
        "createdAt": { $lt: endDay, $gt: startDay }
    })
    
    if (!tracking) {
        await Tracking.create({
            userIds: [new mongoose.Types.ObjectId(userId)]
        })
    } else {
        if (!tracking.userIds.includes(new mongoose.Types.ObjectId(userId))) {
            let userIdArray = tracking.userIds
            userIdArray.push(new mongoose.Types.ObjectId(userId))
            await Tracking.findOneAndUpdate({
                "createdAt": { $lt: endDay, $gt: startDay }
            }, {
                userIds: userIdArray
            })
        }
    }
}