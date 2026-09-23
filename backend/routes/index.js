import express from 'express'
import publicRouter from './publicroutes.js'
import taskRouter from './taskroutes.js'
import profilRouter from './profilroutes.js'


const router = express.Router()

router.use('/publicroutes', publicRouter);
router.use('/taskroutes', taskRouter);
router.use('/profilroutes', profilRouter);


export default router