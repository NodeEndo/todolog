var ctrl=angular.module('angularCtrl',['angularServices']);
ctrl.controller('main_ctrl',["$scope", "$rootScope", 
		function($scope, $rootScope){
			this.todo=$rootScope.dynamic.todo;
			this.done=$rootScope.dynamic.done;
			this.days=$rootScope.dynamic.save;
			this.days_index=$rootScope.dynamic.save_index;
		}]);

ctrl.controller('root_ctrl',["$scope", "$rootScope", "$location", "$http", "passport", function($scope, $rootScope, $location, $http, passport){
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
				$http.get('/logout').then(function(ret){
					$rootScope.logged_stat=ret.data.logged_stat;
					if(!$rootScope.logged_stat){
					$scope.$apply($location.path('logout'));
					}
				});
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
ctrl.controller('edit_ctrl',["$rootScope", "$scope","persist",function($rootScope, $scope, persist){
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
		path.days_index=path.days[item_index].index;
		path.todo=path.days[item_index].todos;
		path.done=path.days[item_index].done;
		persist.now('set','todo',path.todo).then(function(onSuccess){
			if(onSuccess.data.saved){
				persist.now('set','save_index',item_index).then(function(onSuccess){//Save|persist the 'save_index' of the associated saved 'todo-list' which is loaded into the Editor.
					if(onSuccess.data.saved){
						persist.now('set','done',path.done).then(function(onSuccess){
							if(onSuccess.data.saved){
								path.days.splice(item_index,1);
								persist.now('set','save',path.days);
							}
						});
					}a
				});
			}
		});
	};
	this.add=function(path){
		//Index Integrety Injection
		//var tmp_json=$.parseJSON("{\"index\":"+(pred_succ_index(path,'add'))+",\"label\":\""+this.temp.label+"\",\"timestamp\":\"\"}");
		var tmp_json={index:pred_succ_index(path,'add'),label:this.temp.label,timestamp:""};
		path.todo.push(tmp_json);
		sortByIndex(path.todo);
		persist.now('set','todo',path.todo);
		this.temp={};
	};
	this.done=function(path,item){
		var item_index=path.todo.indexOf(item);
		//Render timestamp & insert the value into the items' 'timestamp' property.
		item.timestamp=rend_timestamp();
		//Push Todo item to Done list
		path.done.push(item);
		sortByIndex(path.done);
		//Remove Todo item from Todo list.
		path.todo.splice(item_index,1);
		persist.now('unset','todo',path.todo).then(function(onSuccess){
			if(onSuccess.data.saved){
				persist.now('set','done',path.done);
			}
		});
	};
	this.undo=function(path,item){
		var item_index=path.done.indexOf(item);
		path.todo.push(item);
		sortByIndex(path.todo);
		path.done.splice(item_index,1);
		persist.now('unset','done',path.done).then(function(onSuccess){
			if(onSuccess.data.saved){
				persist.now('set','todo',path.todo);

			}
		});
	};
	this.remove=function(path,item,item_type){
		switch(item_type){
			case 'days_item':
				var item_index=path.days.indexOf(item);
				path.days.splice(item_index,1);
				persist.now('set','save',path.days);
				break;
			case 'done_item':
				var item_index=path.done.indexOf(item);
				path.done.splice(item_index,1);
				persist.now('set','done',path.done);
				break;
		}
	};
	//Save the current contents of 'path.todo' & 'path.done' array into 'path.days' packaged with an 'index' property.
	this.save=function(path){
		var tmp_json=null;
		sortByIndex(path.days);
		//alert(path.days_index);
		if(path.days_index==null){
			tmp_json={"index":pred_succ_index(path,'save'),"todos":path.todo,"done":path.done};
		}else{
			tmp_json={"index":path.days_index,"todos":path.todo,"done":path.done};
		}
		path.days.push(tmp_json);
		sortByIndex(path.days);//Sort 'path.days' array, so the Save with the highest 'index' property value is always the last item in the array.
		persist.now('set','save',path.days).then(function(onSuccess){
			if(onSuccess.data.saved){
				path.todo=[];
				path.done=[];
				persist.now('set','todo',path.todo).then(function(onSuccess){
					if(onSuccess.data.saved){
						persist.now('set','done',path.done).then(function(onSuccess){
							path.days_index=null;
							persist.now('set','save_index',null);//Re-set the 'save_index' to null, since the 'todo-list' has been saved.
						});
					}
				});
			}
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
