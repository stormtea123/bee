define([
    "jquery",
    "underscore",
    "backbone"
], function($, _, Backbone) {

    //搜索视图
    return Backbone.View.extend({
        el: $("#search"),
        initialize: function(){
            this.render();
        },
        render: function(){
            this.$el.append('\
                <form id="search-form" class="search-form">\
                  <input type="text" class="search-input" id="search-input"\ placeholder="在此输入用户名，猛敲回车">\
                  <button type="submit" class="search-submit">\
                    <i class="search-submit-ico">&#xe606;</i>\
                    <span class="ui-hide-text">搜索</span>\
                  </button>\
                </form>\
            ')
        },
        events: {
            'submit form#search-form': 'switchUser'
        },
        switchUser: function(event){
            event.preventDefault();
            Backbone.history.navigate("#user/"+$("#search-input").val(), { trigger: true })
        }
    })
});