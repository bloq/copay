'use strict';

angular.module('copayApp.services').factory('addressbookService', function(asyncService, bitcore, storageService, lodash) {
  function getNetworks() {
    return lodash.map(bitcore.Networks.list(), 'name');
  }

  var root = {};

  function getContact(addr, network, cb) {
    storageService.getAddressbook(network, function(err, _ab) {
      if (err) {
        cb(err);
        return;
      }
      var ab = _ab && JSON.parse(_ab) || {};
      return cb(null, ab && ab[addr] || null);
    });
  }

  root.get = function(addr, cb) {
    asyncService.map(getNetworks(), function (network, cb) {
      getContact(addr, network, cb);
    }, function (err, contacts) {
      cb(err, lodash.find(contacts));
    });
  };

  function listContacts(network, cb) {
    storageService.getAddressbook(network, function(err, ab) {
      ab = ab && JSON.parse(ab) || {};
      cb(err, ab);
    });
  }

  root.list = function(cb) {
    asyncService.map(getNetworks(), listContacts, function (err, lists) {
      cb(err, lists && lists.reduce(function (ab, list) {
        return lodash.defaults(ab, list);
      }, {}));
    });
  };

  root.add = function(entry, cb) {
    var network = (new bitcore.Address(entry.address)).network.name;
    storageService.getAddressbook(network, function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isArray(ab)) ab = {}; // No array
      if (ab[entry.address]) return cb('Entry already exist');
      ab[entry.address] = entry;
      storageService.setAddressbook(network, JSON.stringify(ab), function(err, ab) {
        if (err) return cb('Error adding new entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.remove = function(addr, cb) {
    var network = (new bitcore.Address(addr)).network.name;
    storageService.getAddressbook(network, function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isEmpty(ab)) return cb('Addressbook is empty');
      if (!ab[addr]) return cb('Entry does not exist');
      delete ab[addr];
      storageService.setAddressbook(network, JSON.stringify(ab), function(err) {
        if (err) return cb('Error deleting entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.removeAll = function() {
    asyncService.map(getNetworks(), storageService.removeAddressbook, lodash.noop);
  };

  return root;
});
