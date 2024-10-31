import mongoose from "mongoose"

const SocialTask = require('../../models/socialTask.model')
const SocialTaskDone = require('../../models/socialTaskDone.model')
const User = require('../../models/users.model')

require('dotenv').config()

export const onManageSocialTask = {
    doCreateSocialTasks: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const tasks = req.body.tasks

            for (let index = 0; index < tasks.length; index++) {
                const task = tasks[index];

                await SocialTask.create({
                    link: task.link,
                    title: task.title,
                    content: task.content,
                    point: task.point,
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

    doChangeSocialTask: async (req: any, res: any, next: any) => {
        try {
            const taskId = req.body.taskId
            const link = req.body.link
            const title = req.body.title
            const content = req.body.content
            const point = req.body.point
            const hidden = req.body.hidden

            await SocialTask.findOneAndUpdate({
                _id: taskId
            }, {
                link,
                title,
                content,
                point,
                hidden
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

    doClaimSocialTask: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const taskId = req.body.taskId

            let task = await SocialTaskDone.findOne({
                taskId,
                userId: _id
            })
            let user = await User.findOne({ _id })
            if (task != null) {
                await User.findOneAndUpdate({
                    _id
                }, {
                    points: user.points + task.point * user.multiplier,
                })
                return res.status(200).send({
                    data: {
                        point: task.point * user.multiplier
                    }
                });
            } else {
                return res.status(400).send({
                    message: "Task already claimed"
                });
            }
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetAllTasks: async (req: any, res: any, next: any) => {
        try {
            const tasks = await SocialTask.aggregate()
            return res.status(200).send({
                data: tasks
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetAllActiveTasks: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const tasks = await SocialTask.aggregate([
                { "$match": { "hidden": false } },
                {
                    $lookup: {
                        from: "socialTaskDone",
                        localField: "_id",
                        foreignField: "taskId",
                        as: "doneByUsers"
                    }
                },
                {
                    $addFields: {
                        isDone: {
                            $cond: {
                                if: { $gt: [{ $size: { $filter: { input: "$doneByUsers", as: "task", cond: { $eq: ["$$task.userId", _id] } } } }, 0] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        taskName: 1, // Include other task fields you need
                        isDone: 1
                    }
                }
            ]);
            return res.status(200).send({
                data: tasks
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    }
}