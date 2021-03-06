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