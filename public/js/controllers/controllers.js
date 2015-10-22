var ctrl=angular.module('angularCtrl',['angularServices']);
ctrl.controller('main_ctrl',["$scope", "$rootScope", "$http", "fb_arrayTodos","fb_arrayDone", "fb_arrayMonths", "fb_arrayDays",
		function($scope, $rootScope, $http, fb_arrayTodos, fb_arrayDone, fb_arrayMonths, fb_arrayDays){
			this.todo=fb_arrayTodos;
			this.done=fb_arrayDone;
			this.months=fb_arrayMonths;
			this.days=fb_arrayDays;
			login_success();
			$rootScope.logged_stat=true;
		}]);

ctrl.controller('root_ctrl',["$scope", "$rootScope", "$location", "passport", function($scope, $rootScope, $location, passport){
	//$('#todolog_btn').hide();
	$rootScope.logged_stat=false;
	this.redir=function(action){
		switch(action){
			case 'splash':
				if($rootScope.logged_stat==false){
					$rootScope.tab_focus=null;
					$scope.$apply($location.path('splash'));
				}else{
					$rootScope.tab_focus=1;
					$scope.$apply($location.path('todolog'));
				}
				break;
			case 'login':
				$scope.$apply($location.path('login'));
				break;
			case 'signup':
				$scope.$apply($location.path('signup'));
				break;
			case 'settings':
				$scope.$apply($location.path('settings'));
				break;
			case 'todolog':
				passport.initAccount().then(function(onSuccess){
					if(onSuccess.success){
						$scope.$apply($location.path('todolog'));
					}else{
						$scope.$apply($location.path('login'));
					}
				});
				$scope.$apply($location.path('todolog'));
				break;
			case 'logout':
				$scope.$apply($location.path('logout'));
				break;
		}
	};
}]);
ctrl.controller('menu_ctrl',["$rootScope",function($rootScope){
	$rootScope.tab_focus=null;

	this.setActive=function(tab){
		$rootScope.tab_focus=tab;
	};
	this.isActive=function(tab){
		return $rootScope.tab_focus==tab;
	};
}]);
var page_index=0;
ctrl.controller('edit_ctrl',["$rootScope", "$scope","fb_wipe","fb_days_tmp", function($rootScope, $scope, fb_wipe,fb_days_tmp){
	this.temp={};
	this.date=function(direction){
		switch(direction){
			case 'next':
				page_index++;
				break;
			case 'back':
				page_index--;
				break;
		}
		$rootScope.page_index=page_index;
	};
	//This method enables one to load the currently saved data from 'path.days' into 'path.todo' & 'path.done' for editing. 
	this.edit=function(path,item){
		var item_index=path.days.indexOf(item);
		//Remember this is an edit, so we continue to use the same value set in the 'index' property of 'path.days[item_index]'.
		var days_tmp={"days_index":path.days[item_index].index,"page_index":null};//Store the value of the Saved items' 'index' property into 'days_index'
		//Wipe out all the 'path.todos' array entries...
		fb_wipe.wipeThis($rootScope.uid,'todos').then(function(onSuccess){
			if(onSuccess.stat=='error'){
			}else{//Then iterate through all the 'path.days' 'todos' array entries...
				if(path.days[item_index].todos!=null){
					$.each(path.days[item_index].todos,function(i,obj_val){
						path.todo.$add(obj_val);//Finally push each 'path.days' 'todos' array entry into 'path.todo'
					});
				}
				//Save the current 'path.days[item_index].index' as 'path.days.days_index' under '/days/' sync-array.
				fb_days_tmp.setIndex(days_tmp).then(function(onSuccess){
					if(onSuccess.stat){//Wipe out all the 'path.done' array entries...
						fb_wipe.wipeThis($rootScope.uid,'done').then(function(onSuccess){
							if(onSuccess.stat=='error'){
							}else{//Then iterate through all the 'path.days' 'done' array entries...
								if(path.days[item_index].done!=null){
									$.each(path.days[item_index].done,function(i,obj_val){
										path.done.$add(obj_val);//Finally push each 'path.days' 'done' array entry into 'path.done'
									});
								}
								//Temporarily remove the Saved list we're editing from 'path.days' while 'path.todo' & 'path.done' contain the data.
								path.days.$remove(item_index);
							}
						});

					}
				});
			}
		});

	};
	this.add=function(path){
		//Index Integrety Injection
		//var tmp_json=$.parseJSON("{\"index\":"+(pred_succ_index(path,'add'))+",\"label\":\""+this.temp.label+"\",\"timestamp\":\"\"}");
		var tmp_json={"index":pred_succ_index(path,'add'),"label":this.temp.label,"timestamp":""};
		path.todo.$add(tmp_json).then(function(){
			sortByIndex(path.todo);//Sort newly rendered path.todo Array
		});
		this.temp={};
	};
	this.done=function(path,item){
		var item_index=path.todo.indexOf(item);
		//Render timestamp & insert the value into the items' 'timestamp' property.
		item.timestamp=rend_timestamp();
		//Remove Todo item from Todo list.
		path.todo.$remove(item_index);
		//Push Todo item to Done list
		path.done.$add(item).then(function(){
			//The tangable sorted 'done' array | 'done_sorted'.
			sortByIndex(path.done);
		});
	};
	this.undo=function(path,item){
		var item_index=path.done.indexOf(item);
		path.done.$remove(item_index);
		//Execute '$add()' followed by 'then()' callback.
		path.todo.$add(item).then(function(){
			sortByIndex(path.todo);//Sort newly rendered path.todo Array
		});
	};
	this.remove=function(path,item,item_type){
		switch(item_type){
			case 'days_item':
				var item_index=path.days.indexOf(item);
				path.days.$remove(item_index);
				break;
			case 'done_item':
				var item_index=path.done.indexOf(item);
				path.done.$remove(item_index);
				break;
		}
	};
	//Save the current contents of 'path.todo' & 'path.done' array into 'path.days' packaged with an 'index' property.
	this.save=function(path){
		var tmp_json=null;
		sortByIndex(path.days);
		fb_days_tmp.getIndex().then(function(onSuccess){
			var days_index=onSuccess.days_index;
			if(days_index==null){
				tmp_json={"index":pred_succ_index(path,'save'),"todos":path.todo,"done":path.done};
			}else{
				//tmp_json={"index":$rootScope.days_index,"todos":path.todo,"done":path.done};
				tmp_json={"index":days_index,"todos":path.todo,"done":path.done};
			}
			path.days.$add(tmp_json).then(function(onSuccess){//Add the contents of 'path.todo' & 'path.done', then()...
				//Sort 'path.days' array, so the Save with the highest 'index' property value is always the last item in the array.
				sortByIndex(path.days);
			});	
			//Execute 'fb_wipe' service & it's wipeThis() method to delete current 'todos' & 'done' entries.
			fb_days_tmp.setIndex(0).then(function(onSuccess){
				if(onSuccess.stat){
					fb_wipe.wipeThis($rootScope.uid,'todos');
					fb_wipe.wipeThis($rootScope.uid,'done');
				}
			});

		});

	};
}]); 
//Generate & initialize the placeholder attribute in 'Todo' <input/>
ctrl.controller('placeholder_ctrl',["$scope",function($scope){
	var placeholder_bnk=[
	"Food shopping for the elves living in my garden.",
	"Hacking the laws of physics to acquire the ability of levitation.",
	"Finding out where the rainbow really ends.",
	"Helping my elderly neighbor take out her trash.",
	"Mowing the lawn and avoiding the flower patch this time.",
	"Building a GI Joe fort out of little branches.",
	"Watching Star Wars Episode 7 before it comes out."];
this.placeholder=placeholder_bnk[randInt(0,placeholder_bnk.length)];//Randomly pick a placeholder for the 'Todo' <input/>
$("input[name=\'add_todo\']").attr("placeholder",this.placeholder);
}]);
