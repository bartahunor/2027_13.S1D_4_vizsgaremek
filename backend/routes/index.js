import express from 'express'
import publicRouter from './publicroutes.js'
import taskRouter from './taskroutes.js'


const router = express.Router()

router.use('/publicroutes', publicRouter);
router.use('/taskroutes', taskRouter)


export default router