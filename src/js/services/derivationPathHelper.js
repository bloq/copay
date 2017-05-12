'use strict';

angular.module('copayApp.services').factory('derivationPathHelper', function(lodash, customNetwork) {
  var root = {};

  var coinType = lodash.get(customNetwork, 'coinType', 0);
  root.default = "m/44'/" + coinType + "'/0'";
  root.defaultTestnet = "m/44'/1'/0'";

  root.parse = function(str) {
    var arr = str.split('/');

    var ret = {};

    if (arr[0] != 'm')
      return false;

    switch (arr[1]) {
      case "44'":
        ret.derivationStrategy = 'BIP44';
        break;
      case "45'":
        return {
          derivationStrategy: 'BIP45',
          networkName: 'livenet',
          account: 0,
        }
        break;
      case "48'":
        ret.derivationStrategy = 'BIP48';
        break;
      default:
        return false;
    };

    switch (arr[2]) {
      case "0'":
        ret.networkName = 'livenet';
        break;
      case "1'":
        ret.networkName = 'testnet';
        break;
      default:
        if (arr[2] !== lodash.get(customNetwork, 'coinType') + "'") {
          return false;
        }
        ret.networkName = customNetwork.name;
    };

    var match = arr[3].match(/(\d+)'/);
    if (!match)
      return false;
    ret.account = +match[1]

    return ret;
  };

  return root;
});
