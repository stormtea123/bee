define([
    "moment"
], function(moment) {
    var now = new Date();
    var getDay = now.getDay() == 0 ? 7 : now.getDay();
    var startInitDay = moment().subtract(getDay - 1, "days").format().substr(0, 10);
    var endInitDay = moment().subtract(-(7 - getDay), "days").format().substr(0, 10);
    return {
        start:startInitDay,
        end:endInitDay
    }
})