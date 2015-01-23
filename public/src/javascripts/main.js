require.config({
    //baseUrl: "",
    paths: {
        jquery: 'http://libs.baidu.com/jquery/2.0.0/jquery.min',
        jqueryUI: 'http://libs.baidu.com/jqueryui/1.10.4/jquery-ui.min',
        underscore: 'lib/underscore',
        backbone: 'lib/backbone',
        moment: 'lib/moment',
        fullcalendar: 'lib/fullcalendar',
        template: "models/template",
        qrcode: 'lib/qrcode'
    },
    shim: {
        backbone: {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },
        underscore: {
            exports: "_"
        }
    }
});
var isHaveCalendar = false;
//路由
require(["route"], function(Route) {
    window.route = new Route();
    Backbone.history.start();
});