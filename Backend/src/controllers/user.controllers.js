import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary } from "../utils/cloudinaryAssetDeletion.js";
import {extractPublicIdFromUrl} from "../utils/public_id.js";

import jwt from 'jsonwebtoken';


const generateAccessAndRefreshTokens =async(userId)=>{
  try{
 const user= await User.findById(userId);
      const accessToken=user.generateAccessToken();
      const refreshToken=user.generateRefreshToken();
      // console.log(refreshToken);

      user.refreshToken=refreshToken;
      user.save({validateBeforeSave:false})
      return {accessToken,refreshToken};
  }
  catch(error){
    throw new ApiError("Error while generating Access and Refresh Token");
  }
}

const registerUser = asynchandler(async (req, res) => {
  // res.status(200).json({
  //     message:"ok",
  // })

  // get user field  details
  //check input validation- not empty
  //check user already exist: username,email
  //check for images, check for avatar
  //upload them to cloudinary , avatar
  //create user object-create entry in  db
  //remove password and refreshToken field from response
  //check for user creation
  //return response
  const { username, email, fullName, password } = req.body;
  console.log("email :", email);
  console.log("username :", username);
  console.log("fullname :", fullName);

  //check validation one-by-one

  // if(fullName.trim()===""){
  //     throw new APiError(400,"fullname is required");
  // }
  // if(username.trim()===""){
  //     throw new APiError(400,"username is required");
  // }
  // if(email.trim()==="" ||){
  //     throw new APiError(400,"fullname is required");
  // }
  // if (!email.endsWith("@gmail.com")) {
  //     throw new ApiError(400, "OPlease enter a valid email ");
  //   }
  //   if(password.trim()===""){
  //     throw new APiError(400,"fullname is required");
  // }

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exist");
  }
  console.log(existedUser);
  //  console.log("req.files",req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;

  // way to find the coverImagePath by using  optional chaining on coverImage  'coverImage?'
  const coverImagePath = req.files?.coverImage?.[0]?.path;

  //Another way to find the coverImagePath 
  // let coverImagePath;
  // if(req.files && Array.isArray(req.files,coverImage) && req.files.coverImage.length>0){
  //     coverImagePath=req.files.coverImage[0].path
  // }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //  console.log("avatarLocalPath",avatarLocalPath);

  //used when coverImage is required
  //  if(!coverImagePath){
  //     throw new ApiError(400, "CoverImage file is required");
  //  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImagePath);

  if (!avatar) {
    throw new ApiError(404, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went  wrong  while creating the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});


const loginUser= asynchandler(async (req,res)=>{
      //get email or username password in field validation 
      //check into the db 
      //check the hashed password and  user provided password in hashed form
      //access and refresh token 
      //send cookies

      const {username,email,password}=req.body;
      if(!(username || email)){
        // if (!username && !email) {
        throw new ApiError("username and email is required"); 
}

       const user=await User.findOne({
        $or:[{username }, {email}]
      })
      if(!user){
        throw new ApiError("User doesn't exist")
      }

      const isPasswordValid =await user.isPasswordCorrect(password);

      if(!isPasswordValid){
        throw new ApiError("Invalid Credentials");
      }
   const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

   const loggedInUser= await User.findById(user._id).select(" -password -refreshToken");
  //  console.log(refreshToken);

   const options={
   httpOnly:true,
   secure:true,
   }

   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken" ,refreshToken,options)
   .json(new ApiResponse(200,{
    user:loggedInUser,accessToken, refreshToken
   },
   "User logged In Successfully"
  )
)



});

const logoutUser= asynchandler(async(req,res)=>{
   await User.findByIdAndUpdate(req.user._id,{
    $unset:{
      refreshToken:1,  //this removes the field from the document
    }

    
  },

  {
    new :true,
  }

)

const options={
  httpOnly:true,
  secure:true,
  }

  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200, {}, "User logged out Successfully"))
})

const refreshAccessToken=asynchandler(async(req,res)=>{
   const incomingRefreshToken =req.cookies.refreshToken || req.body.refreshToken;

   if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorrised request")
   }

try {
  const decodeToken=jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
  
  
      const user=await User.findById(decodeToken?._id);
      if(!user){
        throw new ApiError(401 ,"Invalid  refresh Token");
      }
      if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 ,"Refresh Token  is expired or used");
      }
      const options={
        httpOnly:true,
        secure:true
      }
  
      const{accessToken,  refreshToken:newRefreshToken}= await generateAccessAndRefreshTokens(user?.id)
  
      return res
      .status(200)
      .cookie("accessToken" , accessToken,options)
      .json(
        new ApiResponse(200,
          {accessToken,refreshToken:newRefreshToken},
          "Access Token refreshed"
        )
      )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})


const changeCurrentPassword=asynchandler(async(req,res)=>{
  const{oldPassword,newPassword, confrmPassword}=req.body;
  if(!(newPassword===confrmPassword)){
    throw new ApiError(400, "Password do not match");
  }
   const user=await User.findById( req.body?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
    throw new ApiError(401, "Invalid old Password");
   }

   user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json( new ApiResponse(200,{}, "Password changed Successfully"));
})

const getCurrentUser=asynchandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200 ,req.user, "Current User fetched Successfully"))
})

const updateAccountDetails=asynchandler(async(req,res)=>{
  const {fullName,email}=req.body;


if(!(fullName || email)){
  throw new ApiError("All fields are required");
}

 const user= await User.findByIdAndUpdate( req.user?._id,
  {
  $set:{ fullName:fullName,email:email}
 },
 {new:true}

).select("-password ");

return res
.status(200)
.json(200 ,user, "Account details updated Successfully")
})

const  UpdateUserAvatar=asynchandler(async(req,res)=>{
  const avatarLocalPath= req.file?.path;

  

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing");
  }
  console.log("avatarLocalPath",avatarLocalPath);
   const avatar=await uploadOnCloudinary(avatarLocalPath);
   
   console.log(avatar.url);
   if(!avatar.url){
  throw new ApiError(400 ,"Error while uploading on avatar");
   }


    const user= await User.findByIdAndUpdate(req.user?._id,{ 
    $set:{
    avatar:avatar.url
   }
  }, {new:true}
).select("-password")

//old file delete from the cloudinary
const existingAvtar= await User.findById(req.user._id);
   console.log("existingUser", existingAvtar);

   const oldAvatarUrl=existingAvtar.avatar;
   console.log( "oldAvatarUrl ", oldAvatarUrl);
  
   if (oldAvatarUrl) {
    const publicId = extractPublicIdFromUrl(oldAvatarUrl);
    console.log("publicId",publicId);
    if (publicId) await deleteFromCloudinary(publicId);
  }
  else{
    throw new ApiError(400, 'old url not found');
  }

return res.status(200).json(200,user, "Cover Image Updated Successfully");





//Todo to delete old avatar url cloudinary
//first find the req file path and store in a variable
//and then access its old avatar url  using avatar.url
// and then delete it from mongodb
})



const  UpdateUserCoverImage=asynchandler(async(req,res)=>{
  const CoverImageLocalPath= req.file?.path;

  if(!CoverImageLocalPath){
    throw new ApiError(400, "CoverImage file is missing");
  }

   const coverImage =await uploadOnCloudinary(avatarLocalPath);

   if(!coverImage.url){
  throw new ApiError(400 ,"Error while uploading on coverImage ");
   }

    const user=await User.findByIdAndUpdate(req.user?._id,{ 
    $set:{
      coverImage:coverImage.url
   }
  }, {new:true}
).select("-password")

return res.status(200).json(200,user,"Cover Image updated Successfully");


})


const  getUserChannelProfile=asynchandler(async(req,res)=>{
const {username} =(req.params)
if(!username?.trim()){
  throw new ApiError(400,"Username is missing");
}

const channel=await User.aggregate([
{
  $match:{
    username:username?.toLowerCase()
  }
},

{
  $lookup:{
    from:"subscriptions",
    localField:"_id",
    foreignField:"channel",
    as:"subscribers"
  }
},

{
  $lookup:{
  from:"subscriptions",
  localField: "_id",
  foreignField:"subscriber",
  as:"subscriberedTo" //for those i subscribed

}
},

{
  $addFields:{
  
    SubscribersCount:{
    $size:"$subscribers"
  },

  channelIsSubscribedTo:{
    $size:"$subscriberedTo"
  },
  issubscribed:{
    $cond:{
      if:{ $in: [req.user?._id, "$subscribers.subscriber"]},
      then:true,
      else:false
    }
  }

  }

},

{
  $project:{
    fullName:1,
    username:1,
    SubscribersCount:1,
    channelIsSubscribedTo:1,
    issubscribed:1,
    avatar:1,
    coverImage:1,
    email:1,
    createdAt:1
  }
}
]
)

if(!channel?.length){
  throw new ApiError( 404,"channel does not exist")
}

return res.status(200).json(new ApiResponse(200,channel[0], "User data fetched Successfully"));


})

const getWatchHistory=asynchandler(async(req,res)=>{
  const user=await User.aggregate([
    {
      $match:{
        _id:new mongoose.Schema.Types.ObjectId(
          req.user._id)

      }
    },

    {
      $lookup:{
        from: "videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
              }
            },
            {
              $addFields:{
                owner:{
                  $arrayElemAt: "owner"
                }
              }
            }
        ] 
      }
    }
  ])

  return res.status(200).json(200,user[0].history, "Watch History fetched Successfully");
})

export { registerUser,loginUser,logoutUser ,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,UpdateUserAvatar, UpdateUserCoverImage,getUserChannelProfile,getWatchHistory};
