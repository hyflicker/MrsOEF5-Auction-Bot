const WebSocket = require('ws');
const wss = new WebSocket.Server({port : 3031});
const {select,insert,update,sqlDelete} = require('../backgroundApps/simplifiedCRUD');

wss.on('connection', (ws) => {
    // console.log(ws);
    wss.getUniqueID = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4();
    };
    ws.id = wss.getUniqueID();
    wss.clients.forEach(function each(client) {
        // console.log(`Client Id: ` + client.id)
    })
    
    ws.on('message', (clientMessage) => {
        let msg = JSON.parse(clientMessage);
        // console.log("Client Message",msg);
        if(msg.open){
            async function bidData (){
                ws.send(JSON.stringify(await select('bids','ORDER BY idbids DESC LIMIT 20')))
            }
            bidData();
        }else if(msg.rowData){
            sqlDelete('bids',`WHERE name = '${msg.rowData.user}' AND amount = ${msg.rowData.bidAmount} AND auctionName = '${msg.rowData.auctionName}'`)
            .then((res) => {
                if(res.affectedRows > 0){
                    ws.send(JSON.stringify({
                        rowData : msg.rowData,
                        deleted : true
                    }))
                }else{
                    ws.send(JSON.stringify({
                        rowData : msg.rowData,
                        deleted : false
                    }))
                }
            })
        }

        // console.log(bids)
        // ws.send(JSON.stringify(bids));
        // console.log(msg.id)
        // ws.send(JSON.stringify([{user:"Frank",bidAmount : 50.01,auctionName:"Fat Cock Fish"},{user:"Bob",bidAmount:50.02,auctionName:"Fat Cock Fish"}]))
    });
    ws.on('close', () => {
        // console.log('Connection closed');
    });
}) 

module.exports = wss;

console.log('Websocket Server is live!!!')