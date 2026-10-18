import express from 'express'
import publicRouter from './publicroutes.js'
import taskRouter from './taskroutes.js'
import profilRouter from './profilroutes.js'
import adminRouter from './adminroutes.js'
import correctionRouter from './correctionroutes.js'


const router = express.Router()

router.use('/publicroutes', publicRouter);
router.use('/taskroutes', taskRouter);
router.use('/profilroutes', profilRouter);
router.use('/adminroutes', adminRouter);
router.use('/correctionroutes', correctionRouter);


export default router