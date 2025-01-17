const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // use this secret!
const User = require('../users/users-model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.post("/register", validateRoleName, (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
      const {username, password} = req.body
      // comes from middleware thats why we put req
      const {role_name} = req 
      const hash = bcrypt.hashSync(password, 8) //2^8

      User.add({username, password: hash, role_name})
        .then(saved =>{
          res.status(201).json(saved)
        })
        .catch(next)
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
  
  if(bcrypt.compareSync(req.body.password, req.user.password)){
    //make it so cookie is set on client and server stores a session with session id
    const token = buildToken(req.user)
    //when I used next the token did not appear!
    res.json({
        message: `${req.user.username} is back!`,
        token
      })
  } else{
    //this invalid is refering to password, the middleware refers to username
    next({
      status: 401,
      message: 'Invalid credentials'
    })
  }
});

//need a helper
function buildToken(user){
  const payload = {
    subject: user.user_id,
    role_name: user.role_name,
    username: user.username,
  }
  const options = {
    expiresIn: '1d',
  }

  return jwt.sign(payload, JWT_SECRET, options)
}

module.exports = router;
