import mongoose from 'mongoose'
const Schema = mongoose.Schema

const ConversationSchema = mongoose.Schema({
    members:[
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            _id: false
        }
    ],
    lastMessage:{
        type: Schema.Types.ObjectId,
        ref: 'messages' 
    },
    name:{
        type: String,
        default: null
    },
    avatar:{
        type: String
    },
    createAt:{
        type: Date,
        default: Date.now
    }
})

const Conversation = mongoose.model('conversations', ConversationSchema)
export default Conversation