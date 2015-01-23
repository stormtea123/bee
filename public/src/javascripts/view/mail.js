define([
    "jquery",
    "underscore",
    "backbone",
    "moment",
    "controller/defaultTime",
    "jqueryUI"
], function($, _, Backbone, moment, DefaultTime) {
    //发送邮件
    return Backbone.View.extend({
        tagName: "div",
        className: "send-mail",
        initialize: function() {
            //this.render();
        },
        render: function() {
            var mailAddress = localStorage.getItem("mailAddress")?localStorage.getItem("mailAddress"):"";
            var groupName = localStorage.getItem("groupName")?localStorage.getItem("groupName"):"";
            $(this.el).html('\
                <form id="send-mail-form" class="ui-form send-mail-form">\
                    <table class="send-mail-table">\
                        <tr>\
                            <td class="ui-tag">类型：</td>\
                            <td>\
                                <select name="type" id="type">\
                                    <option value="1">团队</option>\
                                    <option value="2">个人</option>\
                                </select>\
                            </td>\
                        </tr>\
                        <tr id="name-content">\
                            <td class="ui-tag">用户组：</td>\
                            <td>\
                                <input class="ui-control ui-control-box ui-control-full" type="input" id="groupName" name="groupName" value="'+groupName+'" />\
                            </td>\
                        </tr>\
                        <tr id="address-content" style="display:none;">\
                            <td class="ui-tag">发送地址：</td>\
                            <td>\
                                <input class="ui-control ui-control-box ui-control-full" type="input" id="mailAddress" name="mailAddress" placeholder="多个地址用英文逗号分割" value="'+mailAddress+'" />\
                            </td>\
                        </tr>\
                        <tr>\
                            <td class="ui-tag">时间段：</td>\
                            <td><input class="ui-control ui-control-box" type="input" id="from" name="from" value="'+DefaultTime.start+'" />&nbsp;&nbsp;<input class="ui-control ui-control-box" type="input" id="to" name="to" value="'+DefaultTime.end+'" /></td>\
                        </tr>\
                        <tr>\
                            <td class="ui-tag"></td>\
                            <td>\
                                <input type="submit" class="ui-button ui-button-primary" value="发送">\
                            </td>\
                        </tr>\
                    </table>\
                </form>\
            ');
            return this;
        },
        events: {
            'submit form#send-mail-form': 'startSend',
            'change select#type': 'changeType'
        },
        changeType: function(event){
            if ( $("#type").val()=="2"){
                $("#name-content").hide();
                $("#address-content").show();
            } else if ( $("#type").val()=="1") {
                $("#name-content").show();
                $("#address-content").hide();
            }
        },
        startSend: function(event) {
            event.preventDefault();

            var that = this;
            $("#progress-dialog").dialog({
                modal: true,
                width: 428,
                open: function(event, ui) {
                    $(this).parent().focus();
                    $("#progress-bar span").css("width", "50%");
                }
            });
            var type = $("#type").val();
            var start = moment($("#from").val()).format();
            var end = moment($("#to").val()).add(1,"days").format();
            var sendData = {};
            var url = "";
            var mailAddress = $("#mailAddress").val()||"";
            var groupName = $("#groupName").val()||"";
            localStorage.setItem("mailAddress", mailAddress);
            localStorage.setItem("groupName", groupName);
            
            if (type=="1"){
                sendData = {
                    groupName: groupName,
                    start: start,
                    end: end
                }
                url = "/api/groupToMail?callback=?";
            } else if (type=="2"){
                sendData =  {
                    userName: currentUser,
                    start: start,
                    end: end,
                    mail: mailAddress
                }
                url = "/api/userToMail?callback=?";
            }
            $.ajax({
                type: "get",
                url: url+'&fullname='+currentFullName,
                dataType: "jsonp",
                data: sendData,
                scriptCharset: "utf-8"
            }).done(function(data) {
                $("#progress-bar span").css("width", "100%");
                $("#progress-dialog").dialog("destroy");
            });
        }
    });
});