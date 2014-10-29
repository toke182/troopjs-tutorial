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


// CREATING A BASIC COMPONENT
define('person', ['troopjs-core/component/base'], function ChildModule(Component) {
  return Component.extend(
    // Constructor function
    function ChildComponent(name, surname) {
      this.name = name;
      this.surname = surname;
    },
    // Extends prototype properties
    {
      "walk": function () {
        return this.name + " " + this.surname + " is walking";
      }
    });
});

require(['person'],  function (person) {
  var javier = person("Javier", "Prieto"); 
  console.log(javier.walk());
  // In troopjs you normally won't append an element
  // to the html on this way.
  // This is just as an example
  $("body").text(javier.walk());
});
