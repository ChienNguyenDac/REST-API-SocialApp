import express from 'express'
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import { verifyToken } from '../middleware/middleware.js'
import { MESSAGE_NUMBER_EACH_PAGE } from '../constants.js'

const MessageRoute = express.Router()

/**
 * @route POST /api/message
 * @description create new message
 * @access private
 */
MessageRoute.post('/', verifyToken, async(req, res) => {
    const { conversationId, senderId, content } = req.body
    if( !conversationId || !senderId || !content)
        return res.status(400).json({
            success: false,
            message: 'Cannot send message.'
        })
    
    try {
        const newMessage = new Message({
            conversationId, senderId, content
        })
        await newMessage.save()
        //  update last msg to conversaton
        await Conversation.findByIdAndUpdate(conversationId,{
            lastMessage: newMessage._id
        })
        return res.json({
            success: true,
            message: 'Send message success.',
            data: newMessage
        })
    } catch (error) {
        console.log(error)
        return res.json({
            success: false,
            message: 'Internal Server Error.'
        })
    }
})

/**
 * @route GET /api/message/:conversationId?page=...
 * @description get list message  on page in conversationId
 * @access private
 */
MessageRoute.get('/:conversationId', verifyToken, async(req, res) => {
    const conversationId = req.params.conversationId
    let { page } = req.query

    if(!page)   page = 1    //  default page 
    if(!page || !conversationId)
        return res.status(400).json({
            success: false,
            message: 'Conversation not found.'
        })
    
    try {
        // check user is in conversation:
        const conversation = await Conversation.findById(conversationId).select("members")
        if(!conversation.members.some( member => member.user !== req.userId ))
            return res.status(403).json({
                success: false,
                message: "You aren't in this conversation."
            })

        const messages = await Message.find({ conversationId }).sort({_id: -1})
        .skip((page-1)*MESSAGE_NUMBER_EACH_PAGE).limit(MESSAGE_NUMBER_EACH_PAGE)

        return res.json({
            success: true,
            message: 'Get message success.',
            data: messages.reverse()
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.'
        })
    }
    
})

export default MessageRoute