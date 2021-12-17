const mysql = require('mysql2');
const dbConfig ={
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'auctionbot'
  };

let db;

function handleDisconnect() {
    db = mysql.createConnection(dbConfig);

    db.connect(function(err) {
        if(err){
            console.error('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
    });

    db.on('error', function(err){
        // console.log('db error', err);
        if(err.fatal == true){
            handleDisconnect();
        }
    });
    module.exports = db;
}

handleDisconnect();

