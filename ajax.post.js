var $ = $ || {};

$.post = (function(ajax) {

  var init = function(url, data, success, dataType) {
    settings = {};
    settings.method = 'POST';
    settings.url = url;
    settings.data = data;
    settings.dataType = dataType;

    return ajax(settings);
  };

  return init;

})($.ajax);

// console.log("POST",
//  $.post('https://reqres.in/api/users',
//  {foo: 'asdf'})
// );
