import express from 'express'
import jwt from 'jsonwebtoken'
import argon2 from 'argon2'

import User from '../models/User.js'
import { verifyToken, createDir } from '../middleware/middleware.js'
import { upload, AVATAR, COVER_PHOTO, INFORMATION } from '../constants.js'

const AuthRoute = express.Router()

/**
 * @route POST /api/auth/register
 * @description register user
 * @access public
 */
AuthRoute.post('/register', async (req, res) => {
    const {
        firstname,
        lastname,
        username,
        password,
        gender,
        bod
    } = req.body
    console.log(req.body)
    //  Check form not fill up
    if (!username || !password || !gender || !bod || !firstname || !lastname)
        return res.status(400).json({ // bad request
            success: false,
            message: 'Form not fill up.'
        })

    //  Check user exist
    const user = await User.findOne({
        username: username
    })
    if (user)
        return res.status(400).json({
            success: false,
            message: 'User is exist.'
        })

    try {
        const hassPassword = await argon2.hash(password)
        const newUser = new User({
            firstname,
            lastname,
            fullanem: firstname + ' ' + lastname,
            username,
            password: hassPassword,
            information: {
                bod,
                gender
            }
        })
        await newUser.save()
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',

        })
    }

    return res.json({
        success: true,
        message: 'Create new user successfully.',
        username,
        password
    })
})

/**
 * @route POST /api/auth/login
 * @description loggin
 * @access public
 */
AuthRoute.post('/login', async (req, res) => {
    const {
        username,
        password
    } = req.body
    // check form
    if (!username || !password)
        return res.status(400).json({
            success: false,
            message: 'Username and password is required.'
        })

    // validate user
    try {
        const user = await User.findOne({
            username: username
        })

        let isWrongUser = false
        if (!user)
            isWrongUser = true
        else {
            const passwordValid = await argon2.verify(user.password, password)
            if (!passwordValid)
                isWrongUser = true
        }

        if (isWrongUser)
            return res.status(400).json({
                success: false,
                message: 'Username or password is wrong.'
            })

        //  loggin success & give jwt token to client
        const token = jwt.sign({
            user:{
                userId: user._id
            }
        }, process.env.ACCESS_TOKEN_SECRET)

        return res.json({
            success: true,
            message: 'Logged-in success.',
            accessToken: token
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.'
        })
    }
})

/**
 * @route GET /api/auth/information
 * @description get infomation user with accessToken
 * @access private
 */
AuthRoute.get('/information', verifyToken, async(req, res) => {
    try {
        const userInfo = await User.findById(req.userId, { 
            friends: { $slice: -5 }, //  just query last 5 friends in list
            waitFriends: { $slice: -5 }
        })
        .select("-username -password -createAt")
        .populate("friends.user", ["firstname", "lastname", "avatar"])
        .populate("waitFriends.user", ["firstname", "lastname", "avatar"])
        .populate("follows.user", ["firstname", "lastname", "avatar"])

        return res.json({
            success: true,
            message: "get user's information success.",
            userInfo
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.'
        })
    }
})

/**
 * @route PATCH /api/auth/information
 * @description edit user info profile
 * @access private
 */
 AuthRoute.patch('/information', verifyToken, createDir, upload.single('media'), async(req, res)=>{
    const userId = req.userId
    let pathImg = null
    if(req.file)
        pathImg = '/' + req.file.path.split("/").slice(1).join("/")

    const { type, data } = req.body
    //  easy check 
    if(!type || (type==INFORMATION && !data) || (type!=INFORMATION && !pathImg))
        return res.status(400).json({
            success: false,
            message: 'Empty data, please fill enough infomation to update'
        })

    try {
        let update = null
        switch(type){
            case AVATAR:{
                update = {
                    avatar: pathImg
                }
                break
            }
            case COVER_PHOTO:{
                update = {
                    coverImg: pathImg
                }
                break
            }
            case INFORMATION:{
                update = {
                    information: data
                }
                break
            }
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Your information is wrong'
                })
        }
        const user = await User.findByIdAndUpdate(userId, update, { new: true })
                                .select("-username -password -createAt")
                                .populate("friends.user", ["firstname", "lastname", "avatar"])
                                .populate("waitFriends.user", ["firstname", "lastname", "avatar"])
                                .populate("follows.user", ["firstname", "lastname", "avatar"])
                                
        return res.json({
            success: true,
            message: "Update information user success",
            userInfo: user
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

export default AuthRoute