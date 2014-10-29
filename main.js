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
  }, {
    name: 'kickstart',
    location: '../kickstart',
    main: 'widget'
  }],
  deps: [
    'require',
    // 'when/monitor/console'
  ],
  callback: function bootstrap(require) {
    require([
      'troopjs',
      'troopjs-dom/application/widget', //inside requires poly and when
      'jquery'
    ], function(troopjs, App, $) {
        // App($('html')).start();
        require(['kickstart'], function(kickstart) {
            var me = this;
            me.kick = kickstart($("html"));

          me.kick
            .start()
            .then(function() {
              console.log("promise from sig/start satisfied");
              me.kick.signal("custom_signal", {arg1K: "arg1V", arg2K: "arg2V"})
                .then(function (){
                  console.log("promise from sig/custom_signal satisfied");
                });
          });
        });
    });
  }
});

// console.log(1)

// define('foo', ['troopjs-core/component/gadget'], function (Component) {
//   console.log(2)
//   return Component.extend({
//     "sig/start": function() {
//       console.log(3)

//     },
//       "sig/render": function(data) {
//         console.log(4)
//         console.log(data);  // {title: "Foo"}
//       }
//     });
// });

// require(['foo'], function(foo) {
//   console.log(5)
//   // debugger;
//   foo().start().then(function () {
//     console.log(6)
//     foo().signal("render", {title: "Foo"});
//   });
//   console.log(7)
//   console.log(foo);
// });
// console.log(8);