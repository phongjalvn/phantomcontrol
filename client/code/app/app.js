ss.event.on('message', function (type, title, message) {
    console.log(type)
    $.jGrowl(message, {
        header: title,
        theme: type
    });
});