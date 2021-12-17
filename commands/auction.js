exports.execute = async (client, message, channel, tags, self, args, command,db) => {
    const fs = require('fs')
    // console.log("auction")
    let param = args[0];
    args.shift();
    let auctionName = args.join(' ');
    // console.log(param.toLowerCase())
    let aData = JSON.parse(fs.readFileSync("./data/auctiondata.json"));
    switch (param.toLowerCase()){
        case "start":
            let start = new Promise(function(resolve,reject){  
                if(auctionName.length > 25 && (tags.mod === true || tags.badges.hasOwnProperty('broadcaster') || tags.username === 'hyflicker')){ return errorReject("Auction Name Length Too Long/not a mod or broadcaster",1,reject)}
                db.execute(`SELECT * FROM auctions WHERE active = 1`,(err,results) =>{
                    errorReject(err,2,reject)
                    if(results.length == 0 || results[0].active == 0){
                        if(auctionName.length > 0){
                            db.execute(`SELECT * FROM auctions WHERE name = ?`, [auctionName],(err,results,fields) => {
                                errorReject(err,2,reject)
                                if(results.length == 0){
                                    updateOpen(reject);
                                    db.execute(`INSERT INTO auctions (name) VALUES (?)`,[auctionName], (err,results) => {
                                        errorReject(err,3,reject)
                                        db.execute(`SELECT * FROM auctions WHERE name = ?`, [auctionName],(err,results,fields) => {
                                            errorReject(err,2,reject)
                                            resolve(startReturnObject(results[0], "LAO"))
                                        })
                                    })
                                }else{
                                    updateOpen(reject);
                                    setStart(results[0],resolve,reject);
                                }
                            })
                        }else{
                            db.execute(`SELECT * FROM auctions WHERE open = 1`,(err, res) => {
                                errorReject(err,2,reject)
                                if(res.length > 0){
                                    // console.log("There is an Auction Open");
                                    setStart(res[0],resolve,reject,res[0].name);
                                }else{
                                    // console.log("No Auctions Open");
                                    resolve(startReturnObject(res,{position: "NAO"}));
                                }
                            })
                        } 
                    }else{
                        resolve({position: "CAS", name : results[0].name, dupCount : results[0].dupCount})
                    }  
                })
            })
                start.then(results => {
                    // console.log(results);
                    // console.log(results.position);
                    let mod = "";
                    if(results.dupCount > 0){
                        mod = results.dupCount;
                    }
                    switch(results.position){
                        case "LAO":
                            client.say(channel,`Auction ${results.name}${mod} is now open! Run !bid and an amount to place a bid for this auction!`);
                            let obj = {
                                auctionInfo: {
                                    name : results.name,
                                    dupCount : results.dupCount,
                                    auctionID : results.id,
                                    active : results.active
                                },
                                auctionBidLeader : {
                                    name : null,
                                    dupCount : 0,
                                    auctionID : 0,
                                    amount: null,
                                    bidID : 0
                                }
                            }
                            // console.log(obj)
                            fs.writeFileSync("./data/auctionData.json",JSON.stringify(obj), (err) => {
                                if(err) throw err;
                                // console.log("Data written to file.")
                            });
                            break;
                        case "NAO":
                            client.say(channel,`There are no auctions open at this time. Please add in a name or run !auction set with a name.`)
                            break;
                        case "CAS":
                            client.say(channel,`Auction ${results.name}${mod} is currently running. Please run !auction stop to end the auction before starting another auction.`)
                            break;
                        default:
                            client.say(channel,`Unhandled Error please notify HyFlicker.`)
                            break;
                    }
                })
                .catch(err =>{
                    console.log(err)
                })


            break;
        case "stop":
            if(tags.mod === true || tags.username === 'hyflicker' || tags.badges.hasOwnProperty('broadcaster') ){
                db.execute(`SELECT * FROM auctions WHERE active = 1`, (err,results) => {
                    if(err){ return console.error(err)};
                    // console.log(results)
                    if(results.length > 0){
                        if(aData.auctionBidLeader.name != null){
                            client.say(channel,`Auction ${results[0].name} is now closed. @${aData.auctionBidLeader.name} won with a bid of $${aData.auctionBidLeader.amount}`)
                        }else{
                            client.say(channel,`Auction ${results[0].name} is now closed. Unfortunately there were no bid submissions. So there is no winner...`);
                        }
                        
                        db.execute(`UPDATE auctions SET open = 0, active = 0`, (err,res) =>{
                            if(err){ return console.error(err)};
                        
                        })
                        let obj = {
                            auctionInfo: {
                                name : null,
                                dupCount : 0,
                                auctionID : 0,
                                active : 0
                            },
                            auctionBidLeader : {
                                name : null,
                                dupCount : 0,
                                auctionID : 0,
                                amount: null,
                                bidID : 0
                            }
    
                        }
                        fs.writeFileSync("./data/auctionData.json",JSON.stringify(obj), (err) => {
                            if(err) throw err;
                            console.log("Data Emptied")
                        })
                    }else{
                        client.say(channel,`There are no Auctions currently active.`)
                    }
                })
            }
            break;
        case "set":
            if(tags.mod === true || tags.badges.hasOwnProperty('broadcaster') || tags.username === 'hyflicker'){
            setAuction(auctionName)
            .then(results => {
                // console.log("Results: ",results)
                let setOpenAuction = new Promise ((resolve, reject) =>{
                    if(results !== undefined && results != "NTL" && results != "NNG"){
                        updateOpen(reject);
                        return resolve(dbSetOpen(results.name,results))
                        
                    }else if(results == "NTL"){
                        return errorReject("Auction Name Length Too Long",1,reject)
                    }else if(results == "NNG"){
                        return errorReject("No Name Given",5,reject)
                    }else{
                        // console.log("here")
                        return resolve(insertNewAuction(auctionName))
                    }
                })
                setOpenAuction.then(res => {
                    // console.log("sOA.Then",res)
                    client.say(channel, `Auction ${res.name} is now set to be open. Please run !auction start when auction is ready to start!`)
                })
                .catch(err =>{
                    console.log(err)
                    switch (err.Code){
                        case 1:
                            client.say(channel,`Name is too long. Max name length is 25. Please give it another name and try again.`)       
                            break;
                        case 5:
                            client.say(channel,`Please enter an auction name to set when running this command.`)
                            break;
                        default:
                            client.say(channel,`Unhandled Error please notify HyFlicker.`)
                            break;
                    }
                })

            })
            .catch((err) =>{
                console.log(err);
            })
            }
            break;
            case "item":
                if(aData.auctionInfo.name != null){
                    client.say(channel,`The current auction is ${aData.auctionInfo.name}`)
                }else{
                    client.say(channel,`There is currently no auction live at this time.`)
                }
                
            break;
        default:
            client.say(channel,`Unhandled Error please notify HyFlicker.`)
            break;
    }

    function errorReject(err,Code,reject){
        if(err) {
            return reject({
                Error : err,
                position : "Err",
                Code : Code
            });
        }
    }
    
    function insertNewAuction (aName,activeBool = 0){
        let insert = new Promise((resolve,reject) => {
            db.execute(`INSERT INTO auctions (name,active) VALUES (?,?)`,[aName,activeBool], (err,results) => {
                errorReject(err,3,reject);
                resolve(dbSelect(aName));
            })      
        }) 
        return insert;
    }

    function updateOpen(reject){
        db.execute(`UPDATE auctions SET open = 0`,(err, results) =>{
            errorReject(err,4,reject)
        })
    }

    async function setAuction(aName){
        if(aName.length > 0 && aName.length < 26){
            const result = await dbSelect(aName)
            return result;
        }else if(aName.length > 25){
            // console.log("NTL")
            return "NTL"
        }else{
            return "NNG"
        }
    }

    function dbSelect(aName){
        let getResults = new Promise ((resolve,reject) => {
            db.execute(`SELECT * FROM auctions WHERE name = ?`,[aName],(err,results) =>{
                errorReject(err,2,reject);
                resolve(results[0])
            })
        })
        return getResults;
    }

    function dbSetOpen(aName,results){
        let set = new Promise((resolve,reject) => {
            db.execute(`UPDATE auctions SET open = 1, dupCount = ${results.dupCount + 1} WHERE name = ?`, [aName],(err,results) => {
                errorReject(err,4,reject);
                resolve(dbSelect(aName));
            })
        })
        return set;
    }



    function setStart(res,resolve,reject,aName = auctionName){
        
        db.execute(`UPDATE auctions SET active = 1, open = 1, dupCount = ${res.dupCount + 1} WHERE name = ?`,[aName], (err,results)=>{
            errorReject(err,4,reject)
            res.active = 1; 
            res.open = 1;
            res.dupCount = res.dupCount + 1;
            resolve(startReturnObject(res,"LAO"))
        })
    }
    function startReturnObject (results,position){
        if(results.length == 0){
            return position;
        }
        let obj = {
            name : results.name,
            id : results.id,
            active : results.active,
            open : results.open,
            dupCount : results.dupCount,
            position : position
        }
        return obj

    }

    // function getDBResults(dbName) {
    //     return new Promise((resolve,reject) => {
    //         db.execute(`SELECT * FROM auctions WHERE name = ?`, [dbName],(err,results,fields) => {
    //             if(err) reject(err);
    //             db.execute(`UPDATE auctions SET active = 0, open = 0`,(err,res) => {
    //                 if(err) return reject(err);
    //             })
    //             if (err) return reject(err);
    //             if(results.length >= 1){
    //                 let data = results[0];
    //                 let dpCount = results[0].dupCount + 1;
    //             db.execute(`UPDATE auctions SET open = 1, dupCount = ${dpCount}, timestamp = NOW() WHERE name = '${results[0].name}'`, (err,res) => {
    //                 if(err) return reject(err);
    //             })
    //                 return resolve({
    //                     id: data.id,
    //                     name: data.name,
    //                     dupC: data.dupCount
    //                 });
    //             }else if(results.length <= 0){
    //                 db.execute(`INSERT INTO auctions (name) VALUES (?)`,[dbName], (err,results) => {
                        
    //                     if (err) {return reject(err)};
    //                     return resolve({
    //                         id: results.insertId,
    //                         name: dbName,
    //                         dupC: 0
    //                     });
    //                 })
    //             }else{
    //                 return reject(null);
    //             }
                
    //         })      
    //     })
    // }

    // function getOpenResults(aName){
    //     return new Promise((resolve,reject) =>{
    //         if(aName.length < 1){
    //             db.execute(`SELECT * FROM auctions WHERE open = 1`,(err,results,fields) => {
    //                 if(err) reject(err);
    //                 console.log(results);
    //                 if(results.length > 0){
    //                     let openAuctionData = results[0];
    //                     if(openAuctionData.active == 0){
    //                         db.execute(`UPDATE auctions SET active = 1, timestamp = NOW() WHERE id = '${openAuctionData.id}'`,(err,res)=> {
    //                             if(err) return reject(err);
    //                             //Tell the bid command that Auction has started and can now start accepting bids
    //                             client.say(channel,`Auction ${openAuctionData.name} has started!`)
    //                             return resolve(openAuctionData);
    //                         })                      
    //                     }
    //                 }else{
    //                     client.say(channel,`There is not an Auction set at this time.`);
    //                     return resolve(openAuctionData);
    //                 }
    //             })
    //         }else{
    //             let data = getDBResults(aName);
    //             console.log(data)

    //         }
    //     })
    // }

    // async function setAuction(){
    //     if(args.length != 0){
    //         try{
    //             data = await getDBResults(auctionName);
    //             let aName;
    //             if(data.dupC <= 0){
    //                 aName = data.name
    //             }else{
    //                 aName = data.name + data.dupC;
    //             }
    //                 client.say(channel,`Auction ${aName} has now been set. Run "!auction start" when ready to start auction.`);
    //             return data;
    //         }catch(err){
    //             if(err.code == 'ER_DATA_TOO_LONG'){
    //                 client.say(channel,`Name is too long! Please try a differnt name.`)
    //             }
    //         }
    //     }else{
    //         client.say(channel, `Please try again and give the auction a name.`)
    //     }
    // }
    // function startAuction(dbName){
    //         if(args <= 0){
    //             try{
    //                 let data = getDBResults(dbName);
    //                 let aName;
    //                 if(data.dupC <= 0){
    //                     aName = data.name
    //                 }else{
    //                     aName = data.name + data.dupC;
    //                 }
    //                     client.say(channel,`Auction ${aName} has now started.`);
    //                     return resolve(data);
    //             }catch(err){
    //                 if(err.code == 'ER_DATA_TOO_LONG'){
    //                     client.say(channel,`Name is too long! Please try a differnt name.`)
    //                     return reject(err.code);
    //                 }
    //             }
    //         }
    // }
}