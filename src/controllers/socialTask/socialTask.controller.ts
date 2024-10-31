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
                    points: task.point,
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
                _id: new mongoose.Types.ObjectId(taskId)
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

            let taskDone = await SocialTaskDone.findOne({
                taskId: new mongoose.Types.ObjectId(taskId),
                userId: new mongoose.Types.ObjectId(_id)
            })

            let task = await SocialTask.findOne({
                _id: new mongoose.Types.ObjectId(taskId)
            })
            
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            
            if (taskDone == null) {
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + task.points * user.multiplier,
                })
                
                await SocialTaskDone.create({
                    taskId: new mongoose.Types.ObjectId(taskId),
                    userId: new mongoose.Types.ObjectId(_id)
                })

                return res.status(200).send({
                    data: task.points * user.multiplier
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
            const tasks = await SocialTask.find()
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
                        from: "socialtaskdones",
                        localField: "_id",
                        foreignField: "taskId",
                        as: "doneByUsers"
                    }
                },
                {
                    $addFields: {
                        isDone: {
                            $cond: {
                                if: { $gt: [{ $size: { $filter: { input: "$doneByUsers", as: "task", cond: { $eq: ["$$task.userId", new mongoose.Types.ObjectId(_id)] } } } }, 0] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        link: 1,
                        title: 1,
                        content: 1,
                        point: 1,
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