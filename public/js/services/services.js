var srv=angular.module('angularServices',[]);
srv.service("refresh",["$location","$timeout", function($location, $timeout){
	this.page=function(milisec){
		$timeout(function(){
			location.reload();
		},milisec);
	}
}]);
srv.service("http_post",["$q","$http",function($q,$http){
	this.with_this=function(target_path,serialized_data){
	var defer=$q.defer();
		$http({method:'POST', url:target_path, data:serialized_data, headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(ret){
			defer.resolve(ret);
		});
		return defer.promise;
	};
}]);
srv.service("persist",["$rootScope","$q","$http", "http_post",function($rootScope,$q,$http,http_post){
	this.now=function(exec,what,task){
		var serialized_data=null;
		var defer=$q.defer();
		//var serialized_data=("&exec="+exec+"&uid="+$rootScope.uid+"&what="+what+"&"+what+"="+JSON.stringify(task));
		if(isNaN(task)||typeof(task)=='object'){//If the value passed to the 'task' parameter 'isNot-a-Number' or 'of_type_Object' i.e(A JSON Object)...
		serialized_data=("&uid="+$rootScope.uid+"&what="+what+"&"+what+"="+JSON.stringify(task));//The resulting stringified JSON Object will NOT evaluate to 'undefined'.
		}else{//Otherwise if the value passed to the 'task' parameter is a Number|Int|Float [etc..]...
		serialized_data=("&uid="+$rootScope.uid+"&what="+what+"&"+what+"="+task);//Use the raw value contained in the 'task' variable.
		}
		//alert('http_posting:'+serialized_data);
		http_post.with_this('/persist',serialized_data).then(function(ret){
			defer.resolve(ret);
		});
		return defer.promise;
	};
}]);

srv.service("passport",["$rootScope", "$http", "$window","$location","$q",function($rootScope, $http, $window,$location,$q){
	this.selectProvider=function(provider,redir){
		var trig_path=('/auth/'+provider+'?redir='+redir);
		$window.location.href=trig_path;
	};
	this.parseAPI=function(){
		var defer=$q.defer();
		$http.get('/auth/complete/api').then(function(ret){
			$rootScope.uid=ret.data.uid;
			$rootScope.acct_exists=ret.data.acct_exists;
			$rootScope.provider=ret.data.provider;
			$rootScope.username=ret.data.profile.displayName;//Individuals Name on Profile
			$rootScope.profileImageURL=ret.data.profile.photos[0].value;//Profile Image
			$rootScope.dynamic=ret.data.profile.dynamic;
			defer.resolve({acct_exists:ret.data.acct_exists});//Display UX Login Prompt
		});
		return defer.promise;
	};
	this.initAccount=function(){
		var defer=$q.defer();
		$http.get('/create_acct').then(function(ret){
			defer.resolve(ret.data);
		});
		return defer.promise;
	};
}]);

//Toggle Password Visibility With Glyph Icon Interaction
srv.service("togglePassword", ["$rootScope", "$q", function($rootScope, $q){
	var toggle_val=true;
	this.target=function(target){
		$('.glyphicon-eye-close').on('click',function(){
			toggle_val=!toggle_val;
			$(this).toggleClass('glyphicon-eye-open').promise().done(function(){
				$(this).toggleClass('glyphicon-eye-close');
				var obj={false:'text',true:'password'};
				switch(target){
					case 'reset_pass':
						/* '.prev()' is a jQuery method which selects the previous sibling which is adjacient to 'this'
						   In this case 'this' is the current HTML element that has a CSS class called '.glyphicon-eye-close'.*/
						var parent_focus=$(this).parent().prev();
						$(parent_focus).children().first().attr('type',obj[toggle_val]);
						break;
				}
				$('#'+target+'_input').attr('type',obj[toggle_val]);
			});
		});
	};
}]);
