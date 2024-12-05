import mongoose from "mongoose"
import { helperFunction } from "./../seasonBadge/seasonBadge.controller"
import { updatePointForRefUser } from "../users/user.controller"

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
                    createdBy: _id,
                    isCampaign: lessons[lIdx].isCampaign
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
            const title = req.body.title
            const isCampaign = req.body.isCampaign

            await Lesson.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(lessonId)
            }, {
                title,
                content,
                isCampaign
            })

            return res.status(200).send({
                data: "success"
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
                _id: new mongoose.Types.ObjectId(questionId)
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
                _id: new mongoose.Types.ObjectId(optionId)
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
            const questions = req.body.questions

            for (let index = 0; index < questions.length; index++) {
                const question = questions[index];
                await saveQuestions({
                    content: question.content,
                    isCorrect: question.content,
                    points: question.points,
                    options: question.options,
                }, req.user.id, lessonId)
            }

            return res.status(200).send({
                data: "success"
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
                _id: new mongoose.Types.ObjectId(lessonId)
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
                _id: new mongoose.Types.ObjectId(questionId)
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

    doGetAllLessons: async (req: any, res: any, next: any) => {
        try {
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
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetQuestionsinLesson: async (req: any, res: any, next: any) => {
        try {
            let limit = parseInt(req.query.limit) || 10;
            let page = parseInt(req.query.page) || 1;
            let lessonId = req.query.lessonId;

            const startIndex = (page - 1) * limit;
            const total = await Lesson.countDocuments();

            const questions = await Question.aggregate([
                { '$match': { "lessonId": new mongoose.Types.ObjectId(lessonId), "isHidden": false } },
                { '$sort': { 'createdAt': -1 } },
                {
                    '$lookup': {
                        from: "options",
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
                                    // page: page,
                                    // limit: limit,
                                    total: { '$sum': 1 },
                                    // pages: Math.ceil(total / limit),
                                }
                            },
                            { '$project': { _id: 0, total: 1, page: 1 } }
                        ],
                        data: [{ $skip: startIndex }, { $limit: limit }]
                    }
                },
                { '$unwind': "$metadata" }
            ])
            questions[0].metadata.page = page
            questions[0].metadata.limit = limit
            questions[0].metadata.pages = Math.ceil(total / limit)

            return res.status(200).send({
                data: questions[0]
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doGetRandomLesson: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let answers = await checkAnswersDaily(_id)
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            if (user.moreQuizz == 0 && answers >= 25) {
                return res.status(200).send({
                    data: {
                        lessons: [],
                        answers: 25
                    }
                });
            }

            let answer = 0
            if (user.moreQuizz > 0) {
                answer = user.moreQuizz
            } else if (answers < 25) {
                answer = 25 - answers
            }

            const lessons = await Lesson.aggregate([
                { $match: { isHidden: false, isCampaign: false } },
                { $sample: { size: 1 } },
                {
                    '$lookup': {
                        from: "questions",
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
                                $sample: { size: answer }
                            }
                        ],
                        as: "questions"
                    }
                },
                { $unwind: "$questions" },
                { $match: { "questions.isHidden": false } },
                {
                    $lookup: {
                        from: "options",
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
                data: {
                    lessons,
                    answers
                }
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doAnswerQuizz: async (req: any, res: any, next: any) => {
        try {
            const optionId = req.body.optionId
            const _id = req.user.id

            let answers = await checkAnswersDaily(_id)
            if (answers >= 25) {
                return res.status(400).send({
                    message: "Out of limit today"
                });
            }

            let option = await Option.findOne({
                _id: new mongoose.Types.ObjectId(optionId)
            })

            let question = await Question.findOne({
                _id: new mongoose.Types.ObjectId(option.questionId)
            })

            let newPonts = 0
            let checkBoughtSeaconBadge = await helperFunction.checkBoughtSeasonBadge(_id)
            let tickets = 0;
                
            if (checkBoughtSeaconBadge[0] == true) {
                if (answers < 25) {
                    tickets += 1
                }
            } else {
                if (answers < 5) {
                    tickets += 1
                }
            }
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            // multiplier + 0.1 khi diem danh
            if (option.isCorrect == true) {
                newPonts = question.points * user.multiplier
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + newPonts,
                    tickets: user.tickets + tickets,
                })

                if (user.refUser != null) {
                    await updatePointForRefUser(user.refUser.toString(), newPonts)
                }
            } else {
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    tickets: user.tickets + tickets,
                })
            }

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            await QuizzAnswer.create({
                optionId,
                userId: _id,
            })
            answers = await checkAnswersDaily(_id)

            return res.status(200).send({
                data: {
                    points: newPonts,
                    user: newUser,
                    answers
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doAnswerAdditionQuizz: async (req: any, res: any, next: any) => {
        try {
            const optionId = req.body.optionId
            const _id = req.user.id

            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            if (user.moreQuizz == 0) {
                return res.status(400).send({
                    message: "Out of additional quizz"
                });
            }

            let option = await Option.findOne({
                _id: new mongoose.Types.ObjectId(optionId)
            })

            let question = await Question.findOne({
                _id: new mongoose.Types.ObjectId(option.questionId)
            })

            let newPonts = 0
            if (option.isCorrect == true) {
                newPonts = question.points * user.multiplier * 5
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + newPonts,
                    tickets: user.tickets + 1,
                    moreQuizz: user.moreQuizz - 1
                })

                if (user.refUser != null) {
                    await updatePointForRefUser(user.refUser.toString(), newPonts)
                }
            } else {
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    tickets: user.tickets + 1,
                    moreQuizz: user.moreQuizz - 1
                })
            }

            await QuizzAnswer.create({
                optionId,
                userId: _id,
                isAddition: true
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            return res.status(200).send({
                data: {
                    points: newPonts,
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

    doGetRandomLessonForCampaign: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let checkBoughtSeaconBadge = await helperFunction.checkBoughtSeasonBadge(_id)
            if (checkBoughtSeaconBadge[0] == false) {
                return res.status(400).send({
                    message: "Only for badge holder"
                }); 
            }
            let answers = await checkAnswersCampaignWeekly(_id)
            if (answers == 10) {
                return res.status(400).send({
                    message: "Out of limit this week"
                });
            }

            const lessons = await Lesson.aggregate([
                { $match: { isHidden: false, isCampaign: true } },
                { $sample: { size: 1 } },
                {
                    '$lookup': {
                        from: "questions",
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
                                $sample: { size: 10 - answers }
                            }
                        ],
                        as: "questions"
                    }
                },
                { $unwind: "$questions" },
                { $match: { "questions.isHidden": false } },
                {
                    $lookup: {
                        from: "options",
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
                data: lessons
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doAnswerQuizzCampaign: async (req: any, res: any, next: any) => {
        try {
            const optionId = req.body.optionId
            const _id = req.user.id
            
            let checkBoughtSeaconBadge = await helperFunction.checkBoughtSeasonBadge(_id)
            if (checkBoughtSeaconBadge[0] == false) {
                return res.status(400).send({
                    message: "Only for badge holder"
                }); 
            }
            let answers = await checkAnswersCampaignWeekly(_id)
            if (answers == 10) {
                return res.status(400).send({
                    message: "Out of limit this week"
                });
            }

            let option = await Option.findOne({
                _id: new mongoose.Types.ObjectId(optionId)
            })
            let question = await Question.findOne({
                _id: new mongoose.Types.ObjectId(option.questionId)
            })

            let lesson = await Lesson.findOne({
                _id: new mongoose.Types.ObjectId(question.lessonId.toString())
            })

            if (lesson?.isCampaign == false) {
                return res.status(400).send({
                    message: "Invalid quizz"
                });
            } 

            let newPonts = 0
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            // multiplier + 0.1 khi diem danh
            if (option.isCorrect == true) {

                newPonts = question.points * user.multiplier
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    points: user.points + newPonts,
                    tickets: user.tickets + 1,
                })

                if (user.refUser != null) {
                    await updatePointForRefUser(user.refUser.toString(), newPonts)
                }
            } else {
                await User.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(_id)
                }, {
                    tickets: user.tickets + 1,
                })
            }

            await QuizzAnswer.create({
                optionId,
                userId: _id,
                isCampaign: true
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            return res.status(200).send({
                data: {
                    points: newPonts,
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

    doSummaryQuizzDaily: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let correctAnswer = await countAnswerDaily(_id, true)
            let falseAnswer = await countAnswerDaily(_id, null)
            return res.status(200).send({
                data: {
                    correctAnswers: correctAnswer.length,
                    falseAnswers: falseAnswer.length
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

async function checkAnswersDaily(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let answers = await QuizzAnswer.countDocuments({
        isCampaign: false,
        isAddition: false,
        createdAt: {
            $gte: startOfToday
        },
        userId: new mongoose.Types.ObjectId(userId)
    })
    return answers
}

async function checkAnswersCampaignWeekly(userId: string) {
    let d = new Date();
    let day = d.getDay()
    let diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff)
    let startOfWeek = new Date(d.setHours(0, 0, 0, 0));
    let answers = await QuizzAnswer.countDocuments({
        isCampaign: true,
        isAddition: false,
        createdAt: {
            $gte: startOfWeek
        },
        userId: new mongoose.Types.ObjectId(userId)
    })
    return answers
}

async function countAnswerDaily(userId: string, isCorrect: any) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let answers = await QuizzAnswer.aggregate([
        {
            '$lookup': {
                from: "options",
                localField: "optionId",
                foreignField: "_id",
                as: "option"
            }
        },
        { $unwind: "$option"},
        { 
            '$match': { 
                "isCampaign": false,
                "createdAt": {
                    $gte: startOfToday
                },
                "userId": new mongoose.Types.ObjectId(userId),
                "option.isCorrect": isCorrect
            } 
        },
    ])
    return answers
}

async function checkMoreQuizz(userId: string) {
    let answers = await QuizzAnswer.countDocuments({
        isAddition: true,
        userId: new mongoose.Types.ObjectId(userId)
    })
    return answers
}