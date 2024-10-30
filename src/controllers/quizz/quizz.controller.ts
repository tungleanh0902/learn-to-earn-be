import { checkBoughtSeaconBadge } from "controllers/seasonBadge/seasonBadge.controller"
import mongoose from "mongoose"

const Lesson = require('../../models/lessons.model')
const Question = require('../../models/questions.model')
const Option = require('../../models/options.model')
const QuizzAnswer = require('../../models/quizzAnswer.model')
const User = require('../../models/users.model')

require('dotenv').config()

export const onManageLesson = {
    doSaveLesson: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const lessons = req.body.lessons

            for (let lIdx = 0; lIdx < lessons.length; lIdx++) {
                let lesson = await Lesson.create({
                    title: lessons[lIdx].title,
                    content: lessons[lIdx].content,
                    createdBy: _id
                })
                for (let qIdx = 0; qIdx < lessons[lIdx].questions.length; qIdx++) {
                    await saveQuestions(lessons[lIdx].questions[qIdx], req.user.id, lesson._id)
                }   
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

    doChangeLesson: async (req: any, res: any, next: any) => {
        try {
            const lessonId = req.body.lessonId
            const content = req.body.content
            const points = req.body.points

            let lesson = await Lesson.findOneAndUpdate({
                lessonId
            }, {
                content,
                points
            })

            return res.status(200).send({
                data: lesson
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doChangeQuestion: async (req: any, res: any, next: any) => {
        try {
            const questionId = req.body.questionId
            const points = req.body.points
            const content = req.body.content

            let question = await Question.findOneAndUpdate({
                questionId
            }, {
                points,
                content
            })

            return res.status(200).send({
                data: question
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doChangeOption: async (req: any, res: any, next: any) => {
        try {
            const optionId = req.body.optionId
            const isCorrect = req.body.isCorrect
            const content = req.body.content

            let option = await Option.findOneAndUpdate({
                optionId
            }, {
                isCorrect,
                content
            })

            return res.status(200).send({
                data: option
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doAddQuestion: async (req: any, res: any, next: any) => {
        try {
            const lessonId = req.body.lessonId
            const isCorrect = req.body.isCorrect
            const content = req.body.content
            const options = req.body.options
            const points = req.body.points

            let question = await saveQuestions({
                content,
                isCorrect,
                points,
                options,
            }, req.user.id, lessonId)

            return res.status(200).send({
                data: question
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doRemoveLesson: async (req: any, res: any, next: any) => {
        try {
            const lessonId = req.body.lessonId

            await Lesson.findOneAndUpdate({
                lessonId
            }, {
                isHidden: true,
            })

            return res.status(200).send({
                data: {
                    _id: lessonId
                }
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doRemoveQuestion: async (req: any, res: any, next: any) => {
        try {
            const questionId = req.body.questionId

            await Question.findOneAndUpdate({
                questionId
            }, {
                isHidden: true,
            })

            return res.status(200).send({
                data: {
                    _id: questionId
                }
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doRemoveOption: async (req: any, res: any, next: any) => {
        try {
            const optionId = req.body.optionId

            await Lesson.findOneAndUpdate({
                optionId
            }, {
                isHidden: true,
            })

            return res.status(200).send({
                data: {
                    _id: optionId
                }
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetAllLessons: async (req: any, res: any, next: any) => {
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;

        const startIndex = (page - 1) * limit;
        const total = await Lesson.countDocuments();

        const lessons = await Lesson.find().skip(startIndex).limit(limit);

        return res.status(200).send({
            metadata: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            data: lessons
        });
    },

    doGetQuestionsinLesson: async (req: any, res: any, next: any) => {
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;
        let lessonId = req.query.lessonId;

        const startIndex = (page - 1) * limit;
        const total = await Lesson.countDocuments();

        const questions = await Question.aggregate([
            { '$match': { "lessonId": new mongoose.Types.ObjectId(lessonId) } },
            { '$sort': { 'createdAt': -1 } },
            {
                '$lookup': {
                    from: "option",
                    localField: "_id",
                    foreignField: "questionId",
                    as: "options"
                }
            },
            {
                '$facet': {
                    metadata: [
                        {
                            '$group': {
                                _id: null,
                                page,
                                limit,
                                total: { '$sum': 1 },
                                pages: Math.ceil(total / limit),
                            }
                        },
                        { '$project': { _id: 0, total: 1, page: 1 } }
                    ],
                    data: [{ $skip: startIndex }, { $limit: limit }]
                }
            }
        ])

        return res.status(200).send({
            data: questions
        });
    },

    doGetRandomLesson: async (req: any, res: any, next: any) => {
        const questions = await Lesson.aggregate([
            { $match: { isHidden: false } },
            { $sample: { size: 1 } },
            {
                '$lookup': {
                    from: "question",
                    let: { lessonId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$lessonId", "$$lessonId"]
                                }
                            }
                        },
                        {
                            $sample: { size: 25 }
                        }
                    ],
                    as: "questions"
                }
            },
            { $unwind: "$questions" },
            { $match: { "questions.isHidden": false } },
            {
                $lookup: {
                    from: "option",
                    localField: "questions._id",
                    foreignField: "questionId",
                    as: "questions.options"
                }
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    content: { $first: "$content" },
                    questions: { $push: "$questions" }
                }
            },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    content: 1,
                    questions: 1
                }
            }
        ])

        return res.status(200).send({
            data: questions
        });
    },

    doAnswerQuizz: async (req: any, res: any, next: any) => {
        try {
            const optionId = req.body.optionId
            const _id = req.user.id

            let option = await Option.findOne({
                _id: new mongoose.Types.ObjectId(optionId)
            })

            const startOfToday = new Date();

            // multiplier + 0.1 khi diem danh
            if (option.isCorrect == true) {
                let user = await User.findOne({ _id })

                let tickets = 0;
                if (await checkBoughtSeaconBadge(user._id) == true) {
                    tickets += 1
                } else {
                    // count document that this user answered today
                    startOfToday.setHours(0, 0, 0, 0);
                    let answers = await QuizzAnswer.countDocuments({
                        createdAt: {
                            $gte: startOfToday
                        }
                    })
                    if (answers <= 8) {
                        tickets += 1
                    }
                }

                await User.findOneAndUpdate({
                    _id
                }, {
                    points: user.points + 1 * user.multiplier,
                    tickets,
                })
            }

            let quizzAnswer = await QuizzAnswer.create({
                optionId,
                userId: _id,
            })

            return res.status(200).send({
                data: quizzAnswer
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    }
}

async function saveQuestions(questionInput: { content: any; isCorrect: any; options: any, points: number }, userId: any, lessonId: any) {
    let question = await Question.create({
        content: questionInput.content,
        points: questionInput.points,
        lessonId,
        createdBy: userId
    })

    for (let oIdx = 0; oIdx < questionInput.options.length; oIdx++) {
        const option = questionInput.options[oIdx];

        await Option.create({
            content: option.content,
            createdBy: userId,
            questionId: question._id,
            isCorrect: option.isCorrect
        })
    }
    return question
}