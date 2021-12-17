const axios = require('axios')
const {select,insert,update,sqlDelete} = require('./simplifiedCRUD');
const fetch = require('node-fetch');
require('dotenv').config();

function oauth(redirect_URI,code){
    let auth = new Promise((resolve,reject) => {
        fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.clientId}&client_secret=${process.env.twitchSecret}&grant_type=authorization_code&redirect_uri=${redirect_URI}&code=${code}`, {
            method: 'post'
        })
        .then((response) => {
            if(response.ok) {
                resolve(response.json());
            } else {
                reject(response);
            }
          })
    })
    return auth;
}

function validate(accessToken){
    let valid = new Promise ((resolve,reject) => {
        fetch(`https://id.twitch.tv/oauth2/validate`,{
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if(response.ok){
                resolve(response.json());
            }else{
                reject(response);
            }
        })
    })
    return valid;
}

function getMods(twitchId,accessToken){
    let getMod = new Promise ((resolve,reject) => {
        fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${twitchId}`,{
            method : 'GET',
            headers : {
                "Authorization" : `Bearer ${accessToken}`,
                "Client-Id" : process.env.clientId
            }
        })
        .then(response => {
            if(response.ok){
                resolve(response.json());
            }else{
                reject(response);
            }
        })
    })
    return getMod;
}

function getUser(accessToken){
    let getUserData = new Promise ((resolve,reject) => {
        // fetch(`https://api.twitch.tv/helix/users`, {
        //     method : 'GET',
        //     headers : {
        //         Authorization : `Bearer ${accessToken}`,
        //         'Client-Id' : process.env.clientId,
        //         "Content-Type" : "application/json"
        //     }
        // })
        // .then(res => {
        //     console.log(res.body)
        //     resolve(res);
        // })
        axios({
            method : "GET",
            headers : {
                Authorization : `Bearer ${accessToken}`,
                'Client-Id' : process.env.clientId,
            },
            url : 'https://api.twitch.tv/helix/users'
        })
        .then((response) => {
            // select()
            resolve(response.data.data[0])
        })
    })

    return getUserData;
}

function revoke(accessToken) {
    let revokeToken = new Promise((resolve,reject) => {
        fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${process.env.clientId}&token=${accessToken}`,{
            method : 'POST',
        })
        .then(response => {
            if(response.ok){
                resolve(response);
            }else{
                reject(response);
            }
        })
    })
    return revokeToken
}

module.exports = {
    oauth,
    validate,
    getMods,
    revoke,
    getUser
}