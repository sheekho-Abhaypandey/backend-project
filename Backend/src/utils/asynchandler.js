
 const asynchandler=(requesthandler)=>{
    (req,res,next)=>{
   Promise.resolve(requesthandler(req,res,next)).catch((err)=>next(err))
    }
 }


// const asynchandeler=()=>{};
// const asynhandler=(fn)=>()=>{};
// const asynchandler=(fn)=>async()=>{};

const asynchandler=(fn)=>async(req,res,next)=>{
try{
   await fn(req,res,next);
}
catch(error){
    res.status(error.code ||500).json({
      success:false,
      message:error.message
    });
}
}

export {asynchandler};