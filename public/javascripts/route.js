define([
    "jquery",
    "underscore",
    "backbone",
    "moment",
    "view/search",
    "view/group",
    "view/syncCalendar",
    "controller/search",
    "controller/calendar",
], function($, _, Backbone, moment, ViewSearch, ViewGroup, SyncCalendar, ControllerSearch, Calendar) {
    //最近记录列表
    $.ajax({
        type: "get",
        url: "/api/getRecentlyNotes?callback=?",
        dataType: "jsonp",
        data: {
            user: currentUser
        },
        scriptCharset: "utf-8",
        success: function(data) {
            var recentlyArray = data.list;
            var len = recentlyArray.length;
            var willHtml = "";
            for (var i = 0; i < len; i++) {
                willHtml += '<li class="recently-event">' + recentlyArray[i].title + '</li>';
            }
            $("#recently-events").html(willHtml)
            $('#recently-events .recently-event').each(function() {
                $(this).data('event', {
                    title: $.trim($(this).text()),
                    stick: true
                });
                $(this).draggable({
                    zIndex: 999,
                    revert: true,
                    revertDuration: 0
                });
            });
        }
    });
    var $container = $(".container");
    var $main = $("#main");
    
    var now = new Date();
    var startInitDay = moment().subtract(now.getDay() + 1, "days").format().substr(0, 10);
    var endInitDay = moment().subtract(-(7 - (now.getDay() + 1)), "days").format().substr(0, 10);
    //匹配邮件发送地址
    var locationHash = location.hash;
    var matchGroupRule = /archive\/group\/([^\/]+)/;
    var matchGroupName = matchGroupRule.test(locationHash) ? matchGroupRule.exec(locationHash)[1] : "test";
    $(window).bind('hashchange', function() {
        //console.log("hashchange")
        matchGroupName = matchGroupRule.test(locationHash) ? matchGroupRule.exec(locationHash)[1] : "test";
    });
    $("#bar-more-mail").attr("href", '#groupTomail/' + matchGroupName + '/' + startInitDay + '/' + endInitDay)
        //显示最近创建的事件列表
    $("#bar-menu-btn").click(function(event) {
        event.preventDefault();
        $("#recently").toggle();
        $container.css("margin-left") == "400px" ? $container.css({
            "margin-left": "230px"
        }) : $container.css({
            "margin-left": "400px"
        })
    });
    //显示更多菜单浮层
    $(".bar-more-btn").click(function(event) {
        event.preventDefault();
        $(".bar-more-nav").toggle();
    });
    $(".bar-more-nav").delegate("a", "click", function(event) {
        $(".bar-more-nav").toggle();
    });
    var viewSearch = new ViewSearch();
    //执行搜索自动完成
    ControllerSearch();
    //用户路由
    return Backbone.Router.extend({
        routes: {
            '': 'default',
            'user/:name': 'swtichUser',
            'group': 'group',
            'google': 'syncCalendar',
            'archive/user/:name/:start/:end': 'archiveUser',
            'archive/group/:name/:start/:end': 'archiveGroup',
            'userToMail/:name/:start/:end/:mail': 'userToMail',
            'groupTomail/:name/:start/:end': 'groupToMail'
        },
        default: function() {
            document.title = "小蜜蜂";
            $main.empty();
            if (isHaveCalendar) {
                Calendar.reload(name);
            } else {
                Calendar.init(currentUser);
            }

        },
        group: function() {
            document.title = "用户组管理-小蜜蜂"
            if (isHaveCalendar) {
                //销毁日历
                Calendar.destroy();
                isHaveCalendar = false;
            }
            var that = this;
            var addGroupTemplate = '<div id="group-dialog" title="新建用户组" style="display:none;"><form method="post" class="ui-form group-form" id="group-form"><table class="group-form-table"><tr><td class="ui-tag"><label class="group-form-label" for="group-title">组名：</label></td><td><input type="text" name="title" id="group-title" class="ui-control ui-control-box ui-control-normal" placeholder="用户组名称"></td></tr><tr><td class="ui-tag"><label class="group-form-label" for="group-members">成员：</label></td><td><textarea name="members" id="group-members" class="ui-control ui-control-box ui-control-normal" placeholder="用户名用英文状态逗号分割"></textarea></td></tr><tr><td class="ui-tag"><label class="group-form-label" for="group-mail">邮件账号：</label></td><td><input type="text" name="mail" id="group-mail" class="ui-control ui-control-box ui-control-normal" placeholder="抄送群组邮件名"></td></table></form></div><div class="group-list" id="group-main"></div>';
            $main.html(addGroupTemplate);
            $("#group-form").unbind().submit(function(e) {
                e.preventDefault();
                $(".ui-dialog-buttonset button:eq(0)").trigger("click");
            });
            //用户组模型
            var GroupModel = Backbone.Model.extend({
                defaults: {
                    name: "",
                    members: "",
                    mail: ""
                },
                url: function() {
                    if (!_.isUndefined(this.id)) {
                        return "/api/group?_id=" + this.id
                    } else {
                        return "/api/group"
                    }

                },
                idAttribute: '_id',
                sync: function(method, collection, options) {
                    options.dataType = "jsonp";
                    return Backbone.sync(method, collection, options);
                }
            });
            //用户组集合
            var GroupCollection = Backbone.Collection.extend({
                model: GroupModel,
                url: "/api/getGroups",
                sync: function(method, collection, options) {
                    options.dataType = "jsonp";
                    return Backbone.sync(method, collection, options);
                },
                parse: function(response) {
                    return response.list;
                }
            });
            var groupCollection = new GroupCollection();
            groupCollection.fetch({
                success: function(collection, response, options) {
                    var viewGroup = new ViewGroup({
                        collection: collection,
                        el: $("#group-main")
                    }).render();
                    that.changeView(viewGroup);
                },
                error: function(collection, response, options) {
                    console.log(response.statusText);
                },
                timeout: 5000
            });
        },
        syncCalendar: function() {
            document.title = "同步Google日历-小蜜蜂"
            if (isHaveCalendar) {
                //销毁日历
                Calendar.destroy();
                isHaveCalendar = false;
            }
            var that = this;
            $main.html('<ul class="sync-history-list" id="sync-history-list"></ul>')
                //用户组模型
            var historyModel = Backbone.Model.extend({
                defaults: {
                    user: "",
                    record: "",
                    start: "",
                    end: "",
                    count: "",
                    time: ""
                },
                url: function() {
                    if (!_.isUndefined(this.id)) {
                        return "/api/record?id=" + this.id
                    } else {
                        return "/api/record"
                    }

                },
                idAttribute: '_id',
                sync: function(method, collection, options) {
                    options.dataType = "jsonp";
                    return Backbone.sync(method, collection, options);
                }
            });
            //用户组集合
            var HistoryCollection = Backbone.Collection.extend({
                model: historyModel,
                url: "/api/getRecords",
                sync: function(method, collection, options) {
                    options.dataType = "jsonp";
                    return Backbone.sync(method, collection, options);
                },
                parse: function(response) {
                    return response.list;
                }
            });
            var historyCollection = new HistoryCollection();
            historyCollection.fetch({
                success: function(collection, response, options) {
                    var syncCalendar = new SyncCalendar({
                        collection: collection,
                        el: $main
                    }).render();
                    that.changeView(syncCalendar);
                    //出发日历下拉组件
                    $("#from").datepicker({
                        //defaultDate: "-1w",
                        dateFormat: "yy-mm-dd",
                        changeMonth: true,
                        numberOfMonths: 2,
                        onClose: function(selectedDate) {
                            $("#to").datepicker("option", "minDate", selectedDate);
                        }
                    });
                    $("#to").datepicker({
                        //defaultDate: "+1w",
                        dateFormat: "yy-mm-dd",
                        changeMonth: true,
                        numberOfMonths: 2,
                        onClose: function(selectedDate) {
                            $("#from").datepicker("option", "maxDate", selectedDate);
                        }
                    });
                },
                error: function(collection, response, options) {
                    console.log(response.statusText);
                },
                timeout: 5000
            });
        },
        //索索切换用户
        swtichUser: function(name) {
            if (isHaveCalendar) {
                Calendar.reload(name);
            } else {
                Calendar.init(name);
            }
        },
        archiveUser: function(name, start, end) {
            document.title = "个人周报-小蜜蜂"
            if (isHaveCalendar) {
                //销毁日历
                Calendar.destroy();
                isHaveCalendar = false;
            }
            $.ajax({
                type: "get",
                url: "/api/getNotes?callback=?",
                dataType: "jsonp",
                data: {
                    user: name,
                    start: start,
                    end: end
                },
                scriptCharset: "utf-8"
            }).done(function(data) {
                var archiveData = data.list;
                var len = archiveData.length;
                var type = ["工作需求", "自主学习", "其它"];
                var statusNote = ["未完成", "完成中", "已完成"];
                var ret = '<table class="ui-table"><caption>周报(' + start + '至' + end + ')</caption><thead><th>姓名</th><th>任务</th><th>时间段</th><th>本周耗时</th><th>状态</th><th>备注</th></thead><tbody class="ui-tbody">';
                for (var i = 0; i < len; i++) {
                    if (i == 0) {
                        ret += '<tr><td class="ui-center" rowspan="' + len + '">' + archiveData[i].user + '</td><td class="archive-task">' + archiveData[i].title + '(' + type[Number(archiveData[i].type) - 1] + ')</td><td class="ui-center">' + archiveData[i].start + '至' + archiveData[i].end + '</td><td class="ui-center">' + ((new Date(archiveData[i].end).getTime() - new Date(archiveData[i].start).getTime()) / (1000 * 60 * 60)).toFixed(2) + '时</td><td class="ui-center">' + statusNote[Number(archiveData[i].status) - 1] + '</td><td class="ui-center">' + archiveData[i].remark + '</td></tr>';
                    } else {
                        ret += '<td class="archive-task">' + archiveData[i].title + '(' + type[Number(archiveData[i].type) - 1] + ')</td><td class="ui-center">' + archiveData[i].start + '至' + archiveData[i].end + '</td><td class="ui-center">' + ((new Date(archiveData[i].end).getTime() - new Date(archiveData[i].start).getTime()) / (1000 * 60 * 60)).toFixed(2) + '时</td><td class="ui-center">' + statusNote[Number(archiveData[i].status) - 1] + '</td><td class="ui-center">' + archiveData[i].remark + '</td></tr>';
                    }
                }
                ret += '</tbody></table>';
                $main.html(ret);
            });
        },
        archiveGroup: function(name, start, end) {
            document.title = name + "周报-小蜜蜂";
            if (isHaveCalendar) {
                //销毁日历
                Calendar.destroy();
                isHaveCalendar = false;
            }
            var type = ["工作需求", "自主学习", "其它"];
            var statusNote = ["未完成", "完成中", "已完成"];
            var willHtml = '<table class="ui-table"><caption>周报(' + start + '至' + end + ')</caption><thead><th>姓名</th><th>任务</th><th>时间段</th><th>本周耗时</th><th>状态</th><th>备注</th></thead><tbody class="ui-tbody">';
            $.ajax({
                type: "get",
                url: "/api/getGroupByName?callback=?",
                dataType: "jsonp",
                data: {
                    name: name
                },
                scriptCharset: "utf-8"
            }).done(function(data) {
                var members = data.members.split(",");
                var membersLenght = members.length;
                var readIndex = 0;
                for (var mi = 0; mi < membersLenght; mi++) {
                    $.ajax({
                        type: "get",
                        url: "/api/getNotes?callback=?",
                        dataType: "jsonp",
                        data: {
                            user: members[mi],
                            start: start,
                            end: end
                        },
                        scriptCharset: "utf-8"
                    }).done(function(data) {
                        readIndex++;
                        var archiveData = data.list;
                        var len = archiveData.length;
                        for (var i = 0; i < len; i++) {
                            if (i == 0) {
                                willHtml += '<tr><td class="ui-center" rowspan="' + len + '">' + archiveData[i].user + '</td><td class="archive-task">' + archiveData[i].title + '(' + type[Number(archiveData[i].type) - 1] + ')</td><td class="ui-center">' + archiveData[i].start + '至' + archiveData[i].end + '</td><td class="ui-center">' + ((new Date(archiveData[i].end).getTime() - new Date(archiveData[i].start).getTime()) / (1000 * 60 * 60)).toFixed(2) + '时</td><td class="ui-center">' + statusNote[Number(archiveData[i].status) - 1] + '</td><td class="ui-center">' + archiveData[i].remark + '</td></tr>';
                            } else {
                                willHtml += '<td class="archive-task">' + archiveData[i].title + '(' + type[Number(archiveData[i].type) - 1] + ')</td><td class="ui-center">' + archiveData[i].start + '至' + archiveData[i].end + '</td><td class="ui-center">' + ((new Date(archiveData[i].end).getTime() - new Date(archiveData[i].start).getTime()) / (1000 * 60 * 60)).toFixed(2) + '时</td><td class="ui-center">' + statusNote[Number(archiveData[i].status) - 1] + '</td><td class="ui-center">' + archiveData[i].remark + '</td></tr>';
                            }
                        }
                        //全部执行完
                        if (readIndex == membersLenght) {
                            willHtml += '</tbody></table>';
                            $main.html(willHtml);
                        }
                    });

                }
            });

        },
        userToMail: function(name, start, end, mail) {
            var isShureToSend = confirm("您确定要发送吗？")
            if (!isShureToSend) return;
            $.ajax({
                type: "get",
                url: "/api/userToMail?callback=?",
                dataType: "jsonp",
                data: {
                    userName: name,
                    start: start,
                    end: end,
                    mail: mail || ""
                },
                scriptCharset: "utf-8"
            }).done(function(data) {
                $("#progress-bar span").css("width", "100%");
                $("#progress-dialog").dialog("destroy");
            });
        },
        groupToMail: function(name, start, end) {
            var isShureToSend = confirm("您确定要发送吗？")
            if (!isShureToSend) return;
            $("#progress-dialog").dialog({
                modal: true,
                width: 428,
                open: function(event, ui) {
                    $(this).parent().focus();
                    $("#progress-bar span").css("width", "50%");
                }
            });
            $.ajax({
                type: "get",
                url: "/api/groupToMail?callback=?",
                dataType: "jsonp",
                data: {
                    groupName: name,
                    start: start,
                    end: end
                },
                scriptCharset: "utf-8"
            }).done(function(data) {
                $("#progress-bar span").css("width", "100%");
                $("#progress-dialog").dialog("destroy");
            });
        },
        //切换视图
        changeView: function(view) {
            console.log(view);
            if (this.currentView) {
                console.log(this.currentView)
                if (this.currentView == view) {
                    return;
                }
                this.currentView.remove();
            }
            this.currentView = view;
        }
    })

});