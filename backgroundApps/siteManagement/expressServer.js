const express = require('express');
const uuid = require('uuid');
const fetch = require('node-fetch')
const crypto = require('crypto-js');
require('dotenv').config();
require('../../websocket/wsServer')
let session = require('express-session');
const {oauth,validate,getMods, revoke, getUser} = require('../simplifiedFetch');
const {select,insert,update,sqlDelete} = require('../simplifiedCRUD');
const path = require('path');
const ejs = require('ejs');
const app = express();
const router = express.Router();
const port = 3030;

// console.log(uuid.v5.URL)
// Use the session middleware
app.use(session({
    secret: `HyFlicker`,
    genid : function(req){
        return uuid.v5.URL
    },
    resave: false,
    saveUninitialized: true,
    cookie : {
        maxAge : 4.32e+7,
        // sameSite : true,
        name : "Logged In"
    },

}))
//Parsing Middleware
//Parse application/w-www-form-urlencoded
app.use(express.urlencoded({extended: false}));

//Parse application/json
app.use(express.json());

//static files
app.use(express.static(path.join(__dirname,"public")));

//setting rendering engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

app.get('/', (req,res) => {
    // console.log(req.session)
    res.render('index')
})
app.get('/dashboard/:id',(req,res) => {
    console.log(req.session)
    if(req.session.userId){
        res.render('dashboard')
    }else{
        res.redirect('/')
    }
    
})

function sendUser(req){
    let profile = req.session.profileImage
    let user = req.session.userName
    return {profile,user}
}

app.get('/channelselect', (req,res) => {
    if(req.session.userId){
        let data = sendUser(req)
        res.render('channelSelect',{user:data.user,profile:data.profile})
    }else{
        res.redirect('/')
    }
    
})

app.get('/api/user', (req,res) =>{
    if(req.session.userId){
        let data = select(`user_data`,`WHERE twitchId = ${req.session.userId}`);
        res.send(data);
    }
})

app.get('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err)throw err;
        res.redirect('/');
    });
    
})

app.get('/loginauth', (req,res) => {
    if(req.url.length > 9){
        let split1 = req.url.split('code=');
        let code = split1[1].split('&scope=');
        let state = code[1].split('state=');
        oauth(`http://localhost:3030/dashboard`,code[0])
        .then(data => {
            let accessToken = data.access_token;
            let refreshToken = crypto.AES.encrypt(data.refresh_token,process.env.hashKey);
            validate(accessToken)            
            .then(validation => {
                getUser(accessToken)
                .then(data => {
                    // console.log(data)
                    // console.log(data.id);
                    req.session.userId = data.id;
                    req.session.userName = data.display_name;
                    req.session.profileImage = data.profile_image_url;
                    // console.log("UserId", req.session.userId);
                })
                getMods(validation.user_id,accessToken)
                .then(data => {
                    accessToken = crypto.AES.encrypt(accessToken,process.env.hashKey);
                    select(`user_data`,`WHERE twitchId = ${validation.user_id}`)
                    .then(userData=>{
                        if(userData.length > 0){
                            let oldAccessToken = crypto.AES.decrypt(userData[0].accessToken, process.env.hashKey);
                            revoke(oldAccessToken.toString(crypto.enc.Utf8)); 
                            update(`user_data`,`twitchName ='${validation.login}', accessToken = '${accessToken}', refreshToken = '${refreshToken}', expireTime = '${validation.expires_in}', scope = '${JSON.stringify(validation.scopes)}', mods = '${JSON.stringify(data.data)}', timestamp = NOW()`,`WHERE twitchId = '${validation.user_id}'`);
                        }else{
                            insert(`user_data`,`twitchId,twitchName,accessToken,refreshToken,expireTime,scope,mods`,`'${validation.user_id}','${validation.login}','${accessToken}','${refreshToken}','${validation.expires_in}','${JSON.stringify(validation.scopes)}','${JSON.stringify(data.data)}'`);
                        }
                        // console.log(userData[0]);
                    })
                    .catch(err =>{
                        console.log(err)
                    })
                    if(req.session.userId){
                        res.redirect(`/dashboard/id?channel=${req.session.userId}`)
                    }else{
                        res.redirect('/')
                    }
                })
                .catch(err => {
                    console.log(err)
                })
                
            })
            .catch(err => {
                console.log(err)
            })
        })
        .catch(err => {
            console.log(err)
        })
    }
})

app.listen(port,err => {
    if(err){
        return console.log("Error",err);
    }
    console.log(`Express server is now live on port ${port}!`)
})
