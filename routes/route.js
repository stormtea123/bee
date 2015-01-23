// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;
var crypto = require('crypto'),
    User = require('../models/user.js'),
    Group = require('../models/group.js'),
    Note = require('../models/note.js'),
    Record = require('../models/record.js');
//配置邮件服务
var nodemailer = require('nodemailer');
// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    auth: {
        user: 'stormtea@qq.com',
        pass: '123'
    }
});

module.exports = function(app) {
    app.get('/', checkLogin);
    app.get("/", function(req, res) {
        res.render("index", {
            title: "首页",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });
    app.get('/reg', checkNotLogin);
    app.get("/reg", function(req, res) {
        res.render('reg', {
            layout: false,
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function(req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        //检验用户两次输入的密码是否一致
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致!');
            return res.redirect('/reg'); //返回主册页
        }
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            fullname: req.body.fullname,
            password: password,
            email: req.body.email
        });
        //检查用户名是否已经存在 
        User.get(newUser.name, function(err, userResult) {
            if (userResult.length>0) {
                req.flash('error', '用户已存在!');
                return res.redirect('/reg'); //返回注册页
            }
            //如果不存在则新增用户
            newUser.save(function(err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg'); //注册失败返回主册页
                }
                req.session.user = user[0]; //用户信息存入 session
                req.flash('success', '注册成功!');
                res.redirect('/'); //注册成功后返回主页
            });
        });

    });
    app.get('/login', checkNotLogin);
    app.get('/login', function(req, res) {
        res.render('login', {
            layout: false,
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function(err, userResult) {
            if (userResult.length<1) {
                req.flash('error', '用户不存在!');
                return res.redirect('/login'); //用户不存在则跳转到登录页
            }
            //检查密码是否一致
            if (userResult[0].password != password) {
                req.flash('error', '密码错误!');
                return res.redirect('/login'); //密码错误则跳转到登录页
            }
            //用户名密码都匹配后，将用户信息存入 session
            req.session.user = userResult[0];
            req.flash('success', '登陆成功!');
            res.redirect('/'); //登陆成功后跳转到主页
        });
    });
    //退出
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('sucess', '登出成功！');
        res.redirect('/login'); //等出成功后跳转到主页
    });
    //统计中心
    app.get('/analysis', checkLogin);
    app.get("/analysis", function(req, res) {
        res.render("analycis", {
            title: "统计中心"
        });
        //code here ...
    });
    //获取用户组
    app.get('/api/getGroups', function(req, res) {
        var data = {};
        Group.getAll(function(err, groups){
            if (err){
                //req.flash('error', err);
                data.list = [];
            } else {
                //req.flash('success', '保存成功');
                data.list = groups;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //保存用户组
    app.get('/api/getGroupByName', function(req, res) {
        var data = {};
        Group.getByName(req.param('name'),function(err, groupObject){
            if (err){
                data = {};
            } else {
                data = groupObject;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //保存用户组
    app.post('/api/group', function(req, res) {
        var newGroup = new Group({
            name:req.body.name,
            members:req.body.members,
            mail:req.body.mail
        });
        newGroup.save(function(err, groups){
            if (err) {
                //req.flash('error', err);
                status = 'error';
            } else {
                //req.flash('success', '保存成功');
                status = 'success';
            }
            //返回jsonp状态
            var data = {
                status: status
            };
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //更新用户组
    app.put('/api/group', function(req, res) {
        var willSave = {
            name:req.body.name,
            members:req.body.members,
            mail:req.body.mail
        };
        var data = {};
        Group.put(req.param('_id'),willSave,function(err, groupObject){
            if (err){
                //req.flash('error', err);
                data = {};
            } else {
                //req.flash('success', '保存成功');
                data = groupObject;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //删除用户组
    app.delete('/api/group', function(req, res) {
        Group.delete(req.param("_id"),function(err, groups){
            if (err) {
                //req.flash('error', err);
                status = 'error';
            } else {
                //req.flash('success', '保存成功');
                status = 'success';
            }
            //返回jsonp状态
            var data = {
                status: status
            };
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //获取集合
    app.get('/api/getUsers', function(req, res) {
        var data = {};
        User.getUsers(req.param('keyword'),function(err, users){
            if (err){
                //req.flash('error', err);
                data.list = [];
            } else {
                //req.flash('success', '保存成功');
                data.list = users;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //发送单用户邮件
    app.get('/api/userToMail', function(req, res) {
        var fullname = req.param('fullname');
        var user = req.param('userName');
        var start = req.param('start');
        var end = req.param('end');
        var mailTo = req.param('mail')||"";
        var type = ["工作需求","自主学习","其它"];
        var statusNote = ["未完成","进行中","已完成"];
        var willSend = '<table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px; border-collapse:collapse;border:1px solid #ddd; line-height:1.5; color:#666;"><caption style="padding:7px 0; color:#000; line-height:1;">'+fullname+'周报('+start+'至'+end+')</caption><thead><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:60px;">姓名</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;">任务</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:270px">时间段</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:60px;">本周耗时</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:60px;">状态</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:180px;">备注</th></thead><tbody style="font-size:12px;">';
        Note.getAll(user,start,end,function(err, notes){
            var archiveData = notes;
            var len = archiveData.length;
            for (var i=0; i<len; i++){
                if (i==0){
                    willSend += '<tr><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;" rowspan="'+len+'">'+archiveData[i].user+'</td><td style="padding:3px 5px; border:solid 1px #ddd; background:#FCF2E0;">'+archiveData[i].title+'('+type[Number(archiveData[i].type)-1]+')</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].start+'至'+archiveData[i].end+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+((new Date(archiveData[i].end).getTime()-new Date(archiveData[i].start).getTime())/(1000*60*60)).toFixed(2)+'小时</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+statusNote[Number(archiveData[i].status)-1]+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].remark+'</td></tr>';
                } else {
                    willSend += '<tr><td class="archive-task" style="padding:3px 5px; border:solid 1px #ddd; background:#FCF2E0;">'+archiveData[i].title+'('+type[Number(archiveData[i].type)-1]+')</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].start+'至'+archiveData[i].end+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+((new Date(archiveData[i].end).getTime()-new Date(archiveData[i].start).getTime())/(1000*60*60)).toFixed(2)+'小时</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+statusNote[Number(archiveData[i].status)-1]+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].remark+'</td></tr>';
                }
            }
            startSend();
        });
        function startSend(){
            willSend += '</tbody></table>';
            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: '李金标 <stormtea@qq.com>', // sender address
                to: mailTo, // list of receivers
                //cc: '1280597658@qq.com', // list of receivers
                subject: fullname+'周报('+start+'至'+end+')', // Subject line
                text: start+'至'+end, // plaintext body
                html: willSend+'<p style="margin:0; padding:7px; line-height:1; text-align:center; font-size:12px; color:#999; ">本邮件由小蜜蜂报表系统自动发送</p>'
            };
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Message sent: ' + info.response);
                }
                transporter.close();

            });
        }
        //返回jsonp状态
        var data = {
            status: "success"
        };
        res.header("Content-Type", "application/json; charset=utf-8");
        res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
        res.end();

    });
    //发送用户组邮件
    app.get('/api/groupToMail', function(req, res) {
        var groupName = req.param('groupName');
        var start = req.param('start');
        var end = req.param('end');
        var type = ["工作需求","自主学习","其它"];
        var statusNote = ["未完成","进行中","已完成"];
        var willSend = '<table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px; border-collapse:collapse;border:1px solid #ddd; line-height:1.5; color:#666;"><caption style="padding:7px 0; color:#000; line-height:1;">'+groupName+'周报('+start+'至'+end+')</caption><thead><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:60px;">姓名</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;">任务</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:270px">时间段</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:60px;">本周耗时</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:60px;">状态</th><th style="padding:3px 5px; border:solid 1px #ddd; background:#F7F6F5;width:180px;">备注</th></thead><tbody style="font-size:12px;">';
        //取到抄送地址
        Group.getByName(groupName,function(err, groupObject){
            var mailTo = groupObject.mail;
            var members = groupObject.members.split(',');
            var membersLength = members.length;
            
            var readIndex= 0;
            for (var mi=0; mi<membersLength; mi++){
                Note.getAll(members[mi],start,end,function(err, notes){
                    readIndex++;
                    var archiveData = notes;
                    var len = archiveData.length;
                    for (var i=0; i<len; i++){
                        if (i==0){
                            willSend += '<tr><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;" rowspan="'+len+'">'+archiveData[i].user+'</td><td style="padding:3px 5px; border:solid 1px #ddd; background:#FCF2E0;">'+archiveData[i].title+'('+type[Number(archiveData[i].type)-1]+')</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].start+'至'+archiveData[i].end+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+((new Date(archiveData[i].end).getTime()-new Date(archiveData[i].start).getTime())/(1000*60*60)).toFixed(2)+'小时</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+statusNote[Number(archiveData[i].status)-1]+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].remark+'</td></tr>';
                        } else {
                            willSend += '<tr><td class="archive-task" style="padding:3px 5px; border:solid 1px #ddd; background:#FCF2E0;">'+archiveData[i].title+'('+type[Number(archiveData[i].type)-1]+')</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].start+'至'+archiveData[i].end+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+((new Date(archiveData[i].end).getTime()-new Date(archiveData[i].start).getTime())/(1000*60*60)).toFixed(2)+'小时</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+statusNote[Number(archiveData[i].status)-1]+'</td><td style="padding:3px 5px; border:solid 1px #ddd; text-align:center;">'+archiveData[i].remark+'</td></tr>';
                        }
                    }
                    if (readIndex==membersLength){
                        startSend();
                    }

                });

            }
            function startSend(){
                willSend += '</tbody></table>';
                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: '李金标 <stormtea@qq.com>', // sender address
                    to: mailTo, // list of receivers
                    //cc: '1280597658@qq.com', // list of receivers
                    subject: groupName+'周报('+start+'至'+end+')', // Subject line
                    text: start+'至'+end, // plaintext body
                    html: willSend+'<p style="margin:0; padding:7px; line-height:1; text-align:center; font-size:12px; color:#999; ">本邮件由小蜜蜂报表系统自动发送</p>'
                };
                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                    transporter.close();
                });

            }
        })
        //返回jsonp状态
        var data = {
            status: "success"
        };
        res.header("Content-Type", "application/json; charset=utf-8");
        res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
        res.end();
    });
    app.get('/api/saveNote', checkLogin);
    app.get('/api/saveNote', function(req, res){
        var newNote = new Note({
            id: crypto.randomBytes(20).toString('hex'),
            user: req.param('user'),
            type: req.param('type'),
            title: req.param('title'),
            remark: req.param('remark'),
            status: req.param('status'),
            start: req.param('start'),
            end: req.param('end')
        });
        //保存数据 
        var status = "";
        newNote.save(function(err) {
            if (err) {
                status = 'error';
            } else {
                status = 'success';
            }
            //返回jsonp状态
            var data = {
                status: status
            };
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        });
    });
    //保存多条记录
    app.post('/api/saveNotes', function(req, res){
        //保存数据 
        Note.saveAll(req.body.events,function(err,count) {
            if (err) {
                var data = {
                    status: 'error'
                };
            } else {
                var data = {
                    status: 'success',
                    count: count,
                };
            }
            //返回jsonp状态

            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        });
    });
    //删除多条记录
    app.post('/api/removeNotes', function(req, res){
        //保存数据 
        Note.removeMany(req.body.events,function(err,count) {
            if (err) {
                var data = {
                    status: 'error'
                };
            } else {
                var data = {
                    status: 'success',
                    count: count,
                };
            }
            //返回jsonp状态

            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        });
    });
    //获取事件集合
    app.get('/api/getNotes', function(req, res) {
        var data = {};
        Note.getAll(req.param('user'),req.param('start'),req.param('end'),function(err, notes){
            if (err){
                //req.flash('error', err);
                data.list = [];
            } else {
                //req.flash('success', '保存成功');
                data.list = notes;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //获取最近10条事件
    app.get('/api/getRecentlyNotes', function(req, res) {
        var data = {};
        Note.getRencently(req.param('user'),function(err, notes){
            if (err){
                //req.flash('error', err);
                data.list = [];
            } else {
                //req.flash('success', '保存成功');
                data.list = notes;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //通过Id获取单个事件
    app.get('/api/getNote', function(req, res) {
        var data = {};
        Note.get(req.param('_id'),function(err, note){
            if (err){
                //req.flash('error', err);
                data = {};
            } else {
                //req.flash('success', '保存成功');
                data = note;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        })
    });
    //更新事件
    app.get('/api/updateNote', checkLogin);
    app.get('/api/updateNote', function(req, res){
        //保存数据 
        var status = "";
        Note.update(req.param("_id"),req.param('type'),req.param('title'),req.param('remark'),req.param('status'),req.param('start'),req.param('end'),function(err) {
            if (err) {
                //req.flash('error', err);
                status = 'error';
            } else {
                //req.flash('success', '保存成功');
                status = 'success';
            }
            //返回jsonp状态
            var data = {
                status: status
            };
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        });
    });
    //删除事件
    app.get('/api/removeNote', checkLogin);
    app.get('/api/removeNote', function(req, res){
        //保存数据 
        var status = "";
        Note.remove(req.param("_id"),function(err) {
            if (err) {
                //req.flash('error', err);
                status = 'error';
            } else {
                //req.flash('success', '保存成功');
                status = 'success';
            }
            //返回jsonp状态
            var data = {
                status: status
            };
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        });
    });
    //获取所有导入记录
    app.get('/api/getRecords', function(req, res){
        var data = {};
        Record.getAll(function(err, Records){
            if (err){
                //req.flash('error', err);
                data.list = [];
            } else {
                //req.flash('success', '保存成功');
                data.list = Records;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        });
    });

    //导入记录
    app.post('/api/saveRecord', function(req, res){
        //保存数据 
        Record.save({
            user: req.body.user,
            content:req.body.content,
            start:req.body.start,
            end:req.body.end,
            count:req.body.count,
            time:req.body.time
        },function(err,count) {
            if (err) {
                var data = {
                    status: 'error'
                };
            } else {
                var data = {
                    status: 'success'
                };
            }
            //返回jsonp状态

            res.header("Content-Type", "application/json; charset=utf-8");
            res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
            res.end();
        });
    });
    //删除导入记录
    app.delete('/api/record', function(req, res) {
        var id = req.param("id");
        Record.get(id,function(err,doc){
            Note.removeMany(doc.content,function(err,n) {
                console.log(n)
                if (err) {
                    var deleteEvents = "fail";
                } else {
                    var deleteEvents = "success";
                }
                Record.remove(id,function(errRecord){
                    if (errRecord) {
                        deleteRecord = 'error';
                    } else {
                        deleteRecord = 'success';
                    }
                    var data = {
                        deleteEvents: deleteEvents,
                        deleteRecord: deleteRecord
                    };
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.write(req.query.callback + '('+ JSON.stringify(data) + ');');
                    res.end();
                });
            });
        });
        
    });
    app.get('/about', function(req, res) {
        res.render('about', {
            title: 'About'
        });
    });
    app.use(function(req, res) {
        res.render("error", {
            title: 'error'
        });
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!');
            return res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!');
            return res.redirect('back'); //返回之前的页面
        }
        next();
    }
}