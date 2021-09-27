import mongoose from 'mongoose'
const Schema = mongoose.Schema

const PostSchema = mongoose.Schema({
    content:{
        type: String,
        require: true
    },
    media:{
        type: String,
    },
    publishDate:{
        type: Date,
        default: Date.now
    },
    comments:{
        type: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'users' 
                },
                content:{
                    type: String,
                    require: true
                },
                time:{
                    type: Date,
                    default: Date.now
                },
                _id: false
            }
        ],
        default: []
    },
    likes:{
        type: [
            {
                user:{
                    type: Schema.Types.ObjectId,
                    ref: 'users' 
                },
                _id: false
                // typeReact:{
                //     type: String,
                //     enum: ['LIKE', 'HAHA', 'LOVE', 'WOW', 'SAD', 'ANGRY']
                // }
            }
        ],
        default: []
    },
    shares:{
        type: [
            {
                user:{
                    type: Schema.Types.ObjectId,
                    ref: 'users'
                },
                _id: false
            }
        ],
        default: []
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'users'    
    }
})

const Post = mongoose.model('posts', PostSchema)
export default Post