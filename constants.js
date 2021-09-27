import multer from 'multer'
import fs from 'fs'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `./public/uploads/${req.userId}/`)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now()
        const filename = file.originalname  // name.jpg
        const part = filename.split(".")
        part[part.length-2]+=uniqueSuffix   // name+uniqeSuffix.jpg
        cb(null, part.join("."))
    }
})
export const upload = multer({storage})

export const COMMENT = 'comment'
export const LIKE = 'like'
export const SHARE = 'share'
export const POST_NUMBER_EACH_PAGE = 5
export const USER_NUMBER_EACH_SEARCH = 5
export const MESSAGE_NUMBER_EACH_PAGE = 20
export const AVATAR = 'avatar'
export const COVER_PHOTO = 'coverImg'
export const INFORMATION = 'information'