var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = mongo.MongoClient;
var url = 'mongodb://localhost:27017/beedb';

//单元测试
var assert = require('assert');
function Record(record) {
};
//存储导入记录
Record.save = function(record,callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('records').insertOne(record, function(err, result) {
            if (err) throw err;
            callback(err);
            db.close();
        });
    });
};
//获取单个工作记录
Record.get = function(id, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('records').findOne({
            _id: new ObjectId(id)
        }, function(err, doc) {
            assert.equal(null, err);
            callback(err, doc);
            db.close();
        });
    });
};

//删除导入的记录
Record.remove = function(id, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('records').findOneAndDelete({
            _id: new ObjectId(id)
        }, function(err, r) {
            assert.equal(null, err);
            callback(err);
            db.close();
        });
    });
};
//存储导入记录
Record.getAll = function(callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('records').find().toArray(function(err,docs){
            if (err) throw err;
            callback(err,docs);
            db.close();
        })
    });
};


module.exports = Record;