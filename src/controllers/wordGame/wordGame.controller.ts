import mongoose from "mongoose"
import { shuffle } from "./../../helper/helper"
import { updatePointForRefUser } from "../../controllers/users/user.controller"

const Words = require('../../models/words.model')
const WordAnswer = require('../../models/wordAnswer.model')
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
                    content: topic,
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
            const isHidden = req.body.isHidden

            await Topics.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(topicId)
            }, {
                content,
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
            let total = parseInt(req.query.total) || 40;
            let correct = parseInt(req.query.correct) || 10;

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
                    topicId: topic[0]._id
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
            const anwserId = req.body.anwserId
            const topicId = req.body.topicId

            let wordAnswer = await WordAnswer.findOne({ _id: new mongoose.Types.ObjectId(anwserId) })
            if (!wordAnswer || wordAnswer?.userId.toString() != _id || wordAnswer?.wordIdsAnswer.length > 0) {
                return res.status(400).send({
                    message: "Answer unvailable"
                });
            }

            let points = 0;
            let convertObjectId = []
            for (let index = 0; index < choosenWordIds.length; index++) {
                const wordId = choosenWordIds[index];
                let convertedWordId = new mongoose.Types.ObjectId(wordId)
                convertObjectId.push(convertedWordId)
                let word = await Words.findOne({ _id: convertedWordId })
                if (word.topicIds.includes(new mongoose.Types.ObjectId(topicId))) {
                    points+=10;
                } else {
                    points-=10;
                }
            }
            if (points < 0) {
                points = 0
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                points: user.points + points * user.multiplier,
                tickets: user.tickets - 1,
            })

            if (user.refUser != null) {
                await updatePointForRefUser(user.refUser.toString(), points * user.multiplier)
            }

            await WordAnswer.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(anwserId)
            }, {
                wordIdsAnswer: convertObjectId,
                points
            })

            return res.status(200).send({
                data: points,
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    }
}