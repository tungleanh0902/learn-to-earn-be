import mongoose from "mongoose"
import { shuffle } from "./../../helper/helper"

const Words = require('../../models/words.model')
const WordAnswer = require('../../models/wordAnswer.model')
const Topics = require('../../models/topics.model')
const User = require('../../models/users.model')

require('dotenv').config()

export const onManageWordGame = {
    doCreateTopics: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const contents = req.body.contents

            for (let index = 0; index < contents.length; index++) {
                const element = contents[index];
                await Topics.create({
                    content: element,
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

    doCreateWords: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const contents = req.body.contents
            const topicId = req.body.topicId
            for (let index = 0; index < contents.length; index++) {
                const element = contents[index];
                await Words.create({
                    content: element,
                    createdBy: _id,
                    topicId
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
                { $sample: { size: 1 } },
            ])

            const answer = await WordAnswer.create({
                userId: _id,
                topicId: topic._id
            })

            const correctWords = await Words.aggregate([
                { "$match": { "topicId": new mongoose.Types.ObjectId(topic[0]._id) } },
                { $sample: { size: correct } }
            ])

            const wrongWords = await Words.aggregate([
                { "$match": { "topicId": { $ne: new mongoose.Types.ObjectId(topic[0]._id) } } },
                { $sample: { size: total - correct } },
            ])

            const result = shuffle(correctWords.concat(wrongWords))

            return res.status(200).send({
                data: {
                    challenge: result,
                    answerId: answer._id,
                    topicId: topic._id
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

            let wordAnswer = await WordAnswer.findOne({ _id: anwserId })
            if (wordAnswer.userId !== _id || wordAnswer.wordIdsAnswer != null) {
                return res.status(400).send({
                    message: "answer unvailable"
                });
            }

            let points = 0;
            for (let index = 0; index < choosenWordIds.length; index++) {
                const wordId = choosenWordIds[index];
                let word = await Words.findOne({ _id: wordId })
                if (word.topicId != topicId) {
                    points--;
                } else {
                    points++;
                }
            }
            if (points < 0) {
                points = 0
            }

            await User.findOneAndUpdate({
                _id
            }, {
                points: user.points + 1 * user.multiplier,
                tickets: user.tickets - 1,
            })

            await WordAnswer.findOneAndUpdate({
                _id
            }, {
                wordIdsAnswer: choosenWordIds,
                points
            })

            return res.status(200).send({
                data: {
                    points,
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