var $ = $ || {};

$.get = (function(ajax) {

  var init = function(url, data, success, dataType) {
    settings = {};
    settings.method = 'GET';
    settings.url = url;
    settings.data = data;
    settings.dataType = dataType;

    return ajax(settings);
  };

  return init;

})($.ajax);

// console.log("GET",
//  $.get('https://reqres.in/api/users',
//  {id: 1})
// );
