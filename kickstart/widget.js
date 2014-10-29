define(['troopjs-dom/application/widget'], function (Widget) {
  return Widget.extend({
    "sig/start": function () {
    	console.log("kickstart sig/start signal triggered");
    },
    "sig/custom_signal": function (args) {
    	console.log("kickstart sig/custom_signal signal triggered");
    }
  });
});