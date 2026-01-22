# DevFinder APIs
authRouter
 - POST /signupx
 - POST /login
 - post /logout

ProfileRouter
 - GET /profile/view
 - PATCH /profile/edit
 - PATCH /profile/password
 -
connectonRequestRouter
 - POST  /request/send/:status/:userId

 - POST /request/review/accepted/:requestId
 - POST /request/review/rejected/:requestId


userRouter
 - GET /user /connections
 - GET /user/requests/reveived
 - GET /user/feed - Get you the profile of other persons

Status: ignore, interested, accepted, rejected;
