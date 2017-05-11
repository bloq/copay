angular.module('copayApp.services').factory('asyncService', function($q) {
  'use strict';

  function map(collection, iterator, cb) {
    $q.all(collection.map(function (item) {
      var deferred = $q.defer();
      iterator(item, function (err, result) {
        if (err) {
          deferred.reject(err);
        }
        deferred.resolve(result);
      });
      return deferred.promise;
    })).then(function (results) {
      cb(null, results);
    }).catch(cb);
  }

  return {
    map: map
  };
});
