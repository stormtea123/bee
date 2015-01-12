var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = mongo.MongoClient;
var url = 'mongodb://localhost:27017/beedb';

var crypto = require('crypto');
//单元测试
var assert = require('assert');
function User(user) {
    this.name = user.name;
    this.fullname = user.fullname;
    this.password = user.password;
    this.email = user.email;
};
User.getUsers = function(keyword, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('users').find({
            name:{
                $regex:keyword
            }
        },{
            "_id": 0,
            "password": 0
        }).toArray(function(err,result){
            if (err) throw err;
            callback(err, result);
            db.close();
        })
    });
};
//存储用户信息
User.prototype.save = function(callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    //要存入数据库的用户信息文档
    var user = {
        name: this.name,
        fullname: this.fullname,
        password: this.password,
        email: this.email,
        head: head
    };
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('users').insertOne(user, function(err, result) {
            if (err) throw err;
            callback(err, result.ops);
            db.close();
        });
    });
};

//读取用户信息
User.get = function(name, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('users').find({
            name: name
        }).toArray(function(err,docs){
            if (err) throw err;
            callback(err,docs);
            db.close();
        })
    });
};

module.exports = User;