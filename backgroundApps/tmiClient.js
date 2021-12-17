require('dotenv').config();
const db = require('./database')
const tmi = require('tmi.js');
const client = new tmi.Client({
	// options: { debug: true },
	identity: {
		username: 'mrsauctionbot',
		password: process.env.oauth
	},
	channels: [ 'hyflicker' ]
});



client.connect();

client.on('connected',(channel,tags,message,self) =>{
	console.log('**MrsAuction Bot Online**');
})

let prefix = "!"

client.on('message', (channel, tags, message, self) => {
	if(self) return;
    const args = message.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
	if(message.charAt(0) == prefix){
		try{
			let commandFile = require(`../commands/${command}.js`);
			commandFile.execute(client,message,channel,tags,self,args,command,db);
		} catch (err){
			// console.log(err)
		}
	}

});

module.exports = client;