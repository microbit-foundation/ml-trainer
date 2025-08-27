(function () {
  window.fetch = () => {
    throw new Error("intercepted!")
  };

  //Monkey patch open
  XMLHttpRequest.prototype.open = function () {
     throw new Error("intercepted!")
  };

  //Monkey patch send
  XMLHttpRequest.prototype.send = function () {
     throw new Error("intercepted!")
  }
  console.log("[Monkey patched]");
})();

// For testing whether the monkey patch actually worked.
// var testRequest = new XMLHttpRequest();
//     testRequest.open("get","https://google.com");
//     testRequest.send();
//     console.log(testRequest.responseText);
