class ApiResponse {
    constructor(statusCode,data,message="Success"){
        this.statusCode=statuscode,
        this.message=message,
        this.data=data,
        this.success=statusCode<400
    }
}
exports {ApiResponse};