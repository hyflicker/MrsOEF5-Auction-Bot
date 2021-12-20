const express = require('express');
const crypto = require('crypto-js');
require('dotenv').config();
require('../../websocket/wsServer')
const session = require('express-session');
const MongoStore = require('connect-mongo');
const {select,insert,update,sqlDelete} = require('../simplifiedCRUD');
const path = require('path');
const ejs = require('ejs');
const app = express();
const router = express.Router();
const port = 3030;
const passport = require('passport');
const twitchStrategy = require("passport-twitch").Strategy;
const { default: axios } = require('axios');


//Parsing Middleware
//Parse application/w-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

//Parse application/json
app.use(express.json());

//static files
app.use(express.static(path.join(__dirname,"public")));

//setting rendering engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));



// Use the session middleware
app.use(session({
    secret: `HyFlicker`,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl:`${process.env.mongoURL}`,
        ttl: 1 * 24 * 60 * 60
    })

}))
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req,res) => {
    if(req.user){
        let {profile,user,userId} = sendUser(req);
        res.render('index',{profile,user,userId});
    }else{
        res.render('index')
    }
    
})

app.get('/fail', function (req,res){
    req.session.destroy((err) => {
        if(err)throw err;
        res.render('failedAuth')
    });
    
})



app.get('/:user/dashboard',(req,res) => {
    console.log(req.params)
    if(req.session && req.params.user == req.user.login.toLowerCase()){
        let {profile,user,userId} = sendUser(req);
        res.render('dashboard',{profile,user,userId})
    }else if(req.session){
        res.redirect('/channels')
    }else{
        res.redirect('/')
    }
    
})

function sendUser(req){
    if(req.user){
        let profile = req.user.profile_image_url;
        let user = req.user.display_name;
        let userId = req.user.id;
        return {profile,user,userId}
    }
}

app.get('/:user/channels', (req,res) => {
    if(req.user){
        let {profile,user,userId} = sendUser(req);
        res.render('channelSelect',{profile,user,userId})
    }else{
        res.redirect('/')
    }
    
})

app.get('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err)throw err;
        res.redirect('/');
    });
    
})

app.get('/twitchLogin', (req,res) => {
    res.set('Cache-Control', 'no-store')
    res.redirect(`/auth/twitch`)
})

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

twitchStrategy.prototype.userProfile = function(accessToken, done) {
    axios({
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
          'Client-ID': process.env.clientId,
          'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(res => {
        // console.log("res: ",res.data.data[0])
        if(res && res.status == 200){
            done(null, res.data.data[0]);
        }else{
            done(res.data.data[0]);
        }
    })
};

passport.use('twitch', new twitchStrategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: process.env.clientId,
    clientSecret: process.env.twitchSecret,
    callbackURL: 'http://localhost:3030/auth/twitch/callback',
    state: true
},
function(accessToken, refreshToken,profile,done){
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    done(null,profile);
}
));

// Set route to start OAuth link, this is where you define scopes to request
app.get('/auth/twitch', passport.authenticate('twitch', { 
    scope: 'moderation:read user:read:email openid',
    forceVerify: true
}));

// Set route for OAuth redirect
app.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/api/login', failureRedirect: '/fail' }));

app.get('/api/login', function (req, res) {
    if(req.session && req.session.passport && req.session.passport.user) {
    function redirecter (){
        res.set('Cache-Control', 'no-store')
        res.redirect('/channels');
    }
        let user = req.user;
        // if(user.login != 'hyflicker'){
        //     res.redirect('/fail');
        // }else{
        // db.query(`SELECT * from botuser WHERE twitchId = "${user.id}"`, (err, results) =>{
        //     if(results[0] == undefined){
        //         db.query(`INSERT INTO botuser (twitchId, twitchDisplayName, twitchProfileImage,twitchBio,userAccess, userRefresh) VALUES ("${user.id}", "${user.display_name}", "${user.profile_image_url}", "${user.description}", "${req.user.accessToken}", "${req.user.refreshToken}")`), (err, result) => {
        //             if(err) throw err
        //             console.log(results);
                    
        //         } 
        //     }
            return redirecter();
        // })

        // }
    } else {
        res.set('Cache-Control', 'no-store')
        res.redirect('/fail')
    }
  });








// app.get('/loginauth', (req,res) => {
//     if(req.url.length > 9){
//         let split1 = req.url.split('code=');
//         let code = split1[1].split('&scope=');
//         let state = code[1].split('state=');
//         oauth(`http://localhost:3030/dashboard`,code[0])
//         .then(data => {
//             let accessToken = data.access_token;
//             let refreshToken = crypto.AES.encrypt(data.refresh_token,process.env.hashKey);
//             validate(accessToken)            
//             .then(validation => {
//                 getUser(accessToken)
//                 .then(data => {
//                     // console.log(data)
//                     // console.log(data.id);
//                     req.session.userId = data.id;
//                     req.session.userName = data.display_name;
//                     req.session.profileImage = data.profile_image_url;
//                     // console.log("UserId", req.session.userId);
//                 })
//                 getMods(validation.user_id,accessToken)
//                 .then(data => {
//                     accessToken = crypto.AES.encrypt(accessToken,process.env.hashKey);
//                     select(`user_data`,`WHERE twitchId = ${validation.user_id}`)
//                     .then(userData=>{
//                         if(userData.length > 0){
//                             let oldAccessToken = crypto.AES.decrypt(userData[0].accessToken, process.env.hashKey);
//                             revoke(oldAccessToken.toString(crypto.enc.Utf8)); 
//                             update(`user_data`,`twitchName ='${validation.login}', accessToken = '${accessToken}', refreshToken = '${refreshToken}', expireTime = '${validation.expires_in}', scope = '${JSON.stringify(validation.scopes)}', mods = '${JSON.stringify(data.data)}', timestamp = NOW()`,`WHERE twitchId = '${validation.user_id}'`);
//                         }else{
//                             insert(`user_data`,`twitchId,twitchName,accessToken,refreshToken,expireTime,scope,mods`,`'${validation.user_id}','${validation.login}','${accessToken}','${refreshToken}','${validation.expires_in}','${JSON.stringify(validation.scopes)}','${JSON.stringify(data.data)}'`);
//                         }
//                         // console.log(userData[0]);
//                     })
//                     .catch(err =>{
//                         console.log(err)
//                     })
//                     if(req.session.userId){
//                         res.redirect(`/dashboard/id?channel=${req.session.userId}`)
//                     }else{
//                         res.redirect('/')
//                     }
//                 })
//                 .catch(err => {
//                     console.log(err)
//                 })
                
//             })
//             .catch(err => {
//                 console.log(err)
//             })
//         })
//         .catch(err => {
//             console.log(err)
//         })
//     }
// })

app.get('/:user/profile',(req,res) =>{
    if(req.user && req.user.login.toLowerCase() == req.params.user.toLowerCase()){
        let {profile,user,userId} = sendUser(req);
        res.render('profile',{profile,user,userId})
    }
})

app.get('/:user', (req,res) =>{
    if(req.user && req.user.login.toLowerCase() == req.params.user.toLowerCase()){
        res.redirect(`/${req.params.user.toLowerCase()}/profile`)
    }else if(req.params.user.toLowerCase() == 'fail'){
        res.render(`failedAuth`)
    }else{
        res.redirect(`/`);
    }
})

app.listen(port,err => {
    if(err){
        return console.log("Error",err);
    }
    console.log(`Express server is now live on port ${port}!`)
})
