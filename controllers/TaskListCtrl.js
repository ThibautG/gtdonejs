var util = require('util')
  , alertService = require('../lib/alert-service')
  , gtdService = require('../lib/gtd-service');

module.exports = function ($, $scope, $rootScope, $route, $location, $routeParams, moment) {

  $scope.init = function (populateFunc, title) {
    var loc;
    loc = $location.path().split('/')[1];
    switch (loc) {
      case 'project':
        $scope.populateFunc = gtdService.getProjectTasks;
        $scope.populateFuncParams = $routeParams.name;
        $scope.listTitle = "Project '" + $routeParams.name + "'";
        $scope.showProjects = false;
        $scope.showContexts = true;
        $scope.noItemMessage = 'Nothing to do for this project :-)';
        break;
      case 'context':
        $scope.populateFunc = gtdService.getContextTasks;
        $scope.populateFuncParams = $routeParams.name;
        $scope.listTitle = "Context '" + $routeParams.name + "'";
        $scope.showProjects = true;
        $scope.showContexts = false;
        $scope.noItemMessage = 'Nothing to do for this context :-)';
        break;
      case 'completed':
        $scope.populateFunc = gtdService.getCompletedTasks;
        $scope.populateFuncParams = null;
        $scope.listTitle = 'Completed';
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.noItemMessage = 'Nothing has been done, maybe you should do something ;-)';
        break;
      case 'search':
        $scope.populateFunc = gtdService.getTasks;
        $scope.populateFuncParams = $routeParams.q;
        $scope.listTitle = "Search result for '" + $routeParams.q + "'";
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.noItemMessage = 'Nothing found, maybe you should try another search ;-)';
        break;
      case 'today':
        $scope.populateFunc = gtdService.getTodayTasks;
        $scope.listTitle = "Today";
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.noItemMessage = 'Congratulations ! You have nothing to do today :-)';
        break;
      case 'next':
        $scope.populateFunc = gtdService.getNextTasks;
        $scope.listTitle = "Next";
        $scope.showProjects = true;
        $scope.showContexts = true;
        $scope.noItemMessage = 'Nothing to do in the future, maybe you should organize your inbox ;-)';
        break;
      case 'inbox':
        $scope.populateFunc = gtdService.getInboxTasks;
        $scope.populateFuncParams = null;
        $scope.listTitle = 'Inbox';
        $scope.showProjects = false;
        $scope.showContexts = true;
        $scope.noItemMessage = 'No item, all tasks are planned ?';
        break;
    }
    $scope.loadTasks();
    $rootScope.title = util.format('(%s) %s - %s', $scope.tasks.length, $scope.listTitle, $rootScope.appTitle);
  };

  $scope.loadTasks = function () {
    $scope.tasks = $scope.populateFunc($scope.populateFuncParams);
  };

  $scope.isSortAsc = function (field) {
    return $scope.sortField === field && $scope.sortOrder > 0;
  };

  $scope.isSortDesc = function (field) {
    return $scope.sortField === field && $scope.sortOrder < 0;
  };

  $scope.sort = function ($event, field) {
    $event.preventDefault();
    if (field !== $scope.sortField) {
      $scope.sortOrder = 0;
    }
    $scope.sortOrder = $scope.sortOrder || 0;
    $scope.sortOrder = (($scope.sortOrder + 2) % 3) - 1;
    $scope.sortField = $scope.sortOrder === 0 ? null : field;
    if ($scope.sortOrder === 0) {
      $scope.loadTasks();
    } else {
      $scope.tasks.sort(function (a, b) {
        var result, date;
        if (a[field] === undefined || a[field] === null) {
          if (b[field] === undefined || b[field] === null) {
            result = 0;
          } else {
            result = -1;
          }
        } else if (a[field] instanceof Date) {
          date = moment(a[field]);
          if (date.isAfter(b[field])) {
            result = 1;
          } else if (date.isBefore(b[field])) {
            result = -1;
          } else {
            result = 0;
          }
        } else {
          if (a[field].toLowerCase() > b[field].toLowerCase()) {
            result = 1;
          } else if (a[field].toLowerCase() < b[field].toLowerCase()) {
            result = -1;
          } else {
            result = 0;
          }
        }
        return result * $scope.sortOrder;
      });
    }
  };

  $scope.toggleComplete = function (task) {
    task.completionDate = task.completed ? gtdService.formatDate(new Date()) : null;
    $rootScope.disableWatchers();
    gtdService.saveFileData(
      $rootScope.settings.todoFile,
      $rootScope.settings.archiveEnabled ? $rootScope.settings.archiveFile : null
    );
    $rootScope.enableWatchers();
    $rootScope.loadData();
    alertService.showAlertMessage($, 'success', 'Task successfully saved.');
    $route.reload();
  };

};