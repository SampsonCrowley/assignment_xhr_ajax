var $ = $ || {}

$.promise = (function(){
  var queue,
  cycle,
  timer = ((typeof setImmediate != "undefined") ? function timer(fn) { return setImmediate(fn); } : setTimeout);

  // linked list with an access point at cycle
  queue = (function Queue(){
    var first, last, item;

    function Item(fn, self){
      this.fn = fn;
      this.self = self;
      this.next = void(0);
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
        item = void(0);
      },
      remove: function remove(){
        var f = first;
        first = last = cycle = void(0);

        while (f) {
          f.fn.call(f.self);
          f = f.next;
        }
      }
    }
  })()

  // schedule to push items to the end of the stack
  function schedule (fn, self) {
    queue.add(fn, self);
    if(!cycle){
      cycle = timer(queue.remove);
    }
  }

  // allow then chaining if return object is also a function
  function isThenable(obj) {
    var _then, obj_type = typeof obj;

    if (obj != null && (obj_type == "object" || obj_type == "function")) {
      _then = obj.then;
    }
    return typeof _then == "function" ? _then : false;
  }

  function resolve(msg) {
    var _then, self = this;

    // already triggered?
    if (self.triggered) { return; }

    self.triggered = true;

    // unwrap
    if (self.promise) {
      self = self.promise;
    }

    try {
      if (_then = isThenable(msg)) {
        schedule(function(){
          var promise_wrapper = new MakePromiseWrapper(self);
          try {
            _then.call(msg,
              function $resolve$(){
                resolve.apply(promise_wrapper,arguments);
              },
              function $reject$(){
                reject.apply(promise_wrapper,arguments);
              }
            );
          }
          catch (err) {
            reject.call(promise_wrapper,err);
          }
        })
      }
      else {
        self.msg = msg;
        self.state = 1;
        if (self.chain.length > 0) {
          schedule(notifyChain,self);
        }
      }
    }
    catch (err) {
      reject.call(new MakePromiseWrapper(self),err);
    }
  }

  function reject(msg) {
    var self = this;

    // already triggered?
    if (self.triggered) { return; }

    self.triggered = true;

    // unwrap
    if (self.promise) {
      self = self.promise;
    }

    self.msg = msg;
    self.state = 2;
    if (self.chain && self.chain.length > 0) {
      schedule(notifyChain,self);
    }
  }

  // run through a chain to check state
  function notifyChain() {
    for (var i=0; i<this.chain.length; i++) {
      notifySingle(this,
        (this.state === 1) ? this.chain[i].success : this.chain[i].failure,
        this.chain[i]);
      }
      this.chain.length = 0;
    }

    // NOTE: This is a separate function to isolate
    // the `try..catch` so that other code can be
    // optimized better
    function notifySingle(self, fn, chain) {
      var response, _then;
      try {
        if (fn === false) {
          chain.reject(self.msg);
        }
        else {
          if (fn === true) {
            response = self.msg;
          }
          else {
            response = fn.call(void(0),self.msg);
          }

          if (response === chain.promise) {
            chain.reject(TypeError("Promise-chain cycle"));
          }
          else if (_then = isThenable(ret)) {
            _then.call(response, chain.resolve, chain.reject);
          }
          else {
            chain.resolve(response);
          }
        }
      }
      catch (err) {
        chain.reject(err);
      }
    }

    function iteratePromises(Constructor,arr,resolver,rejecter) {
      for (var idx=0; idx<arr.length; idx++) {
        (function (idx){
          Constructor.resolve(arr[idx])
          .then(
            function(msg){
              resolver(idx,msg);
            },
            rejecter
          );
        })(idx);
      }
    }

    function MakePromiseWrapper(self) {
      this.promise = self;
      this.triggered = false;
    }

    //set query chain initial values
    function MakePromise(self) {
      this.promise = self;
      this.state = 0;
      this.triggered = false;
      this.chain = [];
      this.msg = void(0);
    }

    function Promise(executor) {
      if (typeof executor != "function") {
        throw TypeError("Not a function");
      }

      // to signal an already "initialized" promise
      this.__promise__ = 1;

      var promise = new MakePromise(this);

      //add then function as a property
      this["then"] = function then(success,failure) {
        var obj = {
          success: typeof success == "function" ? success : true,
          failure: typeof failure == "function" ? failure : false
        };

        // Note: `then(..)` itself can be borrowed to be used against
        // a different promise constructor for making the chained promise,
        // by substituting a different `this` binding.
        obj.promise = new this.constructor(function extractChain(resolve,reject) {
          if (typeof resolve != "function" || typeof reject != "function") {
            throw TypeError("Not a function");
          }

          obj.resolve = resolve;
          obj.reject = reject;
        });
        promise.chain.push(obj);

        if (promise.state !== 0) {
          schedule(notifyChain, promise);
        }

        return obj.promise;
      };
      this["catch"] = function catchErr(failure) {
        return this.then(void 0,failure);
      };

      try {

        //try to execute the passed function
        executor.call(
          void 0,
          function publicResolve(msg){
            resolve.call(promise, msg);
          },
          function publicReject(msg) {
            reject.call(promise, msg);
          }
        );
      }
      catch (err) {
        // cath any errors attempting to run the callback
        reject.call(promise, err);
      }
    }

    Promise.prototype = Object.create(Promise);
    Promise.prototype.constructor = Promise;

    Promise.resolve = function promiseResolve(){
      var Constructor = this;

      if (msg && typeof msg == "object" && msg.__promise__ === 1) {
        return msg;
      }
      return new Constructor(function executor(res, rej){
        if (typeof resolve != "function" || typeof reject != "function") {
          throw TypeError("Not a function");
        }

        resolve(msg);
      })
    }

    Promise.reject = function promiseReject(msg) {
      return new this(function executor(resolve,reject){
        if (typeof resolve != "function" || typeof reject != "function") {
          throw TypeError("Not a function");
        }

        reject(msg);
      });
    }

    Promise.all = function promisAll(arr) {
      var Constructor = this;

      if (arr.length === 0) {
        return Constructor.resolve([]);
      }

      return new Constructor(function executor(resolve,reject){
        if (typeof resolve != "function" || typeof reject != "function") {
          throw TypeError("Not a function");
        }

        var len = arr.length, msgs = Array(len), count = 0;

        iteratePromises(Constructor,arr,function resolver(idx,msg) {
          msgs[idx] = msg;
          if (++count === len) {
            resolve(msgs);
          }
        },reject);
      });
    }
    function setPromise(promise){
      return new Promise(promise)
    }
    return setPromise;
  })();

  var thisPromiseCount = 1;

  var log = document.getElementById('log');
  log.insertAdjacentHTML('beforeend', thisPromiseCount +
      ') Started (<small>Sync code started</small>)<br/>');
  var p1 = $.promise(
        // The resolver function is called with the ability to resolve or
        // reject the promise

        function(resolve, reject) {
            log.insertAdjacentHTML('beforeend', thisPromiseCount +
                ') Promise started (<small>Async code started</small>)<br/>');
            // This is only an example to create asynchronism
            window.setTimeout(
                function() {
                    // We fulfill the promise !
                    resolve(thisPromiseCount);
                }, Math.random() * 2000 + 1000);
        }
    );

    // We define what to do when the promise is resolved/fulfilled with the then() call,
    // and the catch() method defines what to do if the promise is rejected.
    p1.then(
        // Log the fulfillment value
        function(val) {
            log.insertAdjacentHTML('beforeend', val +
                ') Promise fulfilled (<small>Async code terminated</small>)<br/>');
        })
    .catch(
        // Log the rejection reason
        function(reason) {
            console.log('Handle rejected promise ('+reason+') here.');
        });

    log.insertAdjacentHTML('beforeend', thisPromiseCount +
        ') Promise made (<small>Sync code terminated</small>)<br/>');
