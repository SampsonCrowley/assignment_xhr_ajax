var $ = $ || {}

$.promise = (function(){
  var queue,
      cycle,
      timer = ((typeof setImmediate != "undefined") ? function timer(fn) { return setImmediate(fn); } : setTimeout);

  queue = (function Queue(){
    var first, last, item;

    function Item(fn, self){
      this.fn = fn;
      this.self = self;
      this.next = void 0;
    }

    return {
      add: function add(fn, self){
        item = new Item(fn, self);
        if(last) {
          last.next = item;
        } else {
          first = item;
        }
        last = item;
        item = void 0;
      },
      remove: function remove(){
        var f = first;
        first = last = cycle = void 0;

        while (f) {
          f.fn.call(f.self);
          f = f.next;
        }
      }
    }
  })()

  function schedule (fn, self) {
    queue.add(fn, self);
    if(!cycle){
      cycle = timer(queue.remove);
    }
  }

  function resolve() {

  }

  function reject() {

  }

  function Promise(executor){
    if(typeof executor != "function") {
      throw TypeError("not a function")
    }
    this.initialized = 1;

    this["then"] = function(){
      var res = {
        success: typeof success == "function" ? success : true,
				failure: typeof error == "function" ? error : false
      }

      res.promise = new this.constructor(function(res,  rej){
        
      })
    }


  }

})();
