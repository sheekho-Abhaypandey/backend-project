// import mongoose from 'mongoose';
// import {DB_NAME} from './constants.js';
// import express from 'express';
// const app=express();
// const PORT=process.env.PORT ||3000;

import dotenv from 'dotenv' ;
import connectDB from './db/database.js';
import {app} from './app.js';




dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{

   app.on("error",(error)=>{
      console.log("application not able to talk to database", error);
      throw error;
   });
      app.listen(process.env.PORT,()=>{
         console.log(`Server is listening on port ${process.env.PORT}`);
      });
})
.catch((error)=>{
    console.log("Mongodb connection failed !!",error);
});







/*
( async()=>{
try{
 await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`,)
 app.on("error",(error)=>{
    console.log("application not able to talk to database", error);
    throw error;
 });
 app.listen(process.env.PORT,()=>{
    console.log(`Server is listening on port ${process.env.PORT}`);
 })
}
catch(error){
console.log(error);

}
})() */