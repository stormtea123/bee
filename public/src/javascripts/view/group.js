define([
    "jquery",
    "underscore",
    "backbone",
    "controller/defaultTime",
    "jqueryUI"
], function($, _, Backbone, DefaultTime) {
    var GroupView = Backbone.View.extend({
        tagName: 'tr',
        initialize: function() {
            this.listenTo(this.model, 'destroy', this.destroy);
        },
        destroy: function() {
            this.remove();
        },
        renderViewMode: function() {
            $(this.el).html('<td class="group-name ui-center"><a href="#archive/group/'+this.model.get('name')+'/'+DefaultTime.start+'/'+DefaultTime.end+'">' + this.model.get('name') + '</a></td><td class="ui-center group-members">' + this.model.get('members') + '</td><td class="ui-center group-mail">'+this.model.get('mail')+'</td><td class="ui-center group-command"><button class="ui-button-primary ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only edit">编辑</button>&nbsp;<button class="ui-button-error ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only delete">删除</a></button>');
        },
        renderEditMode: function() {
            $(this.el).html('<td class="group-name"><input type="text" class="ui-control ui-control-line ui-control-full ui-center group-name-text" value="' + this.model.get('name') + '" /></td><td class="group-members"><textarea class="ui-control ui-control-box ui-control-full group-members-textarea">' + this.model.get('members') + '</textarea></td><td class="group-mail"><input type="text" class="ui-control ui-control-line ui-control-full ui-center group-mail-text" value="' + this.model.get('mail') + '" /></td><td class="group-command ui-center"><button class="ui-button-success ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only save">保存</a></button>&nbsp;<button class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only cancel">取消</button></td>');
        },
        renderCallback: 'renderViewMode',
        render: function() {
            this[this.renderCallback]();
            return this;
        },
        events: {
            'click .edit': 'edit',
            'click .save': 'save',
            'click .cancel': 'cancel',
            'click .delete': 'delete'
        },
        edit: function(event) {
            event.preventDefault();
            this.renderCallback = 'renderEditMode';
            this.render();
        },
        save: function(event) {
            event.preventDefault();
            this.model.set({
                name: $(this.el).find('.group-name-text').val(),
                members: $(this.el).find('.group-members-textarea').val(),
                mail: $(this.el).find('.group-mail-text').val()
            });
            this.renderCallback = 'renderViewMode';
            this.render();
            this.model.save();
        },
        delete: function(event) {
            event.preventDefault();
            var isShureDelete = confirm("您确定要删除么？");
            if (isShureDelete){
                this.model.destroy({
                    success: function(model, response){
                        //console.log(model)
                    }
                });
                this.remove();
            } else {
                return
            }
        },
        cancel: function(event) {
            event.preventDefault();
            this.renderCallback = 'renderViewMode';
            this.render();
        }
    });
    var GroupListView = Backbone.View.extend({
        tagName: 'table',
        className: 'ui-table ui-mt group-table',
        initialize: function() {
            this.listenTo(this.collection, 'add', this.render, this);
            this.listenTo(this.collection, 'change', this.change, this);
        },
        change: function(model){
        },
        render: function() {
            $(this.el).empty();
            $(this.el).append(_.map(["组名", "成员","邮件抄送地址", "命令"], function(val, key) {
                return '<th>' + val + '</th>'
            }));
            _.each(this.collection.models, function(model, index, list) {
                $(this.el).append(new GroupView({
                    model: model
                }).render().el);
            }, this);
            return this;
        }
    })
    var GroupControlsView = Backbone.View.extend({
        tagName: "div",
        className: 'group-add',
        render: function() {
            var html = '<div id="group-dialog" title="新建用户组" style="display:none;"><form method="post" class="ui-form group-form" id="group-form"><table class="group-form-table"><tr><td class="ui-tag"><label class="group-form-label" for="group-title">组名：</label></td><td><input type="text" name="title" id="group-title" class="ui-control ui-control-box ui-control-normal" placeholder="用户组名称"></td></tr><tr><td class="ui-tag"><label class="group-form-label" for="group-members">成员：</label></td><td><textarea name="members" id="group-members" class="ui-control ui-control-box ui-control-normal" placeholder="用户名用英文状态逗号分割"></textarea></td></tr><tr><td class="ui-tag"><label class="group-form-label" for="group-mail">邮件账号：</label></td><td><input type="text" name="mail" id="group-mail" class="ui-control ui-control-box ui-control-normal" placeholder="抄送群组邮件名"></td></table></form></div><div class="group-list" id="group-main"></div><a href="#" class="group-add-command ui-iconfont" id="add">&#xe605;</a>';
            $(this.el).html(html);
            return this;
        }
    })
    return Backbone.View.extend({
        tagName: "div",
        className: "group",
        initialize: function() {
            //this.render();
        },
        render: function() {
            $(this.el).html(new GroupControlsView({
                collection: this.collection
            }).render().el);
            $(this.el).append(new GroupListView({
                collection: this.collection
            }).render().el);
            return this;
        },
        events: {
            'click #add': 'addGroup',
            'submit #group-form': 'submitForm'
        },
        submitForm: function(e) {
            e.preventDefault();
            $(".ui-dialog-buttonset button:eq(0)").trigger("click");
        },
        addGroup: function(event) {
            event.preventDefault();
            var that = this;
            $("#group-dialog").dialog({
                modal: true,
                position: {
                    my: "center top+40",
                    at: "center top",
                    of: window
                },
                width: 360,
                open: function(event,ui) {
                    $(this).parent().focus();
                },
                buttons: [{
                    text: "保存",
                    click: function(e) {
                        var data = {
                            "name": $("#group-title").val(),
                            "members": $("#group-members").val(),
                            "mail": $("#group-mail").val()
                        };
                        //that.collection.add([data]);
                        that.collection.create(data,{
                            success:function(){
                                console.log("添加成功！");
                                that.collection.fetch({
                                    success:function(){
                                        console.log("sucess")
                                    }
                                })
                            }
                        });
                        $(this).dialog("close");
                    }
                }, {
                    text: "取消",
                    click: function(e) {
                        e.preventDefault();
                        $(this).dialog("close");
                    }
                }]
            });
        }
    })
});