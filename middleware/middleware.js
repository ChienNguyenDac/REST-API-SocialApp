import jwt from 'jsonwebtoken'
import { mkdir } from 'fs'

import User from '../models/User.js'

/**
 * header contain
 * Authorised : Bearer token
 */
const verifyToken = async function (req, res, next) {
    const data = req.headers['authorization']
    const token = data.split(" ")[1];
    try {
        const { payload } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
            complete: true
        })
        const user = await User.findById(payload.user.userId)
        if(! user)
                //  Forbidden
            return res.status(403).json({
                success: false,
                message: 'Invalid Token_access.'
            })

        req.userId = user._id
        next()

    } catch (error) {
        console.log(error);
        //  Forbidden
        return res.status(403).json({
            success: false,
            message: 'Invalid Token_access.'
        })
    }
}

const createDir = (req, res, next) => {
    mkdir(`public/uploads/${req.userId}`, { recursive: true }, (err) => {
        if(err){
            console.log(err)
            return res.status(400).json({
                success: false,
                message: 'Cannot upload file.'
            })
        }
    })
    next()
}

export {
    verifyToken, createDir
}