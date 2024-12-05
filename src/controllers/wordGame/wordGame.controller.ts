import mongoose from "mongoose"
import { shuffle } from "./../../helper/helper"
import { updatePointForRefUser } from "../../controllers/users/user.controller"
var rwc = require("random-weighted-choice");

const Words = require('../../models/words.model')
const WordAnswer = require('../../models/wordAnswer.model')
const MeanMatchingAnswer = require('../../models/matchMeaningSchema')
const Topics = require('../../models/topics.model')
const User = require('../../models/users.model')

require('dotenv').config()

export const onManageWordGame = {
    doCreateTopics: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const topics = req.body.topics

            for (let index = 0; index < topics.length; index++) {
                const topic = topics[index];
                await Topics.create({
                    content: topic.content,
                    meaning: topic.meaning,
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

    doChangeTopic: async (req: any, res: any, next: any) => {
        try {
            const topicId = req.body.topicId
            const content = req.body.content
            const meaning = req.body.meaning
            const isHidden = req.body.isHidden

            await Topics.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(topicId)
            }, {
                content,
                meaning,
                isHidden
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

    doCreateWords: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const words = req.body.words

            for (let index = 0; index < words.length; index++) {
                const word = words[index];
                let convertTopicId = []
                for (let index = 0; index < word.topicIds.length; index++) {
                    convertTopicId.push(new mongoose.Types.ObjectId(word.topicIds[index]))
                }
                let foundTopic = await Topics.find({_id: {$in: convertTopicId}})
                if (foundTopic.length != word.topicIds.length) {
                    return res.status(400).send({
                        message: "Invalid topic"
                    });
                }
                
                await Words.create({
                    content: word.content,
                    meaning: word.meaning,
                    createdBy: _id,
                    topicIds: convertTopicId
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

    doChangeWord: async (req: any, res: any, next: any) => {
        try {
            const wordId = req.body.wordId
            const content = req.body.content
            const meaning = req.body.meaning
            const topicIds = req.body.topicIds
            const isHidden = req.body.isHidden

            let convertTopicId = []
            for (let index = 0; index < topicIds.length; index++) {
                convertTopicId.push(new mongoose.Types.ObjectId(topicIds[index]))
            }
            
            let foundTopic = await Topics.find({_id: {$in: convertTopicId}})
            if (foundTopic.length != topicIds.length) {
                return res.status(400).send({
                    message: "Invalid topic"
                });
            }

            await Words.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(wordId)
            }, {
                content,
                meaning,
                topicIds,
                isHidden
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

    getChallenge: async (req: any, res: any, next: any) => {
        try {
            let total = parseInt(req.query.total) || 30;
            let correct = parseInt(req.query.correct) || 20;

            const _id = req.user.id
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            if (user.tickets == 0) {
                return res.status(400).send({
                    message: "Out of tickets"
                });
            }

            const topic = await Topics.aggregate([
                { $match: { isHidden: false } },
                { $sample: { size: 1 } },
            ])

            const answer = await WordAnswer.create({
                userId: _id,
                topicId: topic[0]._id
            })
            
            const correctWords = await Words.aggregate([
                { $match: { isHidden: false } },
                { "$match": {"$expr": {"$in": [new mongoose.Types.ObjectId(topic[0]._id), "$topicIds"]}} },
                { $sample: { size: correct } }
            ])

            const wrongWords = await Words.aggregate([
                { $match: { isHidden: false } },
                { "$match": {"$expr": {"$not": {"$in": [new mongoose.Types.ObjectId(topic[0]._id), "$topicIds"]}}} },
                { $sample: { size: total-correct } },
            ])
            const result = shuffle(correctWords.concat(wrongWords))
            return res.status(200).send({
                data: {
                    challenge: result,
                    answerId: answer._id,
                    topic: topic[0]
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doAnswer: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ _id })
            if (user.tickets == 0) {
                return res.status(400).send({
                    message: "Out of tickets"
                });
            }

            const choosenWordIds = req.body.choosenWordIds
            const topicId = req.body.topicId

            let points = 0;
            let convertObjectId = []
            for (let index = 0; index < choosenWordIds.length; index++) {
                const wordId = choosenWordIds[index];
                let convertedWordId = new mongoose.Types.ObjectId(wordId)
                convertObjectId.push(convertedWordId)
                let word = await Words.findOne({ _id: convertedWordId })
                if (word.topicIds.includes(new mongoose.Types.ObjectId(topicId))) {
                    points+=100;
                } else {
                    points-=100;
                }
            }
            if (points < 0) {
                points = 0
            }

            // // random possibility of drop ton
            // var table = [
            //     { weight: 1, id: 1 },
            //     { weight: 9, id: 0 },
            // ];
            let userTon = user?.bonusTon ?? 0
            let bonusTon = 0
            // if (user.refCount >= 10 && rwc(table) == 1) {
            //     bonusTon = 0.001
            // }
            if (user.refCount >= 3 && points >= 1000) {
                bonusTon = 0.01
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                points: user.points + points * user.multiplier,
                tickets: user.tickets - 1,
                bonusTon: userTon + bonusTon
            })

            if (user.refUser != null) {
                await updatePointForRefUser(user.refUser.toString(), points * user.multiplier)
            }

            await WordAnswer.create({
                wordIdsAnswer: convertObjectId,
                points,
                topicId,
                userId: _id
            })

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            return res.status(200).send({
                data: {
                    points: points * user.multiplier,
                    user: newUser,
                    bonusTon
                },
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    getGameMatchMeaning: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            if (user.tickets == 0) {
                return res.status(400).send({
                    message: "Out of tickets"
                });
            }

            const words = await Words.aggregate([
                { $match: { isHidden: false } },
                { $sample: { size: 20 } }
            ])

            return res.status(200).send({
                data: {
                    challenge: words,
                }
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doAnswerMatchMeaning: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ _id })
            if (user.tickets == 0) {
                return res.status(400).send({
                    message: "Out of tickets"
                });
            }

            const answers = req.body.answers

            let points = 0
            for (let index = 0; index < answers.length; index++) {
                const answer = answers[index];
                let word = await Words.findOne({ content: answer.content })
                if (word.meaning == answer.meaning) {
                    points+=100;
                }
            }

            // random possibility of drop ton
            // var table = [
            //     { weight: 1, id: 1 },
            //     { weight: 9, id: 0 },
            // ];
            let userTon = user?.bonusTon ?? 0
            let bonusTon = 0
            // if (user.refCount >= 10 && rwc(table) == 1) {
            //     bonusTon = 0.001
            // }
            if (user.refCount >= 3 && points >= 1000) {
                bonusTon = 0.01
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                points: user.points + points * user.multiplier,
                tickets: user.tickets - 1,
                bonusTon: userTon + bonusTon
            })

            await MeanMatchingAnswer.create({
                answer: answers,
                points,
                userId: _id
            })

            if (user.refUser != null) {
                await updatePointForRefUser(user.refUser.toString(), points * user.multiplier)
            }

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            return res.status(200).send({
                data: {
                    points: points * user.multiplier,
                    user: newUser,
                    bonusTon
                },
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    },
}