import express from 'express'

import Post from '../models/Post.js'
import { createDir, verifyToken } from '../middleware/middleware.js'
import { upload, COMMENT, LIKE, 
    SHARE, POST_NUMBER_EACH_PAGE } from '../constants.js'
import User from '../models/User.js'

const PostRoute = express.Router()

/**
 * @route  GET /api/posts or /api/posts?page=..&userId=...
 * @description give out all posts to client
 * @argument UserId -> get post for profile user with userID params
 * @access private
 */
PostRoute.get('/', verifyToken, async (req, res) => {
    let { page, userId } = req.query
    let query = {}
    if(userId)
        query = { user: userId }
   
    if(!page)
        return res.status(400).json({
            success: false,
            message: 'Page is out of range total'
        })
        
    try {
        const posts = await Post.find(query).sort({_id:-1})
        .skip((page-1)*POST_NUMBER_EACH_PAGE)
        .limit(POST_NUMBER_EACH_PAGE)
        .populate("comments.user", ["firstname", "lastname", "avatar"])
        .populate("likes.user", ["firstname", "lastname", "avatar"])
        .populate("user", ["firstname", "lastname", "avatar"])

        return res.json({
            success: true,
            message: 'Get posts data successfully.',
            posts
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
 * @route POST /api/posts
 * @description add new post to database
 * @access private
 */
PostRoute.post('/', verifyToken, createDir, upload.single('media'), async (req, res) => {
    let pathImg = null
    if(req.file)
        pathImg = req.file.path.split("/").slice(1).join("/")
    const { content } = req.body
    //  check form
    if (!content && !pathImg)
        return res.status(400).json({
            success: false,
            message: 'Content of the post is required.'
        })
    try {
        const newPost = new Post({
            content,
            media: pathImg || null,
            comments: [],
            likes: [],
            shares: [],
            user: req.userId
        })
        await newPost.save()
        const user = await User.findById(newPost.user).select("firstname lastname avatar")

        newPost.user = user
        return res.json({
            success: true,
            message: 'Add new post success.',
            post: newPost
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
 * @route  PUT /api/posts/:id ~ overwrite post
 * @description edit user's post
 * @access private
 */
PostRoute.put('/:id', verifyToken, async (req, res) => {
    const {
        content,
        media
    } = req.body

    if (!content && !media)
        return res.status(400).json({
            success: false,
            message: 'Cannot edit post because of empty content.'
        })

    const postId = req.params.id
    try {
        const newPost = await Post.findOneAndUpdate({_id: postId}, {
            content,
            media
        })

        if(!newPost)
            return res.status(400).json({
                success: false,
                message: 'Cannot found the post.'
            })

        return res.json({
            success: true,
            message: 'Update post succesfully.',
            post: newPost,
            user: req.user
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

/**
 * @route  PATCH /api/posts/:id ~
 * @description update post by : comment, like, share, ...
 * @access private
 */
PostRoute.patch('/:id', verifyToken, async (req, res) => {
    const { type, data } = req.body
    const userId = req.userId
    //  easy check
    if(!type || (type==COMMENT && !data))
        return res.status(400).json({
            success: false,
            message: 'Cannot comment, share, react the post with empty data.'
        })

    const postId = req.params.id
    try {
        //  get data want to patch
        let postUpdate = null
        switch (type){
            case COMMENT:{
                postUpdate = await Post.findOneAndUpdate({_id: postId}, {
                    $push:{
                        comments: {
                            $each:[{
                                user: userId,
                                content: data
                            }],
                            $position: 0
                        }
                    },
                }, { new: true })
                .populate("comments.user", ["firstname", "lastname", "avatar"])
                .populate("likes.user", ["firstname", "lastname", "avatar"])
                .populate("user", ["firstname", "lastname", "avatar"])
                break
            }
            case LIKE:{
                //  Unlike & like
                postUpdate = await Post.findOneAndUpdate({
                    _id: postId,
                },[
                    {
                        $set:{
                            likes:{
                                $cond: [
                                    {
                                        $in: [{ user: userId}, "$likes"]
                                    },
                                    {
                                        $setDifference: ["$likes", [{ user: userId}]]
                                    },
                                    {
                                        $concatArrays: ["$likes", [{ user: userId}]]
                                    }
                                ]
                            }
                        }
                    }
                ], { new: true })
                .populate("comments.user", ["firstname", "lastname", "avatar"])
                .populate("likes.user", ["firstname", "lastname", "avatar"])
                .populate("user", ["firstname", "lastname", "avatar"])
                break
            }
            case SHARE:{
                //  only share 1 times, cannot remove
                postUpdate = await Post.findOneAndUpdate({
                    _id: postId,
                    "shares.user": { $ne: userId}
                },{
                    $push:{
                        shares: {
                            user: userId
                        }
                    }
                }, { new: true })
                .populate("comments.user", ["firstname", "lastname", "avatar"])
                .populate("likes.user", ["firstname", "lastname", "avatar"])
                .populate("user", ["firstname", "lastname", "avatar"])
                break
            }
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Type data to fetch is invalid.'
                })
        }
        if(!postUpdate)
        return res.status(400).json({
            success: false,
            message: 'Cannot found the post/ cannot update post.'
        })
        
        return res.json({
            success: true,
            message: 'Update post succesfully.',
            post: postUpdate
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


/**
 * @route  DELETE /api/posts/:id
 * @description DELETE product in user shop page
 * @access private
 */
PostRoute.delete('/:id', verifyToken, async (req, res) => {
    const postId = req.params.id
    const userId = req.userId
    try {
        const post = await Post.findOneAndDelete({
            _id: postId,
            user: userId
        })

        if(!post)
            return res.status(400).json({
                success: false,
                message: 'Cannot found the post.'
            })

        return res.json({
            success: true,
            message: 'Delete post successfully.',
            postDelete: post,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.'
        })
    }
})

export default PostRoute