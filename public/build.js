({
    appDir: './src',
    dir: './build',
    baseUrl: 'javascripts',
    modules: [{
        name: 'main'
    }],
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
    fileExclusionRegExp: /^(r|build)\.js$/,
    optimizeCss: 'standard',
    removeCombined: true,
    shim: {
    }
})