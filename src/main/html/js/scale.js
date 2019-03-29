/*
Copyright 2015 Tremolo Security, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
(function(){
  var app = angular.module('scale',['treeControl','ngSanitize']);





    app.controller('ScaleController',['$compile', '$scope','$window','$http','$interval',function($compile, $scope, $window, $http,$interval){


      this.appIsError = false;
      this.sessionLoaded = true;
      this.config = {
        "searchBases": ["County","Portal","Both"],
        "searchableAttributes" : [
          {
            "name":"givenname",
            "label":"First Name",
            "picked":false,
            "value":""
          },
          {
            "name":"sn",
            "label":"Last Name",
            "picked":false,
            "value":""
          },
          {
            "name":"mail",
            "label":"Email Address",
            "picked":false,
            "value":""
          },
          {
            "name":"uid",
            "label":"Login ID",
            "picked":false,
            "value":""
          }
        ],
        "resultsAttributes":[
          {
            "name":"givenname",
            "label":"First Name",
          },
          {
            "name":"sn",
            "label":"Last Name"
          },
          {
            "name":"mail",
            "label":"Email Address"
          },
          {
            "name":"uid",
            "label":"Login ID"
          },
          {
            "name":"locked",
            "label":"Locked"
          }
        ],
        "displayNameAttribute":"uid"
      };
      this.search_base = "Both";
      this.currentTab = 'home';
      this.displayName = 'No User Loaded';
      this.showModal = false;

      this.searchResults = [];
      this.testSearchResults = [
        {
          "uid":"mmolsey",
          "givenname":"Matt",
          "sn":"Mosley",
          "mail":"marc+1111@tremolo.io",
          "picked":false,
          "canEdit":true,
          "groups":["tax","cpan"],
          "locked":"0"
        },
        {
          "uid":"jjackson",
          "givenname":"Jennifer",
          "sn":"Jackson",
          "mail":"jjackson@tremolo.io",
          "picked":false,
          "canEdit":true,
          "groups":["tax"],
          "locked":"1"
        },
        {
          "uid":"rrobinson",
          "givenname":"Robert",
          "sn":"Robinson",
          "mail":"rrobinson@tremolo.io",
          "picked":false,
          "canEdit":false,
          "groups":["cpan"],
          "locked":"1"
        }
      ];


      this.modalTitle;
      this.modalMessage;

      this.newUser = {};
      this.attributeConfigs = [];
      this.showForm = true;
      this.showUser = false;
      this.searchDisabled = false;

      this.treeOptions = {
        nodeChildren: "subOrgs",
        dirSelectable: true,
        injectClasses: {
            ul: "a1",
            li: "a2",
            //liSelected: "a7",
            iExpanded: "a3",
            iCollapsed: "a4",
            iLeaf: "a5",
            label: "a6",
            //labelSelected: "a8"
        }
    };

      this.portalOrgs = [{"id":"687da09f-8ec1-48ac-b035-f2f182b9bd1e","name":"MyOrg","description":"MyOrg Enterprise Applications","subOrgs":[{"id":"fc8799cf-b947-4626-94bd-1ddda226bc16","name":"Auditors","description":"Reports for auditors","subOrgs":[]},{"id":"138d5182-c08d-41d5-bc42-6a4f406cf81b","name":"Users","description":"Tools for County users","subOrgs":[]},{"id":"0647d570-eb9c-482c-b0db-872fffd9c1b3","name":"Application Owners","description":"Tools for application owners","subOrgs":[]},{"id":"1dcf8354-03bd-416a-b613-50515bab38f2","name":"Operators","description":"For day-to-day operators","subOrgs":[]},{"id":"1e1f2a6b-b52d-4f23-84ce-dc0b2c9b46a8","name":"CPAN","description":"Workflows and Reports Specific to CPAN","subOrgs":[]}]}];
      this.workflows = [{"name":"unlock-county-user","description":"Unlock county users that are locked","label":"Unlock County User","uuid":"4d3b5375-60c4-439f-8529-6e4d64f2ba03"},{"name":"unlock-portal-user","description":"Unlock External (Portal) users that are locked","label":"Unlock External User","uuid":"453aefec-a800-4f35-b826-3e333218af53"},{"name":"send-password-reset","description":"Initialize a password reset for the user","label":"Send Password Reset","uuid":"659a5810-3aff-4e29-b993-6b0320fbaade"}];
      this.wfMetaData = {"canDelegate":true,"canPreApprove":true,"uuid":"8432aafe-5079-4cb1-a56a-85d7a120bf43"};



      //Methods

      this.isWorkflowBeingRun = function() {
        return (typeof this.workflowToRun !== 'undefined') || (this.workflowToRun != null);
      }

      this.executeWorkflow = function(wf) {
        this.workflowToRun = wf;

        //alert(this.wfMetaData.canDelegate && this.wfMetaData.canPreApprove);
      }
      this.isUsersSelected = function() {
        if (this.searchResults.length == 0) {
          return false;
        } else {
          thereIsAPick = false;
          
          this.searchResults.forEach(function(value) {thereIsAPick = thereIsAPick || value.picked});
          return thereIsAPick;
        }
      }
      this.finishLogout = function() {
          window.location = this.config.logoutURL;
      };


      this.saveUser = function() {
        alert(JSON.stringify(this.currentUser));
      }

      this.viewUser = function(userObj) {
        this.modalMessage = "Submitting Search...";
        this.showModal = true;
        
        

        
        user_dn = userObj['dn'];

        $http.put('ops/user/' + encodeURIComponent(user_dn)).then(
          function(response) {
            $scope.scale.currnetUser = response.data;
            this.showForm = false;
            this.showUser = true;
    
          },
          function(response) {
            //TODO error handling
          }
        );


        /*this.currentUser = userObj;

        this.currentUser.metaData = {
          "uid": {
            "readOnly":true,
            "type":"text"
          },
          "givenname":{
            "readOnly":false,
            "type":"text"
          },
          "sn":{
            "readOnly":false,
            "type":"text"
          },
          "mail":{
            "readOnly":false,
            "type":"text"
          },
          "locked":{
            "readOnly":false,
            "type":"list",
            "values":[
              {
                "name":"Yes",
                "value":"1"
              },
              {
                "name":"No",
                "value":"0"
              }
            ]
          }
        }*/
        
      }

      this.viewSearch = function(userObj) {
        this.showForm = true;
        this.showUser = false;

        
      }

      this.search = function() {
        this.modalMessage = "Submitting Search...";
        this.showModal = true;
        $scope.scale.searchDisabled = true;
        $scope.scale.searchSuccess = false;

        //alert("here");


        this.searchResults = this.testSearchResults;

        this.showModal = false;
        $scope.scale.searchDisabled = false;
        $scope.scale.searchSuccess = true;


        


        /*for (var i in $scope.scale.config.attributes) {
          if ($scope.scale.config.attributes[i].type == 'list') {

              if (typeof $scope.scale.newUser.attributes[$scope.scale.config.attributes[i].name] == 'undefined') {
                $scope.scale.newUser.attributes[$scope.scale.config.attributes[i].name] = "";
              } else {
                $scope.scale.newUser.attributes[$scope.scale.config.attributes[i].name] = $scope.scale.newUser.attributes[$scope.scale.config.attributes[i].name].value;
              }


          }
        }*/

        /*$http.post('register/submit',this.newUser).then(
          function(response) {
            $scope.scale.showModal = false;
            $scope.scale.saveUserDisabled = false;
            $scope.scale.newUser = {};
            $scope.scale.newUser.attributes = {};

            for (var i in $scope.scale.config.attributes) {
              $scope.scale.newUser.attributes[$scope.scale.config.attributes[i].name] = '';
            };

            $scope.scale.saveUserSuccess = true;
            $scope.scale.saveUserErrors = [];
            
            $scope.scale.showForm = response.addNewUsers;
            
          },
          function(response) {
            $scope.scale.saveUserErrors = response.data.errors;
            $scope.scale.showModal = false;
            $scope.scale.saveUserDisabled = false;
            $scope.scale.saveUserSuccess = false;
            $scope.scale.showForm = true;
          }
        );*/
      };




      this.isSelectedTab = function(val) {
        return val == this.currentTab;
      };

      this.setSelectedTab = function(val) {
        if (val === 'logout') {
            this.finishLogout();
        } else if (val === 'home') {
          window.location = this.config.homeURL;
        } else {
          this.currentTab = val;
        }



      };

      this.isSessionLoaded = function() {
        return this.sessionLoaded;
      }

      this.setSessionLoadedComplete = function() {
        this.sessionLoaded = true;

      }

      this.isMobile = function() {
        var ow = $window.outerWidth;
        var mobile = (ow <= 991);
        return ! mobile;
      };



      angular.element(document).ready(function () {
        this.displayName = '';
            

            this.attributeConfigs = [];
        this.setSessionLoadedComplete();
        this.appIsError = false;
        this.config = {};
        alert("here");
        /*$http.get('register/config').then(
          function(response) {
            $scope.scale.config = response.data;
            $scope.scale.displayName = '';
            $scope.scale.newUser.attributes = {};

            $scope.scale.attributeConfigs = [];
            
            
            for (var i in $scope.scale.config.attributeNameList) {
              $scope.scale.newUser.attributes[$scope.scale.config.attributeNameList[i]] = '';
              $scope.scale.attributeConfigs.push($scope.scale.config.attributes[$scope.scale.config.attributeNameList[i]]);
            };

            $scope.scale.setSessionLoadedComplete();
            $scope.scale.appIsError = false;


            if ($scope.scale.config.requireReCaptcha) {
            	if (typeof grecaptcha != "undefined") {
	            	grecaptcha.render('recaptcha', {
	                    'sitekey' : $scope.scale.config.rcSiteKey
	                  });
            	} else {


            		$interval(function() {
            			if (captchaloaded == true) {

            				grecaptcha.render('recaptcha', {
        	                    'sitekey' : $scope.scale.config.rcSiteKey
        	                  });

            				captchaloaded = false;
            			}
            		},1000,10);




            	}
            }




          },
          function(response) {
            $scope.scale.appIsError = true;
            //$scope.$apply();
          }

        );*/




      });

    }







    ]);

    app.directive('modal', function () {
        return {
          template: '<div class="modal fade">' +
              '<div class="modal-dialog">' +
                '<div class="modal-content">' +
                  '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                    '<h4 class="modal-title">{{ title }}</h4>' +
                  '</div>' +
                  '<div class="modal-body" ng-transclude></div>' +
                '</div>' +
              '</div>' +
            '</div>',
          restrict: 'E',
          transclude: true,
          replace:true,
          scope:true,
          link: function postLink(scope, element, attrs) {
            scope.title = attrs.title;

            scope.$watch(attrs.visible, function(value){
              if(value == true)
                $(element).modal('show');
              else
                $(element).modal('hide');
            });

            $(element).on('shown.bs.modal', function(){
              scope.$apply(function(){
                scope.$parent[attrs.visible] = true;
              });
            });

            $(element).on('hidden.bs.modal', function(){
              scope.$apply(function(){
                scope.$parent[attrs.visible] = false;
              });
            });
          }
        };
      });

      app.directive("calendar", function() {
          return {
              restrict: "E",
              templateUrl: "templates/calendar.html",
              scope: {
                  selected: "="
              },
              link: function(scope) {
                  scope.selected = _removeTime(scope.selected || moment());
                  scope.month = scope.selected.clone();

                  var start = scope.selected.clone();
                  start.date(1);
                  _removeTime(start.day(0));

                  _buildMonth(scope, start, scope.month);

                  scope.select = function(day) {
                      scope.selected = day.date;
                  };

                  scope.next = function() {
                      var next = scope.month.clone();
                      _removeTime(next.month(next.month()+1).date(1));
                      scope.month.month(scope.month.month()+1);
                      _buildMonth(scope, next, scope.month);
                  };

                  scope.previous = function() {
                      var previous = scope.month.clone();
                      _removeTime(previous.month(previous.month()-1).date(1));
                      scope.month.month(scope.month.month()-1);
                      _buildMonth(scope, previous, scope.month);
                  };
              }
          };

          function _removeTime(date) {
              return date.day(0).hour(0).minute(0).second(0).millisecond(0);
          }

          function _buildMonth(scope, start, month) {
              scope.weeks = [];
              var done = false, date = start.clone(), monthIndex = date.month(), count = 0;
              while (!done) {
                  scope.weeks.push({ days: _buildWeek(date.clone(), month) });
                  date.add(1, "w");
                  done = count++ > 2 && monthIndex !== date.month();
                  monthIndex = date.month();
              }
          }

          function _buildWeek(date, month) {
              var days = [];
              for (var i = 0; i < 7; i++) {
                  days.push({
                      name: date.format("dd").substring(0, 1),
                      number: date.date(),
                      isCurrentMonth: date.month() === month.month(),
                      isToday: date.isSame(new Date(), "day"),
                      date: date
                  });
                  date = date.clone();
                  date.add(1, "d");
              }
              return days;
          }
      });

})();
