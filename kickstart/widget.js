define(['troopjs-dom/application/widget'], function (Widget) {
  return Widget.extend({
    "sig/start": function () {
    	console.log("kickstart sig/start signal triggered");
    	console.log("this: ", this);
    	this.html("Congratulations, you Learned how to weave a widget");
    }
  });
});