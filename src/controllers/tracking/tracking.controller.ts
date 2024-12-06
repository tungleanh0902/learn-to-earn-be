import mongoose from "mongoose"

const Tracking = require('../../models/tracking.model')

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

            res.json(results);
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },
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