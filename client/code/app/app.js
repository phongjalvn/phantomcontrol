ss.event.on('message', function(type,title,message){
  $.jGrowl(message, {
    header: title,
    theme: type
  });
});