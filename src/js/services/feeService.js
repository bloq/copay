'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $stateParams, bwcService, walletService, configService, gettext, lodash, txFormatService, gettextCatalog, asyncService) {
  var root = {};

  // Constant fee options to translate
  root.feeOpts = {
    urgent: gettext('Urgent'),
    priority: gettext('Priority'),
    normal: gettext('Normal'),
    economy: gettext('Economy'),
    superEconomy: gettext('Super Economy')
  };

  root.getCurrentFeeLevel = function() {
    return configService.getSync().wallet.settings.feeLevel || 'normal';
  };

  root.getCurrentFeeValue = function(network, cb) {
    network = network || 'livenet';
    var feeLevel = root.getCurrentFeeLevel();

    root.getFeeLevels(function(err, levels) {
      if (err) return cb(err);

      var feeLevelValue = lodash.find(levels[network], {
        level: feeLevel
      });

      if (!feeLevelValue || !feeLevelValue.feePerKB) {
        return cb({
          message: gettextCatalog.getString("Could not get dynamic fee for level: {{feeLevel}}", {
            feeLevel: feeLevel
          })
        });
      }

      var fee = feeLevelValue.feePerKB;
      $log.debug('Dynamic fee: ' + feeLevel + ' ' + fee + ' SAT');

      return cb(null, fee);
    });
  };

  root.getFeeLevels = function(cb) {
    var config = configService.getSync();
    var unitName = config.wallet.settings.unitName;
    var walletClient = bwcService.getClient(null, {
      bwsurl: config.bws.url
    });

    var networks = lodash.map(bwcService.getBitcore().Networks.list(), 'name');
    asyncService.map(networks, walletClient.getFeeLevels.bind(walletClient), function (err, levels) {
      if (err) {
        cb(gettextCatalog.getString('Could not get dynamic fee'));
        return;
      }
      lodash.flatten(levels).forEach(function (level) {
        level.feePerKBUnit = txFormatService.formatAmount(level.feePerKB) + ' ' + unitName;
      });
      var feeLevels = {};
      networks.forEach(function (network, i) {
        feeLevels[network] = levels[i];
      });
      cb(null, feeLevels);
    });
  };

  return root;
});
