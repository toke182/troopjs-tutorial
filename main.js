require.config({
  baseUrl: 'components',
  // Son aliases que permiten requerir paquetes
  // ofreciendo su ruta:
  // Si miras el ultimo (kickstart) es facil de entender
  // name es el nombre que puedes usar para hacer require del paquete EJ: require(['kickstart'])
  // location es la ubicacion relativa del folder que contiene el fichero con el define();
  // main es el nombre del fichero con el define, no es necesario anyadir el .js
  packages: [{
    name: 'jquery',
    main: 'dist/jquery.js'
  }, {
    name: 'poly',
    main: 'poly.js'
  }, {
    name: 'when',
    main: 'when.js'
  }, {
    name: 'troopjs-project',
    location: '..'
  }, {
    name: 'troopjs',
    main: 'maxi.js'
  }],
  deps: [
    'require',
    'when/monitor/console'
  ],
  callback: function bootstrap(require) {
    require([
      'troopjs',
      'troopjs-dom/application/widget', //inside requires poly and when
      'jquery'
    ], function(troopjs, App, $) {
        App($('html')).start();
    });
  }
});


define('foo', ['troopjs-core/component/gadget'], function FooModule(Component) {
    return Component.extend({
        "sig/render": function(data) {
            console.log("ancestor foo");
        },
        "regularFunc": function () {
          console.log("ancestor regularFunc foo");
        }
    });
});
 
define('bar', ['foo'], function FooModule(Foo) {
  return Foo.extend({
    "sig/render": function (data) {
      console.log("child bar");
    },
    "regularFunc": function () {
      console.log("child regularFunc bar");
    }
  });
});
 
// Special like signals are distinguished from a regular method not only from it's signature,
// but also the fact that these methods when overriding in a hierarchical components tree
// where multiple specials share the same name, the overridden component's special function
// are always called ahead of the special from the base component.
 
require(['bar'], function(bar) {
  var bar = bar();
  bar.start()
    .then(function() {
      bar.signal("render") // child bar  ancestor foo
        .then(function () {
          bar.signal("regularFunc"); //Won't work because the funct doesn't have the 'sig' prefix
          bar.regularFunc(); // child regularFunc bar
      });
    });
});