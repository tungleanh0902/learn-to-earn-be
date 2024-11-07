import mongoose from "mongoose"
import { shuffle } from "./../../helper/helper"
import { updatePointForRefUser } from "../../controllers/users/user.controller"

const Sentence = require('../../models/sentences.model')
const SentenceAnswer = require('../../models/sentenceAnswer.model')
const User = require('../../models/users.model')

require('dotenv').config()

export const onManageSentenceGame = {
    doCreateSentence: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            const lessons = req.body.lessons

            for (let index = 0; index < lessons.length; index++) {
                await Sentence.create({
                    content: lessons[index].content,
                    points: lessons[index].points,
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

    doChangeSentence: async (req: any, res: any, next: any) => {
        try {
            const sentenceId = req.body.sentenceId
            const content = req.body.content
            const points = req.body.points
            const isHidden = req.body.isHidden

            await Sentence.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(sentenceId)
            }, {
                content: content,
                points,
                isHidden
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

    doGetSentenceGame: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            if (user.tickets == 0) {
                return res.status(400).send({
                    message: "Out of tickets"
                });
            }

            const sentences = await Sentence.aggregate([
                { $match: { isHidden: false } },
                { $sample: { size: 5 } },
            ])

            let answerIds = []
            let sentenceIds = []
            for (let index = 0; index < sentences.length; index++) {
                const sentence = sentences[index];
                sentence.content = shuffle(sentence.content)
                let answer = await SentenceAnswer.create({
                    userId: _id
                })
                answerIds.push(answer._id)
                sentenceIds.push(sentence._id)
            }

            return res.status(200).send({
                data: {
                    challenge: sentences,
                    answerIds,
                    // fix multiple sentence
                    sentenceId: sentences[0]._id
                }
            });
        } catch (err: any) {
            return res.status(400).send({
                message: err.message
            });
        }
    },

    doAnswer: async (req: any, res: any, next: any) => {
        try {
            const _id = req.user.id
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })
            if (user.tickets == 0) {
                return res.status(400).send({
                    message: "Out of tickets"
                });
            }

            const contents = req.body.contents
            const anwserIds = req.body.anwserIds
            const sentenceIds = req.body.sentenceIds
            
            let points = 0;
            for (let index = 0; index < anwserIds.length; index++) {
                const anwserId = anwserIds[index];
                let sentenceAnswer = await SentenceAnswer.findOne({ _id: new mongoose.Types.ObjectId(anwserId) })
                if (!sentenceAnswer || sentenceAnswer?.userId.toString() !== _id || sentenceAnswer?.content?.length > 0) {
                    return res.status(400).send({
                        message: "Answer unvailable"
                    });
                }
                let sentence = await Sentence.findOne({ _id: new mongoose.Types.ObjectId(sentenceIds[index]) })
                if (sentence.content.join() === contents[index].join()) {
                    points += sentenceAnswer.points;
                }

                await SentenceAnswer.findOneAndUpdate({
                    _id: new mongoose.Types.ObjectId(anwserId)
                }, {
                    content: contents[index]
                })
            }

            await User.findOneAndUpdate({
                _id: new mongoose.Types.ObjectId(_id)
            }, {
                points: user.points + points * user.multiplier,
                tickets: user.tickets - 1,
            })

            if (user.refUser != null) {
                await updatePointForRefUser(user.refUser.toString(), points)
            }

            let newUser = await User.findOne({ _id: new mongoose.Types.ObjectId(_id) })

            return res.status(200).send({
                data: {
                    point: points * user.multiplier,
                    user: newUser
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