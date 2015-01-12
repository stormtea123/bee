require.config({
    //baseUrl: "",
    paths: {
        jquery: 'lib/jquery.min',
        underscore: 'lib/underscore',
        backbone: 'lib/backbone',
        moment: 'lib/moment',
        fullcalendar: 'lib/fullcalendar',
        jqueryUI: 'lib/jquery-ui',
        handlebars: 'lib/handlebars',
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
})