define([
    "jquery",
    "underscore",
    "backbone",
    "moment",
    "controller/defaultTime",
    "jqueryUI"
], function($, _, Backbone, moment, DefaultTime) {
    //导入记录视图
    var HistoryView = Backbone.View.extend({
        tagName:'li',
        className:'sync-history-item',
        initialize: function() {
            this.listenTo(this.model, 'destroy', this.destroy);
        },
        destroy: function() {
            this.remove();
        },
        renderViewMode: function(){
            $(this.el).html('您于'+this.model.get('time').substr(0,19)+'从Google日历同步<b>'+this.model.get('count')+'</b>条数据('+this.model.get('start').substr(0,19)+'至'+this.model.get('end').substr(0,19)+')，<a class="delete" href="#">删除本次导入记录</a>');
        },
        renderCallback: 'renderViewMode',
        render: function() {
            this[this.renderCallback]();
            return this;
        },
        events: {
            'click .delete': 'delete'
        },
        delete: function(event){
            event.preventDefault();
            var isShureDelete = confirm("您确定要删除么？");
            if (isShureDelete){
                this.model.destroy({
                    success: function(model, response){
                        console.log("删除导入记录成功");
                    }
                });
                this.remove();
            } else {
                return
            }

        }
    });
    //导入记录集合
    var HistoryCollectionView = Backbone.View.extend({
        tagName:"ul",
        className:"sync-history-list",
        initialize: function() {
            this.listenTo(this.collection, 'add', this.render, this);
        },
        render: function(){
            $(this.el).empty();
            _.each(this.collection.models, function(model, index, list){
                $(this.el).append(new HistoryView({
                    model:model
                }).render().el);
            }, this);
            return this;
        }
    });
    //同步视图
    var SyncView =  Backbone.View.extend({
        tagName: "div",
        className: "sync-calendar-main",
        initialize: function() {
            //this.render();
        },
        render: function() {
            $(this.el).append('\
                <form id="sync-calendar-form" class="ui-form sync-calendar-form">\
                    <table class="sync-calendar-table">\
                        <tr>\
                            <td class="ui-tag">ApiKey：</td>\
                            <td>\
                                <input class="ui-control ui-control-box ui-control-full" type="text" id="apikey" name="apikey" value="AIzaSyAbgIR2RBPuT9OOGc2lu9Ayavio50-mrRU" />\
                            </td>\
                        </tr>\
                        <tr>\
                            <td class="ui-tag">日历Id：</td>\
                            <td>\
                                <input class="ui-control ui-control-box ui-control-full" type="input" value="stormte@gmail.com" id="id" name="id" />\
                            </td>\
                        </tr>\
                        <tr>\
                            <td class="ui-tag">时间段：</td>\
                            <td><input class="ui-control ui-control-box" type="input" id="from" name="from" value="'+DefaultTime.start+'" />&nbsp;&nbsp;<input class="ui-control ui-control-box" type="input" id="to" name="to" value="'+DefaultTime.end+'"/></td>\
                        </tr>\
                        <tr>\
                            <td class="ui-tag"></td>\
                            <td>\
                                <input type="submit" class="ui-button ui-button-primary" value="开始同步">\
                            </td>\
                        </tr>\
                    </table>\
                </form>\
            ');
            return this;
        }
        
    });
    return Backbone.View.extend({
        tagName: "div",
        className: "sync-calendar",
        initialize: function() {
            //this.render();
        },
        render: function(){
            $(this.el).html(new HistoryCollectionView({
                collection:this.collection
            }).render().el);
            $(this.el).append(new SyncView({
                collection:this.collection
            }).render().el);
            return this;
        },
        events: {
            'submit form#sync-calendar-form': 'startSync',
        },
        startSync: function(event) {
            event.preventDefault();
            var that = this;
            $("#progress-dialog").dialog({
                modal: true,
                // position: {
                //     my: "center top+40",
                //     at: "center top",
                //     of: window
                // },
                width: 428,
                open: function(event, ui) {
                    $(this).parent().focus();
                    $("#progress-bar span").css("width", "20%");
                }
            });
            var start = moment($("#from").val()).format();
            var end = moment($("#to").val()).format();
            //获取数据
            $.ajax({
                type: "get",
                url: "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent($("#id").val()) + "/events?callback=?",
                dataType: "jsonp",
                data: {
                    key: $("#apikey").val(),
                    timeMin: start,
                    timeMax: end,
                    singleEvents: true,
                    maxResults: 9999
                },
                scriptCharset: "utf-8",
                success: function(data) {
                    var getArrayData = data.items;
                    //console.log(data)
                    $("#progress-bar span").css("width", "50%");
                    var result = [];
                    var resultID = [];
                    var len = getArrayData.length;
                    for (var i = 0; i < len; i++) {
                        resultID[i] = getArrayData[i].id;
                        result[i] = {};
                        result[i].id = getArrayData[i].id;
                        result[i].user = currentUser;
                        result[i].type = "1";
                        result[i].title = getArrayData[i].summary;
                        result[i].remark = getArrayData[i].description || "";
                        result[i].status = "3";
                        result[i].start = getArrayData[i].start.date||getArrayData[i].start.dateTime;
                        result[i].end = getArrayData[i].end.date||getArrayData[i].end.dateTime;
                    }
                    $("#progress-bar span").css("width", "70%");
                    saveEvents(result);
                    saveRecords(resultID,len);
                    that.collection.fetch({
                        success:function(){
                            console.log("fetch records collection success");
                        }
                    })
                }
            });
            //保存数据
            function saveEvents(result) {
                $.ajax({
                    type: "post",
                    url: "/api/saveNotes?callback=?",
                    dataType: "jsonp",
                    data: {
                        events: JSON.stringify(result)
                    },
                    scriptCharset: "utf-8",
                    success: function(data) {
                        $("#progress-bar span").css("width", "100%");
                        $("#progress-dialog").dialog("destroy");
                    }
                });
            };
            //保存导入记录
            function saveRecords(result,count) {
                $.ajax({
                    type: "post",
                    url: "/api/saveRecord?callback=?",
                    dataType: "jsonp",
                    data: {
                        user: currentUser,
                        content: JSON.stringify(result),
                        start:start,
                        end:end,
                        count:count,
                        time: moment().format()
                    },
                    scriptCharset: "utf-8",
                    success: function(data) {
                        //sucess
                    }
                })
            }

        }
    })
});