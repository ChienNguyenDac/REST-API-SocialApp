import mongoose from 'mongoose'
const Schema = mongoose.Schema

const MessageSchema = mongoose.Schema({
    conversationId:{
        type: Schema.Types.ObjectId,
        ref: 'conversations',
        require: true
    },
    senderId:{
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    content:{
        type: String,
        require: true
    },
    createAt:{
        type: Date,
        default: Date.now
    }
})

const Message = mongoose.model('messages', MessageSchema)
export default Message