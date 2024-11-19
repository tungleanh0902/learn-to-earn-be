const User = require("../../models/users.model")
import jwt from 'jsonwebtoken'
require('dotenv').config()

export async function login (req: any, res: any) {
    try {
        const telegramUserId = req.body.telegramUserId
        const username = req.body?.username

        let user = await User.findOne({ telegramUserId })

        if (!user) {
            user = await User.create({
                telegramUserId,
                points: 0,
                tickets: 0,
                role: "user",
                refCode: telegramUserId,
                username
            })
        }

        if (username) {
            await User.findOneAndUpdate({
                telegramUserId
            }, {
                username,
            })
        }

        const payload = {
            id: user._id,
            role: user.role,
        }
        //now lets create a JWT token
        let token = jwt.sign(payload,
            process.env.JWT_SECRET || "",
            { expiresIn: "7d" }
        )
        user = user.toObject()
        user.token = token

        const options = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60),
            httpOnly: true  //It will make cookie not accessible on clinet side -> good way to keep hackers away
        }
        res.cookie(
            "token",
            token,
            options
        ).status(200).json({
            success: true,
            token,
            user,
            message: "Logged in Successfully✅"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Login failure⚠️ :" + error
        })
    }
}