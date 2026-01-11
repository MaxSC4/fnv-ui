const Events = {};

Events.Call = function (sEventName, ...args) {
  if (typeof window.Events === "undefined") return;
  window.Events.Call(sEventName, ...args);
};

Events.Subscribe = function (sEventName, callback) {
  if (typeof window.Events === "undefined") return;
  window.Events.Subscribe(sEventName, callback);
};

export default Events;
