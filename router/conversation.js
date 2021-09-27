import express from 'express'
import { ObjectId } from 'mongodb'
import { verifyToken } from '../middleware/middleware.js'
import Conversation from '../models/Conversation.js'

const ConversationRoute = express.Router()

/**
 * @route POST /api/conversation
 * @param memberId
 * @description create new conversation 
 * @access private
 */
ConversationRoute.post('/', verifyToken, async (req, res) => {
    let { members, name, avatar } = req.body
    if(!members) 
    return res.status(400).json({
        sucess: false,
        message: 'Cannot create new conversation.'
    })

    const userId = req.userId.toString()
    members = [
        ...members.map( e => ({user: e}) ), 
        {user: userId} 
    ]
    try {
        const conversation = await Conversation.findOne({members})
        if(conversation)
            return res.status(400).json({
                sucess: false,
                message: 'This conversation is created.'
            }) 

        const newConversation = new Conversation({
            members,
            name,
            avatar
        })
        await newConversation.save()
        
        return res.json({
            sucess: true,
            message: 'Create new conversation success.',
            conversation: newConversation
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            sucess: false,
            message: 'Internal Server Error.'
        })
    }
})


/**
 * @route GET /api/conversation/
 * @description return all user's conversations
 * @access private
 */
ConversationRoute.get('/', verifyToken, async (req, res) => {
    try {
        let conversations = await Conversation.find({
            "members.user" : req.userId
        }).populate("members.user", ["firstname", "lastname", "avatar"])
        .populate("lastMessage", ["senderId", "content", "createAt"])

        return res.json({
            sucess: true,
            message: 'Get all conversations success.',
            conversations
        })
    } catch (error) {
        return res.status(500).json({
            sucess: false,
            message: 'Internal Server Error.'
        })
    }
})


export default ConversationRoute