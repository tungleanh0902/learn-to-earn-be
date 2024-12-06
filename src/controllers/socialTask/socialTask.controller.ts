import { createTracking } from "../../controllers/tracking/tracking.controller"
import { updatePointForRefUser } from "../../controllers/users/user.controller"
import mongoose from "mongoose"

const SocialTask = require('../../models/socialTask.model')
const SocialTaskDone = require('../../models/socialTaskDone.model')
const CVProfile = require('../../models/cvprofile')
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
                    platform: task.platform,
                    points: task.point,
                    createdBy: _id,
                    tag: task.tag
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

    doCreateCVProfile: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const taskId = req.body.taskId
            const name = req.body.name
            const email = req.body.email
            const link = req.body.link

            if (link.includes("https://www.facebook.com/") == false && link.includes("https://www.linkedin.com/in") == false) {
                return res.status(400).send({
                    message: "Invalid link"
                });
            }

            let emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            if (!emailPattern.test(email)) {
                return res.status(400).send({
                    message: "Invalid email"
                });
            }

            let profile = await CVProfile.findOne({
                userId: new mongoose.Types.ObjectId(_id),
            })

            if (profile != null) {
                return res.status(400).send({
                    message: "Already submit profile"
                });
            }

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            let task = await SocialTask.findOne({
                _id: new mongoose.Types.ObjectId(taskId)
            })

            await CVProfile.create({
                userId: _id,
                name,
                link,
                email
            })

            await SocialTaskDone.create({
                taskId: new mongoose.Types.ObjectId(taskId),
                userId: new mongoose.Types.ObjectId(_id)
            })

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                tickets: user.tickets + 20,
                points: user.points + task.points * user.multiplier
            })

            if (user.refUser != null) {
                await updatePointForRefUser(user.refUser.toString(), task.points * user.multiplier)
            }

            user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            return res.status(200).send({
                data: {
                    user,
                    points: task.points * user.multiplier,
                    bonusTickets: 20
                }
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
            const platform = req.body.platform
            const point = req.body.point
            const hidden = req.body.hidden
            const tag = req.body.tag

            await SocialTask.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(taskId)
            }, {
                link,
                title,
                platform,
                point,
                hidden,
                tag
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

                if (user.refUser != null) {
                    await updatePointForRefUser(user.refUser.toString(), task.points * user.multiplier)
                }
                
                await SocialTaskDone.create({
                    taskId: new mongoose.Types.ObjectId(taskId),
                    userId: new mongoose.Types.ObjectId(_id)
                })

                let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
                await createTracking(_id)

                return res.status(200).send({
                    data: {
                        points: task.points * user.multiplier,
                        user: newUser
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
                        platform: 1,
                        point: 1,
                        isDone: 1,
                        tag: 1
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