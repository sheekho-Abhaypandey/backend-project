import {Router} from  "express";
import {refreshAccessToken, registerUser,loginUser,logoutUser, UpdateUserAvatar, getUserChannelProfile, changeCurrentPassword, getCurrentUser, updateAccountDetails, UpdateUserCoverImage, getWatchHistory} from '../controllers/user.controllers.js';
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/register").post(
 upload.fields([
    {
        name: 'avatar', maxCount: 1
    },
    {
        name: 'coverImage', maxCount: 1
    },
 ]),

registerUser);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post( verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/update-account").patch(verifyJWT,updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"),UpdateUserAvatar);
router.route("/update-coverimage").patch(verifyJWT,upload.single("coverImage"), UpdateUserCoverImage);
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);
router.route("/history").get(verifyJWT,getWatchHistory);

router.route("/channel/:username").post(verifyJWT,getUserChannelProfile);

export default router;