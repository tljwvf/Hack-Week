angular.module('todo', ['ionic'])
    /**
     * The Projects factory handles saving and loading projects
     * from local storage, and also lets us save and load the
     * last active project index.
     */
    .factory('Projects', function() {
        return {
            all: function() {
                var projectString = window.localStorage['projects'];
                if (projectString) {
                    return angular.fromJson(projectString);
                }
                return [];
            },
            save: function(projects) {
                window.localStorage['projects'] = angular.toJson(projects);
            },
            newProject: function(projectTitle) {
                // Add a new project
                return {
                    title: projectTitle,

                    tasks: []
                };
            },
            getLastActiveIndex: function() {
                return parseInt(window.localStorage['lastActiveProject']) || 0;
            },
            setLastActiveIndex: function(index) {
                window.localStorage['lastActiveProject'] = index;
            }
        }
    })

.controller('TodoCtrl', function($scope, $timeout, $ionicModal, Projects, $ionicSideMenuDelegate, $ionicPopup) {

    // A utility function for creating a new project
    // with the given projectTitle
    var createProject = function(projectTitle) {
        var newProject = Projects.newProject(projectTitle);
        $scope.projects.push(newProject);
        Projects.save($scope.projects);
        $scope.selectProject(newProject, $scope.projects.length - 1);
    }


    // Load or initialize projects
    $scope.projects = Projects.all();

    // Grab the last active, or the first project
    $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];

    // Called to create a new project
    $scope.newProject = function() {
        var classPopup = $ionicPopup.prompt({
            title: "Enter username:",
            cancelType: "button-assertive"
        });
        classPopup.then(function(res) {
            if (res) {
                createProject(res);
            }
        });
    };

    // Called to select the given project
    $scope.selectProject = function(project, index) {
        $scope.activeProject = project;
        Projects.setLastActiveIndex(index);
        $ionicSideMenuDelegate.toggleLeft(false);
    };

    $scope.deleteUser = function() {
        var delUser = $ionicPopup.confirm({
            title: "Are you sure you want to delete this user?",
            cancelText: "No",
            okText: "Yes",
            okType: "button-assertive"
        });
        delUser.then(function(res) {
            if (res) {
                var index = Projects.getLastActiveIndex();
                $scope.projects.splice(index, 1);
                Projects.setLastActiveIndex(0);

                $scope.selectProject($scope.projects[Projects.getLastActiveIndex()], 0);
                Projects.save($scope.projects);
                if ($scope.projects.length == 0) {
                    $scope.newProject();
                }
            }
        });
    }
    $scope.showInfo = function(index) {
        var currentShow = $scope.activeProject.tasks[index];
        var currentEpisode = currentShow.episode;
        var episode = currentShow.maxEpisode;
        var remaining = (episode-currentEpisode);
        var infoPopup = $ionicPopup.confirm({
            title: currentShow.title,
            template: "Current episode: " + currentEpisode + "<br>Total episodes: " + episode + "<br>Remaining episodes: " + remaining,
            okText: "Next episode",
            cancelText: "OK",
            okType: 'button-balanced',
            cancelType: 'button-positive'
        });
        infoPopup.then(function(res) {
            if(res){
                $scope.activeProject.tasks[index].episode++;
            }
        });
        
    }
    
    $ionicModal.fromTemplateUrl('new-task.html', function(modal) {
        $scope.taskModal = modal;
    }, {
        scope: $scope
    });

    $scope.createTask = function(task) {
        if (!$scope.activeProject || !task) {
            return;
        }

        if (task.timeMinute < 10)
            task.time = task.timeHour + ":" + "0" + task.timeMinute;
        else
            task.time = task.timeHour + ":" + task.timeMinute;

        $scope.activeProject.tasks.push({
            title: task.title,
            episode: task.episode,
            maxEpisode: task.maxEpisode,
            ongoing: true,
            day: task.day,
            time: task.time
        })

        $scope.taskModal.hide();

        Projects.save($scope.projects);

        task.title = "";
    };

    $scope.newTask = function() {
        $scope.taskModal.show();
    };

    $scope.closeNewTask = function() {
        $scope.taskModal.hide();
    }

    $scope.toggleProjects = function() {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $timeout(function() {
        if ($scope.projects.length == 0) {
            while (true) {
                var projectTitle = $ionicPopup.prompt({
                    title: "Enter username:"
                });
                projectTitle.then(function(result) {
                    createProject(result);
                });
                break;
            }
        }
    }, 1000);

    $scope.remaining = function() {
        var count = 0;
        angular.forEach($scope.activeProject.tasks, function(project) {
            count += project.done ? 0 : 1;
        });
        return count;
    };

    $scope.archive = function() {
        var oldProjects = $scope.activeProject.tasks;
        $scope.activeProject.tasks = [];

        angular.forEach(oldProjects, function(project) {
            if (!project.done) $scope.activeProject.tasks.push(project);
        });

        Projects.save($scope.projects);
    };

    $scope.refresh = function(checked, index) {
        Projects.save($scope.projects);
    };

    $scope.removeAll = function() {
        $scope.activeProject.tasks = [];
        Projects.save($scope.projects);
    };

    $scope.removeTodos = function(todo) {
        var tempTodos = $scope.activeProject.tasks;
        tempTodos.splice(tempTodos.indexOf(todo), 1);
        Projects.save($scope.projects);
    };

})