import { shuffle } from "helper/helper"
import mongoose from "mongoose"

const Words = require('../../models/words.model')
const Topics = require('../../models/topics.model')

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

            const topic = await Topics.aggregate([
                { $sample: { size: 1 } },
            ])

            const correctWords = await Words.aggregate([
                { "$match": { "topicId": topic[0]._id } },
                { $sample: { size: correct } }
            ])

            const wrongWords = await Words.aggregate([
                { "$match": { "topicId": { $ne: topic[0]._id } } },
                { $sample: { size: total - correct } },
            ])

            const result = shuffle(correctWords.concat(wrongWords))

            return res.status(200).send({
                data: result
            });
        } catch (err: any) {
            console.log(err.message)
            return res.status(400).send({
                message: err.message
            });
        }
    }
}