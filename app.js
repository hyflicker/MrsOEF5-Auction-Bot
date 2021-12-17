require('./backgroundApps/tmiClient');
require('./backgroundApps/siteManagement/expressServer');
                                                                              
                                                                              
                                                                    



// async function select(table,WHERE){
//     let data = new Promise ((resolve,reject) => {
//         db.execute(`SELECT * FROM ${table} WHERE ${WHERE}`, (err,results) => {
//             if(err)reject(err);
//             if(results.length > 0 && table == 'auctions'){
//                 let auctionData = {
//                     name : results[0].name,
//                     dupCount : results[0].dupCount,
//                     auctionID : results[0].id,
//                     active : results[0].active
//                 }
//                 return resolve(auctionData);
//             }else if(results.length > 0 && table == 'bids'){
//                 let auctionData = {
//                     name : results[0].name,
//                     dupCount : results[0].dupCount,
//                     auctionID : results[0].auctionId,
//                     amount : results[0].amount.toFixed(2),
//                 }
//                 return resolve(auctionData);
//             }else{
//                 let obj = {
//                     name : "",
//                     dupCount : 0,
//                     auctionID : 0,
//                     active : 0
//                 }
//                 return resolve(obj);
//             }
//         })
//     })
//     return data.then(res => {
//         return res
//     })
//     .catch (err => {
//         return err;
//     })
// }
// function writeFile (fileName, obj){
//     let write = new Promise ((resolve,reject) => {
//         fs.writeFile(fileName,JSON.stringify(obj), (err) => {
//             if(err)reject(err)
//             resolve(obj);
//         })
//     })
//     return write.then(res =>{
//         return res;
//     }).catch (err => {
//         return err;
//     })
// }

