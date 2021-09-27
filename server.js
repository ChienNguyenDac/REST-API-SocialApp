import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cors from 'cors'

import AuthRoute from './router/auth.js'
import PostRoute from './router/post.js'
import UserRoute from './router/user.js'
import ConversationRoute from './router/conversation.js'
import MessageRoute from './router/message.js'

dotenv.config()
/**
 * Connect to MongoDb
 */
// const uri = "mongodb+srv://dacchien:12345@cluster0.aqosg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const uri = "mongodb://localhost:27017/NetWorkApp"
mongoose.connect(uri, () => {
    console.log("Connect MongoDB successfully.");
}).catch(err => console.log(err.reason))

const PORT = process.env.PORT || 5000
const app = express()
// const server = http.createServer(app)
// const io = new Server(server,{
//     cors:{
//         origin:"*"
//     }
// })
// const messageIo = io.of("/")

app.use(express.json())
app.use(express.static('public'))
app.use(cors())

app.use('/api/auth', AuthRoute)
app.use('/api/posts', PostRoute)
app.use('/api/user', UserRoute)
app.use('/api/conversation', ConversationRoute)
app.use('/api/message', MessageRoute)

// app.get('/', (req, res) => {
//     res.send('Ready socketio')
// })

// messageIo.on('connection', (socket) => {
//     console.log('a user connected with ID: ', socket.id);
//     socket.emit("getId", socket.id)

//     socket.on("sendDataClient", dataGot => {
//         messageIo.emit("sendDataServer", dataGot)
//     })

//     socket.on("disconnect", (reason)=>{
//         console.log(`a user is disconnect with ID: `, socket.id)
//         console.log(reason)
//     })
// });

app.listen(PORT, () => {
    console.log(`Server start at ${PORT}`)
})