import express from 'express'
import { ObjectId } from 'mongodb'

import User from '../models/User.js'
import Post from '../models/Post.js'
import { POST_NUMBER_EACH_PAGE, USER_NUMBER_EACH_SEARCH , upload } from '../constants.js'
import { verifyToken } from '../middleware/middleware.js'
const UserRoute = express.Router()

/**
 * @route GET /api/user/:id/information
 * @description get information other user
 * @access private
 */

UserRoute.get('/:id/information', verifyToken, async (req, res) => {
    /* CAN UPDATE PRIVATE FIELD BY THIS USER TO DISABLE  */
    /* DO  IT AFTER */
    const userId = req.params.id
    //  check is valid str id
    if (!userId.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).json({
            success: false,
            message: "User not found."
        })
    try {
        const userInfo = await User.findOne({_id: userId}, { 
            friends: { $slice: -5 }, //  just query last 5 friends in list
            waitFriends: { $slice: -5 }
        })
        .select("-username -password -createAt -waitFriends -follows")
        .populate("friends.user", ["firstname", "lastname", "avatar"])
        .populate("waitFriends.user", ["firstname", "lastname", "avatar"])

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
 * @route GET /api/user/search?key=...
 * @description find user with key... => return user list
 * @access private
 */
UserRoute.get('/search', verifyToken, async (req, res) => {
    const key = req.query.key
    try {
        const users = await User.find({
            $or: [
                {
                    fullname: new RegExp(key, 'i')
                },
                {
                    firstname: new RegExp(key, 'i')
                },
                {
                    lastname: new RegExp(key, 'i')
                }
            ]
        }).select("_id avatar firstname lastname").limit(USER_NUMBER_EACH_SEARCH)

        return res.json({
            success: true,
            message: 'Search user successfully.',
            users
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
 * @route POST /api/user/:id/friend
 * @description to accept friend or unfriend
 *              => change from wait friend -> friends, follow -> friends
 * @access private
 */

UserRoute.post('/:id/friend', verifyToken, async (req, res) => {
    const userOwnId = req.userId
    const userId = new ObjectId(req.params.id)

    try {
        const userOwn = await User.findOneAndUpdate({
            _id: userOwnId,
            $or: [{"waitFriends.user": userId }, {"friends.user": userId}]
        }, [
            {
                $set:{
                    waitFriends: {
                        $cond:[
                            { $in: [{user: userId}, "$waitFriends"] },
                            { $setDifference: ["$waitFriends", [{ user: userId }]] },// remove from waitfriend
                            "$waitFriends"
                        ]
                    },
                    friends:{
                        $cond: [
                            { $in: [{user: userId}, "$waitFriends"] },
                            { $concatArrays: ["$friends", [{ user: userId }]] },   //  wait -> friend
                            { $setDifference: ["$friends", [{ user: userId }]] }    // remove from friend list
                        ]
                    }
                }
            }
        ], { new: true })
        .select("-username -password -createAt")
        .populate("waitFriends.user", ["firstname", "lastname", "avatar"])
        .populate("follows.user", ["firstname", "lastname", "avatar"])
        .populate("friends.user", ["firstname", "lastname", "avatar"])

        const user = await User.findOneAndUpdate({
            _id: userId,
            $or: [{"follows.user": userOwnId }, {"friends.user": userOwnId}]
        }, [
            {
                $set:{
                    follows: {
                        $cond:[
                            { $in: [{user: userOwnId}, "$follows"] },
                            { $setDifference: ["$follows", [{ user: userOwnId }]] },// remove from follow
                            "$follows"
                        ]
                    },
                    friends:{
                        $cond: [
                            { $in: [{user: userOwnId}, "$follows"] },
                            { $concatArrays: ["$friends", [{ user: userOwnId }]] },   //  follow -> friend
                            { $setDifference: ["$friends", [{ user: userOwnId }]] }    // remove from friend list
                        ]
                    }
                }
            }
        ], { new: true })
        .select("-username -password -createAt -waitFriends -follows")
        .populate("friends.user", ["firstname lastname avatar"])
        if(!user || !userOwn)
            return res.status(400).json({
                success:false,
                message: 'Cannot found user.'
            })
        return res.json({
            success: true,
            message: 'Add/Un friend success.',
            user,
            userOwn
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
 * @route POST /api/user/:id/follow
 * @description to follow or unfollow other
 * @access private
 */

UserRoute.post('/:id/follow', verifyToken, async (req, res) => {
    const userOwnId = req.userId
    const userId = new ObjectId(req.params.id)
    try {
        const userOwn = await User.findByIdAndUpdate(userOwnId, [
            {
                $set: {
                    follows:{
                        $cond: [
                            { 
                                $in: [{ user: userId }, "$follows"]
                            },
                            {
                                $setDifference: ["$follows", [{ user: userId }]]
                            },
                            {
                                $concatArrays: ["$follows", [{ user: userId }]]
                            }
                        ]
                    } 
                }
            }
        ], { new: true })
        .select("-username -password -createAt")
        .populate("waitFriends.user", ["firstname", "lastname", "avatar"])
        .populate("follows.user", ["firstname", "lastname", "avatar"])
        .populate("friends.user", ["firstname", "lastname", "avatar"])

        const user = await User.findByIdAndUpdate(userId, [
            {
                $set: {
                    waitFriends: {
                        $cond: [
                            {
                                $in: [{ user: userOwnId}, "$waitFriends"]
                            },
                            {
                                $setDifference: ["$waitFriends", [{ user: userOwnId }]]
                            },
                            {
                                $concatArrays: ["$waitFriends", [{ user: userOwnId }]]
                            }
                        ]
                    }
                }
            }
        ], { new: true })
        .select("-username -password -createAt -waitFriends -follows")
        .populate("friends.user", ["firstname lastname avatar"])

        if(!user || !userOwn)
            return res.status(400).json({
                success: false,
                message: 'User not found'
            })
        return res.json({
            success: true,
            message: 'Follow/ unfollow success.',
            user,
            userOwn
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.'
        })
    }
})

export default UserRoute
