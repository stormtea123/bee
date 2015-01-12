define([
    "jquery",
    "jqueryUI",
    "fullcalendar",
    "./zh-cn"
], function($) {
    //创建事件时自动提交表单
    var $calendar = $("#main");
    $("#event-form").unbind().submit(function(e) {
        e.preventDefault();
        $(".ui-dialog-buttonset button:eq(0)").trigger("click");

    });
    //模式展示用户
    var defalutUser = currentUser;
    function initCalendar(){
        $calendar.fullCalendar({
            header: {
                left: "prev,next today",
                center: "title",
                right: "month,agendaWeek,agendaDay"
            },
            //默认显示周视图
            defaultView: "agendaWeek",
            lang: 'zh-cn',
            selectable: true,
            editable: true,
            eventLimit: true, // allow "more" link when too many events
            //周计数
            weekNumbers: true,
            selectHelper: true,
            //禁止事件重叠
            slotEventOverlap: false,
            //默认滚动到9点
            scrollTime: "08:30:00",
            //允许接收拖放
            droppable: true,
            eventDrop: function(event, delta, revertFunc) {
                $.ajax({
                    type: "get",
                    url: "/api/updateNote?callback=?",
                    dataType: "jsonp",
                    data: {
                        _id: event._id,
                        type: event.type,
                        title: event.title,
                        remark: event.remark,
                        status: event.status,
                        start: event.start.format(),
                        end: event.end ? event.end.format() : ""
                    },
                    scriptCharset: "utf-8",
                    success: function(updateData) {
                        //console.log(updateData)
                        if (updateData.status = "success") {
                            //callback();
                            $calendar.fullCalendar("renderEvent", event, true);
                            $calendar.fullCalendar("unselect");
                        }
                    }
                });
            },
            drop: function(){
                if ($('#drop-remove').is(':checked')) {
                    // if so, remove the element from the "Draggable Events" list
                    $(this).remove();
                }
            },
            //处理接受数据
            eventReceive: function(event) {
                console.log(event)
                $calendar.fullCalendar("unselect");
                start = event.start;
                $.ajax({
                    type: "get",
                    url: "/api/saveNote?callback=?",
                    dataType: "jsonp",
                    data: {
                        user: currentUser,
                        type: event.type ? event.type : "",
                        title: event.title,
                        remark: event.remark ? event.remark : "",
                        status: event.status ? event.status : "",
                        start: start.format(),
                        end: event._allDay ? start.add("1", "days").format() : start.add("2", "h").format()
                    },
                    scriptCharset: "utf-8",
                    success: function(data) {
                        $calendar.fullCalendar('removeEvents');
                        $calendar.fullCalendar('refetchEvents');
                    }
                });
                $calendar.fullCalendar("unselect");
            },
            //数据生成后
            eventAfterRender: function(event, element, view) {
                //console.log(event)
            },
            eventResize: function(event, delta, revertFunc) {
                $.ajax({
                    type: "get",
                    url: "/api/updateNote?callback=?",
                    dataType: "jsonp",
                    data: {
                        _id: event._id,
                        type: event.type,
                        title: event.title,
                        remark: event.remark,
                        status: event.status,
                        start: event.start.format(),
                        end: event.end.format()
                    },
                    scriptCharset: "utf-8",
                    success: function(data) {
                        //console.log(data)
                        if (data.status = "success") {
                            //callback();
                            $calendar.fullCalendar("renderEvent", event, true);
                        }
                    }
                });
                $calendar.fullCalendar("unselect");
            },
            select: function(start, end, event, view) {
                $("#event-type").get(0).selectedIndex = 0;
                $("#event-status").get(0).selectedIndex = 0;
                //保存事件
                $("#event-dialog").dialog({
                    modal: true,
                    position: {
                        my: "center top+40",
                        at: "center top",
                        of: window
                    },
                    width: 360,
                    buttons: [{
                        text: "保存",
                        click: function(e) {
                            e.preventDefault();
                            var that = this;
                            var status = $("#event-status").val();
                            if (status != "4") {
                                $.ajax({
                                    type: "get",
                                    url: "/api/saveNote?callback=?",
                                    dataType: "jsonp",
                                    data: {
                                        user: currentUser,
                                        type: $("#event-type").val(),
                                        title: $("#event-title").val(),
                                        remark: $("#event-remark").val(),
                                        status: $("#event-status").val(),
                                        start: start.format(),
                                        end: end.format()
                                    },
                                    scriptCharset: "utf-8",
                                    success: function(data) {
                                        if (data.status = "success") {
                                            $(that).dialog("close");
                                            $calendar.fullCalendar('removeEvents');
                                            $calendar.fullCalendar('refetchEvents');
                                            return;
                                        }
                                    }
                                });
                            }
                            $calendar.fullCalendar("unselect");
                        }
                    }, {
                        text: "取消",
                        click: function(e) {
                            e.preventDefault();
                            $(this).dialog("close");
                            $calendar.fullCalendar("unselect");
                        }
                    }]
                });

            },
            eventClick: function(event, element, view) {
                //获取数据
                $.ajax({
                    type: "get",
                    url: "/api/getNote?callback=?",
                    dataType: "jsonp",
                    data: {
                        _id: event._id
                    },
                    scriptCharset: "utf-8"
                }).done(function(data) {
                    var typeValue = Number(data.type);
                    var statusValue = Number(data.status);
                    $("#event-type").get(0).selectedIndex = typeValue > 0 ? typeValue - 1 :0;
                    $("#event-title").val(data.title);
                    $("#event-remark").val(data.remark);
                    $("#event-status").get(0).selectedIndex = statusValue > 0 ? statusValue - 1 :0;
                    $("#event-dialog").dialog({
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
                                e.preventDefault();
                                var that = this;
                                var type = $("#event-type").val();
                                var title = $("#event-title").val();
                                var remark = $("#event-remark").val();
                                var status = $("#event-status").val();
                                event.type = type;
                                event.title = title;
                                event.remark = remark;
                                event.status = status;
                                if (status == "3") {
                                    event.borderColor = '#43a102';
                                    event.backgroundColor = '#43a102';
                                } else if (status == "2") {
                                    event.borderColor = '#f6bf1c';
                                    event.backgroundColor = '#f6bf1c';
                                } else if (status == "1") {
                                    event.borderColor = '';
                                    event.backgroundColor = '';
                                }
                                if (status == "4") {
                                    $.ajax({
                                        type: "get",
                                        url: "/api/removeNote?callback=?",
                                        dataType: "jsonp",
                                        data: {
                                            _id: data._id
                                        },
                                        scriptCharset: "utf-8"
                                    }).done(function(data) {
                                        $("#event-dialog").dialog("close");
                                        $calendar.fullCalendar("removeEvents", event._id);
                                        $calendar.fullCalendar("unselect");
                                    });
                                } else {
                                    $.ajax({
                                        type: "get",
                                        url: "/api/updateNote?callback=?",
                                        dataType: "jsonp",
                                        data: {
                                            _id: data._id,
                                            type: type,
                                            title: title,
                                            remark: remark,
                                            status: status,
                                            start: event.start.format(),
                                            end: event.end.format()
                                        },
                                        scriptCharset: "utf-8",
                                        success: function(updateData) {
                                            //console.log(updateData)
                                            if (updateData.status = "success") {
                                                //callback();
                                                $(that).dialog("close");
                                                $calendar.fullCalendar("renderEvent", event, true);
                                            }
                                        }
                                    });

                                }

                            }
                        }, {
                            text: "取消",
                            click: function(e) {
                                e.preventDefault();
                                $(this).dialog("close");
                            }
                        }]
                    });
                    $calendar.fullCalendar("unselect");

                });
            },
            events: function(start, end, timezone, callback) {
                //start.unix()
                $.ajax({
                    type: "get",
                    url: "/api/getNotes?callback=?",
                    dataType: "jsonp",
                    data: {
                        user: defalutUser,
                        start: start.format(),
                        end: end.format()
                    },
                    scriptCharset: "utf-8"
                }).done(function(data) {
                    var events = [];
                    $(data.list).each(function(i, element) {
                        var o = {
                            _id: $(this).attr('_id'),
                            type: $(this).attr('type'),
                            title: $(this).attr('title'),
                            remark: $(this).attr('remark'),
                            status: $(this).attr('status'),
                            start: $(this).attr('start'),
                            end: $(this).attr('end')
                        }
                        if (element.status == "3") {
                            o.borderColor = '#67BF74',
                                o.backgroundColor = '#67BF74'
                        } else if (element.status == "2") {
                            o.borderColor = '#f6bf1c',
                                o.backgroundColor = '#f6bf1c'
                        }
                        events.push(o)
                    });
                    callback(events);
                });
            },
            loading: function(bool) {
                $("#loading").toggle(bool);
            },
        });
    }
    //抛出公用接口
    return {
        init:function(name){
            isHaveCalendar=true;
            defalutUser = name;
            initCalendar();
        },
        render:function(){
            $calendar.fullCalendar('render');
        },
        destroy:function(){
            isHaveCalendar=false;
            $calendar.fullCalendar('destroy');
        },
        reload:function(name){
            defalutUser = name;
            $calendar.fullCalendar('removeEvents');
            $calendar.fullCalendar('refetchEvents');
        }
    }
});