const db = require('./database')

function select(table,where=""){
    let sel = new Promise ((resolve,reject) => {
        db.execute(`SELECT * FROM ${table} ${where}`, (err,results) => {
            if(err) reject(err);
            resolve(results);
        })
    })
    return sel;
    
}

function insert(table,columns,values) {
    let ins = new Promise ((resolve,reject) => {
        db.execute(`INSERT INTO ${table} (${columns}) VALUES (${values})` ,(err,res) => {
            if(err) reject(err);
            resolve(res);
        })
    })
    return ins;
}

function update(table,column_and_values,where =""){
    let upd = new Promise ((resolve, reject) => {
        db.execute(`UPDATE ${table} SET ${column_and_values} ${where}`, (err,res)=> {
            if(err) reject(err)
            resolve(res);
        })
    })
    return upd;    
}

function sqlDelete(table,where=""){
    let del = new Promise ((resolve,reject)=> {
        db.execute(`DELETE FROM ${table} ${where}`, (err,res) => {
            if(err)reject(err);
            resolve(res);
        })
    })
    return del;
}

module.exports = {
    select,
    insert,
    update,
    sqlDelete
}