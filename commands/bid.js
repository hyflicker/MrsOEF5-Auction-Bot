const fs = require('fs')
const wss = require('../websocket/wsServer')
exports.execute = (client,message,channel,tags,self,args,command,db) => {
    let aData = JSON.parse(fs.readFileSync("./data/auctiondata.json"));    
    let auctionInfo = aData.auctionInfo;
    let auctionBidLeader = aData.auctionBidLeader;
    let num = parseFloat(args[0].match(/-?\d+(\.\d{1,2})?/g));
    // console.log("NUM: ", num)
    // console.log(aData)
    if(auctionInfo.active == 1){  
        console.log(auctionBidLeader);
        if(Number.isFinite(num) && (auctionBidLeader.amount == null || num > auctionBidLeader.amount) && num > 0){
            db.execute(`INSERT INTO bids (name, twitchId, auctionId, dupCount,auctionName, amount) VALUES ('${tags['display-name']}', ${tags['user-id']}, ${auctionInfo.auctionID}, ${auctionInfo.dupCount},'${auctionInfo.name}', ?)`, [num], (err,res) => {
                if(err) throw err;
            })
            db.execute(`SELECT * FROM bids WHERE auctionId = ${auctionInfo.auctionID} AND dupCount = ${auctionInfo.dupCount} ORDER BY amount DESC LIMIT 1`, (err, res) => {
                if(err) console.log(err);
                
                let obj = {
                    auctionInfo: auctionInfo,
                    auctionBidLeader : {
                        name : tags['display-name'],
                        dupCount : auctionInfo.dupCount,
                        auctionID : auctionInfo.auctionID,
                        amount: num,
                        bidID : res[0].idbids
                    }
                }
                wss.clients.forEach(function each (ws) {
                    console.log(wss.clients)
                    ws.send(JSON.stringify(obj))
                })
                // console.log(obj)
                fs.writeFileSync("./data/auctionData.json",JSON.stringify(obj), (err) => {
                    if(err) throw err;
                    console.log("Data written to file.")
                });
                client.say(channel,`@${tags['display-name']} is now the highest bidder with a bid of $${num}. ID: ${res[0].idbids}`);
            })
            
            
        }else if(!Number.isFinite(num)){
            switch(args[0].toLowerCase()){
                case "leader":
                    if(auctionBidLeader.name != null || auctionBidLeader.amount != null){
                        client.say(channel,`@${auctionBidLeader.name} is the current bid leader with an amount of $${auctionBidLeader.amount}`);
                    }else{
                        client.say(channel,`There is currently no bids for the auction of ${auctionInfo.name}`);
                    }
                    
                break;
                case "remove":
                    if(tags.mod === true || tags.badges.hasOwnProperty('broadcaster') || tags.username === 'hyflicker'){
                        db.execute(`DELETE FROM bids WHERE idbids = ?`, [args[1]],(err, res) => {
                            if(err) console.log(err);
                            client.say(channel,`Bid ${args[1]} was removed from the system.`);
                            db.execute(`SELECT * FROM bids WHERE auctionId = ${auctionInfo.auctionID} AND dupCount = ${auctionInfo.dupCount} ORDER BY amount DESC LIMIT 1`, (err, res) => {
                                if(err) console.log(err);
                                let amount,bidID,name;
                                if(res.length == 0){
                                    name = null;
                                    amount = null;
                                    bidID = null
                                }else{
                                    name = res[0].name;
                                    amount = res[0].amount;
                                    bidID = res[0].bidID
                                }
                                let obj = {
                                    auctionInfo: auctionInfo,
                                    auctionBidLeader : {
                                        name : name,
                                        dupCount : auctionInfo.dupCount,
                                        auctionID : auctionInfo.auctionID,
                                        amount: amount,
                                        bidID : bidID
                                    }
                                }
                                // console.log(obj)
                                fs.writeFileSync("./data/auctionData.json",JSON.stringify(obj), (err) => {
                                    if(err) throw err;
                                    console.log("Data written to file.")
                                });
                            })
                        })
                    }
                break;
                default:
                    client.say(channel,'Some Ting Wong')
                break;
            }
        }else{
            client.say(channel,`@${tags['display-name']} your bid of $${num} is not higher than the highest bid of $${auctionBidLeader.amount}`);
        }
    }
}