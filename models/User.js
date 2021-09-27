import mongoose from 'mongoose'
const Schema = mongoose.Schema

const UserSchema = new mongoose.Schema({
    firstname:{
        type: String,
        required: true
    },
    lastname:{
        type: String,
        required: true
    },
    fullname:{
        type: String
    },
    username:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    information:{
        type:{
            gender:{
                type: String,
                required: true
            },
            bod:{
                type: Date,
                required: true
            },
            address:{
                type: String
            },
            hometown:{
                type: String
            },
            school:{
                type: [String]
            },
            _id: false
        },
        required: true
    },
    follows:{
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
    friends:{
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
    waitFriends:{
        type:[
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'users'
                },
                _id: false
            }
        ],
        default: []
    },
    avatar:{
        type: String,
        default: null
    },
    coverImg:{
        type: String,
        default: null
    },
    createAt:{
        type: Date,
        required: true,
        default: Date.now
    }
})


const User = mongoose.model('users', UserSchema)
export default User