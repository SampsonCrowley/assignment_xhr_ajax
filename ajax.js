// var xhr = new XMLHttpRequest();
// xhr.addEventListener('load', function() {
//   console.log(this.responseText, this.status, this.statusText, this);
// });
// xhr.open('GET', 'https://reqres.in/api/users', true);
// xhr.send();

// var xhr = new XMLHttpRequest();
// // xhr.addEventListener('load', function() {
// //   console.log(this.responseText, this.status, this.statusText, this);
// // });
// xhr.onreadystatechange = function() {
//   if (this.readyState === 4) {
//     console.log(this.responseText, this.status, this.statusText, this);
//   }
// };
// xhr.open('POST', 'https://reqres.in/api/users', true);
// xhr.send('asdf');

var $ = $ || {};

$.ajax = (function() {

  var method,
      url,
      asyncBool = true,
      data,
      callbacks;

  var xhr = function() {
    if (typeof XMLHttpRequest !== 'undefined') {
      return new XMLHttpRequest();
    }
    var versions = [
      "MSXML2.XmlHttp.6.0",
      "MSXML2.XmlHttp.5.0",
      "MSXML2.XmlHttp.4.0",
      "MSXML2.XmlHttp.3.0",
      "MSXML2.XmlHttp.2.0",
      "Microsoft.XmlHttp"
    ];

    var xhr;
    for (var i = 0; i < versions.length; i++) {
      try {
        xhr = new ActiveXObject(versions[i]);
        break;
      } catch (e) {
      }
    }
    return xhr;
  };

  var always = function(xhr) {
    callbacks.always(xhr, xhr.statusText);
  };

  var error = function(xhr) {
    callbacks.error(xhr, xhr.statusText, xhr.responseText);
  };

  var success = function(xhr) {
    callbacks.success(xhr.data, xhr.statusText, xhr);
  };

  var setData = function(obj) {
    var query = [];
    for (var key in data) {
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    data = (query.length ? query.join('&') : '');
  };

  var setHeaders = function(header) {
    for (var key in header) {
      xhr.setRequestHeader(key, header[key]);
    }
  };

  var setMethod = function(verb) {
    method = (verb ? verb.toUpperCase() : 'GET');
  };

  var setUrl = function(str) {
    url = str;
  };

  var setAsyncBool = function(bool) {
    asyncBool = bool !== false;
  };

  var init = function(url, settings) {
    settings = settings || {};
    if (typeof url !== 'string') {
      settings = url;
    } else {
      settings.url = url;
    }

    if (!settings.url) {
      return 'URL not specified.';
    }

    setUrl(settings.url);
    setMethod(settings.method);
    setHeaders(settings.headers);
    setAsyncBool(settings.async);
    setData(settings.data);

    callbacks = {
      success: settings.success,
      error: settings.error,
      always: settings.always
    };

    return send();
  };

  var send = function() {
    var x = xhr();

    if (method === 'GET' && data) {
      url += '?' + data;
      data = null;
    }

    x.open(method, url, asyncBool);
    x.onreadystatechange = function() {
      if (x.readyState === 4) {
        runCallbacks(x);
        return x;
      }
    };

    if (method === 'POST') {
      x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }

    x.send(data);

    return x;
  };

  var runCallbacks = function(x) {
    if (x.status === 200) {
      if (callbacks.success) {
        success(x);
      }
    } else {
      if (callbacks.error) {
        error(x);
      }
    }

    if (callbacks.always) {
      always(x);
    }
  };

  return init;
})();

console.log($.ajax('https://reqres.in/api/users'));
