var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = mongo.MongoClient;
var url = 'mongodb://localhost:27017/beedb';

var crypto = require('crypto');
//单元测试
var assert = require('assert');
function Group(group) {
    this.name = group.name;
    this.members = group.members
    this.mail = group.mail
};
//存储用户组
Group.prototype.save = function(callback) {
    //要存入数据库的用户组文档
    var group = {
        name: this.name,
        members: this.members,
        mail: this.mail
    };
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('groups').insertOne(group, function(err, result) {
            if (err) throw err;
            callback(err, result.ops);
            db.close();
        });
    });
};
//获取单个用户组
Group.getByName = function(name, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('groups').findOne({
            name: name
        }, function(err, note) {
            assert.equal(null, err);
            callback(err, note);
            db.close();
        });
    });
};
//删除用户组
Group.delete = function(id, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('groups').findOneAndDelete({
            _id: new ObjectId(id)
        }, function(err, r) {
            assert.equal(null, err);
            callback(err);
            db.close();
        });
    });
};
//存储用户组
Group.put = function(id, group, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('groups').findOneAndUpdate({
            _id: new ObjectId(id)
        }, {
            $set: group
        }, {
            returnOriginal: false,
            upsert: true
        }, function(err) {
            assert.equal(null, err);
            callback(err);
            db.close();
        });
    });
};

//读取用户组
Group.getAll = function(callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('groups').find().toArray(function(err,docs){
            if (err) throw err;
            callback(err,docs);
            db.close();
        })
    });
};

module.exports = Group;