var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = mongo.MongoClient;
var url = 'mongodb://localhost:27017/beedb';
//单元测试
var assert = require('assert');
//事件
function Note(note) {
    this.id = note.id,
    this.user = note.user;
    this.type = note.type;
    this.title = note.title;
    this.remark = note.remark;
    this.status = note.status;
    this.start = note.start;
    this.end = note.end;
};
//保存一项工作
Note.prototype.save = function(callback) {
    var note = {
        id: this.id,
        user: this.user,
        type: this.type,
        title: this.title,
        remark: this.remark,
        status: this.status,
        start: this.start,
        end: this.end
    };
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').insertOne(note, function(err, r) {
            assert.equal(null, err);
            callback(err);
            db.close();
        });
    });
};

//保存多项工作
Note.saveAll = function(array,callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').insertMany(JSON.parse(array), function(err, r) {
            assert.equal(null, err);
            callback(err,r.insertedCount);
            db.close();
        });
    });
};

//获取单个工作记录
Note.get = function(id, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').findOne({
            _id: new ObjectId(id)
        }, function(err, note) {
            assert.equal(null, err);
            callback(err, note);
            db.close();
        });
    });
};
//获取所有工作记录
Note.getAll = function(user, start, end, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').find({
            user: user,
            start: {
                "$gte": start,
                "$lte": end
            }
        }).toArray(function(err, notes) {
            if (err) throw err;
            callback(null, notes);
            db.close();
        });
    });
};
//获取所有工作记录
Note.getRencently = function(user, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').find({
            user: user,  
        }).sort({start:-1}).limit(10).toArray(function(err, notes) {
            if (err) throw err;
            callback(null, notes);
            db.close();
        });
    });
};


//删除工作记录
Note.remove = function(id, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').findOneAndDelete({
            _id: new ObjectId(id)
        }, function(err, r) {
            assert.equal(null, err);
            callback(err);
            db.close();
        });
    });
};
//删除多条工作记录
Note.removeMany = function(idArray, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').remove({
            id: {
                $in:JSON.parse(idArray)
            }
        },{}, function(err, r) {
            assert.equal(null, err);
            callback(err,r.result.n);
            db.close();
        });
    });
};
//更新指定的记录
Note.update = function(id, type, title, remark, status, start, end, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('notes').findOneAndUpdate({
            _id: new ObjectId(id)
        }, {
            $set: {
                type: type,
                title: title,
                remark: remark,
                status: status,
                start: start,
                end: end
            }
        }, {
            returnOriginal: false,
            upsert: true
        }, function(err) {
            assert.equal(null, err);
            callback(err);
            db.close();
        });
    });

}

module.exports = Note;