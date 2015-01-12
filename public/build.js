({
    appDir: './src',
    dir: './build',
    baseUrl: 'javascripts',
    modules: [{
        name: 'main'
    }],
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
    fileExclusionRegExp: /^(r|build)\.js$/,
    optimizeCss: 'standard',
    removeCombined: true,
    shim: {
    }
})