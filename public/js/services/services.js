var srv=angular.module('angularServices',[]);
srv.service("http_post",["$q","$http",function($q,$http){
	this.with_this=function(target_path,serialized_data){
	var defer=$q.defer();
		$http({method:'POST', url:target_path, data:serialized_data, headers:{'Content-Type':'application/x-www-form-urlencoded'}}).then(function(ret){
			defer.resolve(ret);
		});
		return defer.promise;
	};
}]);
srv.service("passport",["$rootScope", "$http", "$window","$location","$q",function($rootScope, $http, $window,$location,$q){
	this.selectProvider=function(provider){
		var trig_path=('/auth/'+provider);
		$window.location.href=trig_path;
	};
	this.parseAPI=function(){
		//alert('Parsing API');
		var defer=$q.defer();
		$http.get('/auth/complete/api').then(function(ret){
			//alert(JSON.stringify(ret));
			$rootScope.acct_exists=ret.data.acct_exists;
			$rootScope.provider=ret.data.provider;
			$rootScope.username=ret.data.profile.displayName;//Individuals Name on Profile
			$rootScope.profileImageURL=ret.data.profile.photos[0].value;//Profile Image
			defer.resolve({acct_exists:ret.data.acct_exists});//Display UX Login Prompt
		});
		//alert('ACCT_EXIST:'+$rootScope.acct_exists);
		return defer.promise;
	};
	this.initAccount=function(){
		//alert('Initializing Account...');
		var defer=$q.defer();
		$http.get('/create_acct').then(function(ret){
			defer.resolve(ret);
		});
		return defer.promise;
	};
}]);
//Service to check the 'accounts' DB table entry to see if the Username has already been taken.
/*srv.service("fb_chk_acct", ["$rootScope", "$q", function($rootScope, $q){
	this.user_exist=function(username,social){
		var defer=$q.defer();
		/*switch(social){
			case true:
				//Check to see if the Social UID is already registered by querying...
				$rootScope.loopback_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid);
				break;
			default:
				//Check to see if the Username is already registered by querying...
				$rootScope.loopback_ref=new Firebase('https://todolog.firebaseio.com/loopback/'+username+'/');
				break;
		}
		//$rootScope.loopback_ref=new Firebase('https://todolog.firebaseio.com/loopback/'+$rootScope.uid+'/username/'+username+'/');
		$rootScope.loopback_ref.once("value",function(data_ret){
			if(data_ret.val()==null){//The 'Username' hasn't already been registered	
				defer.resolve({exists:false});	
			}else{
				feedback("Username: "+$rootScope.username+" already exists.",'signup','e');
				defer.resolve({exists:true});	
			}
		});*/
		/*defer.resolve({exists:false});//Pretends that user account doesn't already exists in MongoDB.	
		return defer.promise;
	}
}]);*/

/*Service to register new accounts, and srvend an entry into 'accounts' 
 * containig username & e-mail pairs for username login option to retrieve/loopback 
 * it's coorospondin e-mail for 'E-mail & Password' based Authentication.*/
/*srv.service("fb_signup", ["$rootScope","$http", "$q", function($rootScope, $http, $q){
	this.register_acct=function(username,email,password){
		var defer=$q.defer();
		//#############################[WORKING ON THIS AREA]#############################
		//var data=("?username="+username+"&email="+email+"&password="+password);
		var data_serialized={data:{username:username,email:email,password:password}};
		$http({method:'POST',url:'/signup',data:data_serialized}).success(function(ret){
		alert(ret);
		});
		//################################################################################
		/*$rootScope.fb_ref=new Firebase('https://todolog.firebaseio.com');
		$rootScope.fb_ref.createUser({
			email:email,
			password:password
		},function(error,userData){
			if(error){
				feedback("Failed to create account."+error,'signup','e');
			}else{*/
				//Get the reference to 'username' property from FirebaseDB 'fb_username' factory
	//[uncomment]---->	$rootScope.uid=userData.uid.replace(/\{*\}*/g,'');
				/*$rootScope.loopback_ref=new Firebase('https://todolog.firebaseio.com/loopback/'+username+'/');
				$rootScope.username_ref=new Firebase('https://todolog.firebaseio.com/loopback/uid2usr/'+$rootScope.uid+'/username/');
				$rootScope.username_ref.set(username,function(errorObj){
					if(errorObj){
						feedback("Failed to register username:"+username+".",'signup','e');
						defer.resolve({reg_stat:false});
					}else{
						//Since 'Username' hasn't been already registered, register it with the E-mail alias.*/
						/*$rootScope.loopback_ref.set({'username':username,'email':email, 'uid':$rootScope.uid},
							function(errorObj){
								if(errorObj){
									feedback("Failed to register username:"+username+".",'signup','e');
									defer.resolve({reg_stat:false});
								}else{
									//alert("Registry Success!");
									defer.resolve({reg_stat:true});
								}
							});
					}
				});
			}
		});*/
		/*return defer.promise;
	}
}]);*/
/*Service to retreive/loopback the coorosponding e-mail associated 
 * with a given Username entered during login, so that in the backend 
 * it's still really doing an 'E-mail & Password' Authentication*/
/*srv.service("fb_auth_loop", ["$rootScope", "$q", function($rootScope, $q){
	this.loopback=function(username,uid){
		var defer=$q.defer();
		$rootScope.loopback_ref=new Firebase('https://todolog.firebaseio.com/loopback/'+username+'/');
		//$rootScope.loopback_ref=new Firebase('https://todolog.firebaseio.com/loopback/'+uid+'/');
		$rootScope.loopback_ref.once("value",function(data_ret){
			var tmp_obj=data_ret.val();
			if(tmp_obj==null){
				feedback("You've entered incorrect Username, E-mail and/or Password credentials.",'login','e');
			}else{
				defer.resolve(tmp_obj);
			}
		});
		return defer.promise;
	}
}]);*/
/*Service to handle 'E-mail & Password' authentication.*/
/*srv.service("fb_login_hndl", ["$rootScope", "$q", function($rootScope, $q){
	var session={'true':'default','false':'sessionOnly'};
	this.login=function(email,password){
		var defer=$q.defer();
		$rootScope.stat=false;
		$rootScope.uid=null;
		$rootScope.login_ref=new Firebase('https://todolog.firebaseio.com');
		$rootScope.login_ref.authWithPassword({
			email:email,
			password:password
		},function(error,authData){
			if(error){
				if(typeof(authData)=='undefined'){
					feedback("You've entered either the wrong Username, E-mail or Password. Give it another go.",'login','e');
				}
			}else{
				alert("REMEMBER_SESSION:"+session[$rootScope.persist]);
				feedback("Successfully logged in!",'login','g');
				$rootScope.stat=true;*/
				//$rootScope.uid=authData.uid.replace(/\{*\}*/g,'');
				//Trigger the then({stat:$rootScope.stat,uid:$rootScope.uid}) method following the service call.
				/*defer.resolve({stat:$rootScope.stat,uid:$rootScope.uid});
			}
		},{
			remember:session[$rootScope.persist]
		});
		return defer.promise;
	}
}]);*/

//Third-party API Login-Extraction
/*srv.service("get_authData", ["$rootScope", "$q", function($rootScope,$q){
	this.processAPI=function(provider,authData){
		var defer=$q.defer();
		//Extract API UID
		var tmp_uid_str=JSON.stringify(authData.uid);
		var tmp_uid=tmp_uid_str.split(':');
		//#############################################
		//$rootScope.uid=tmp_uid[1].replace(/\"/g,'');
		$rootScope.username=authData[provider].displayName;
		$rootScope.uid=($rootScope.username.replace(/\s/g,'_')+'-'+tmp_uid[1].replace(/\"/g,''));
		$rootScope.email=authData[provider].email;
		$rootScope.profileImageURL=authData[provider].profileImageURL;
		defer.resolve({stat:true});
		feedback("Login was successfull, redirecting...",'login','g');//<----?
		return defer.promise;
	};
}]);*/

//Retreive the 'Username' associated with the current UID (User Identifer serial #)
/*srv.service("fb_username",["$rootScope","$q",
		function($rootScope, $q){
			this.get_username=function(uid){//For E-mail login's.
				var defer=$q.defer();
				$rootScope.username_ref=new Firebase('https://todolog.firebaseio.com/loopback/uid2usr/'+uid+'/username/');
				$rootScope.username_ref.once("value",function(data_ret){
					defer.resolve({username:data_ret.val()});
				},function(errorObj){
					defer.resolve({username:null});
					$scope.$srvly($location.path('signup'));
				});
				return defer.promise;
			}
		}]);*/
srv.service('fb_wipe',["$rootScope","$q",
		function($rootScope,$q){
			var defer=$q.defer();
			this.wipeThis=function(uid_username,what){
				switch(what){
					case 'days_buffer':
						var wipe_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid+'/days_buffer/');
						break;
					default:
						var wipe_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid+'/'+what+'/');
						break;
				}
				wipe_ref.remove(function(error){
					if(error){
						defer.resolve({stat:'error'});
					}else{
						defer.resolve({stat:true});
					}});
				return defer.promise;
			}
		}]);
srv.service("fb_days_tmp",["$rootScope", "$q",
		function($rootScope, $q){
			$rootScope.days_tmp_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid+'/days_tmp/');
			this.getIndex=function(){
				var defer=$q.defer();
				$rootScope.days_tmp_ref.once("value",function(data_ret){
					var tmp_obj=data_ret.val();
					if(tmp_obj!=null){
						defer.resolve({"days_index":tmp_obj.days_index});
					}else{
						defer.resolve({"days_index":null});
					}
				},function(errorObj){
					defer.resolve({"days_index":null});
				});
				return defer.promise;
			};
			this.setIndex=function(days_tmp){
				var defer=$q.defer();
				$rootScope.days_tmp_ref.set(days_tmp,function(onError){
					if(onError){
						defer.resolve({stat:false});
					}else{
						defer.resolve({stat:true});
					}});
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
//Configure Angular Firebase Synchronized 'Todos' Array
srv.factory("fb_arrayTodos",["$rootScope","$firebaseArray",
		function($rootScope,$firebaseArray){
			var todos_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid+'/todos/');
			return $firebaseArray(todos_ref);
		}]);

//Configure Angular Firebase Synchronized 'Done' Array
srv.factory("fb_arrayDone",["$rootScope","$firebaseArray",
		function($rootScope,$firebaseArray){
			var done_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid+'/done/');
			return $firebaseArray(done_ref);
		}]);

//Configure Angular Firebase Synchronized 'Months' Array
srv.factory("fb_arrayMonths",["$rootScope","$firebaseArray",
		function($rootScope,$firebaseArray){
			var months_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid+'/save/months');
			return $firebaseArray(months_ref);
		}]);
//Configure Angular Firebase Synchronized 'Days' Array
srv.factory("fb_arrayDays",["$rootScope","$firebaseArray",
		function($rootScope,$firebaseArray){
			var days_ref=new Firebase('https://todolog.firebaseio.com/accounts/'+$rootScope.uid+'/save/months/days/');
			return $firebaseArray(days_ref);
		}]);
