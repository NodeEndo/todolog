angular.module('angularRoutes',[]).config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider){
	$routeProvider.otherwise('/splash');//The default view is 'login.html'
		$routeProvider.when('/splash',{
			url:'/splash',
			templateUrl:'views/splash.html',
			controller:function(){
				$('.root_ui_btn').show();
				$('#todolog_btn,.todo_ui_btn').hide();
			},
			controllerAs:"splash"
		}).when('/login',{
			url:'/login',
			templateUrl:'views/login.html',
			controller:["$scope", "$rootScope", "$location", "$timeout", /*"$firebaseArray", "fb_login_hndl", "fb_auth_loop", "fb_chk_acct", "fb_username","get_authData",*/ "togglePassword","passport", "http_post", function($scope, $rootScope, $location, $timeout, /*$firebaseArray, fb_login_hndl, fb_auth_loop, fb_chk_acct, fb_username,get_authData,*/ togglePassword,passport,http_post){
				$('#msg_box').hide();
				this.persist=false;
				var toggle_val=true;
				this.username=null;
				this.email=null;
				this.pass=null;
				//$('#todolog_btn').hide();
				$('#todolog_btn,.todo_ui_btn').hide();
				$('.root_ui_btn').show();
				if($rootScope.reg_stat){
					feedback($rootScope.username+" was successfully registered!",'login','g');
				}
				togglePassword.target('login_pass');	
				this.reset=function(what){
					switch(what){
						case 'password':
							$('#pwd-reset-ui').show();
						break;
					}
					$scope.$apply($location.path('password-reset'));
				};
				//Authentication Prompt Functionality
				this.cancel=function(){
					$('#msg_box').hide();
					$scope.$apply($location.path('login'));
				};
				//Retrieve Profile Data
				passport.parseAPI().then(function(onSuccess){
					if(onSuccess.acct_exists){
						//alert('Account Exists!');
						$scope.$apply($location.path('todolog'));
					}else{
						$('#msg_box').slideDown(1000);
					}
				});

				//Third-party Login Authentication (Google, Twitter, Facebook)
				this.popup=function(provider){
					passport.selectProvider(provider);
					/*$rootScope.provider=(provider.charAt(0).toUpperCase()+provider.substr(1).toLowerCase());
					$rootScope.provider_ref=new Firebase("https://todolog.firebaseio.com");
					$rootScope.provider_ref.authWithOAuthPopup(provider, function(error, authData){
						if(error){
							if(error.code=="TRANSPORT_UNAVAILABLE"){
								provider_ref.authWithOAuthRedirect(provider, function(error, authData){
									if(error){
										feedback("In your browser settings try enabling pop-up's.",'login','e');
									}else{
										get_authData.processAPI(provider,authData).then(function(onSuccess){
											if(onSuccess.stat){
											fb_chk_acct.user_exist(null,true).then(function(onSuccess){
												if(onSuccess.exists){	
													$scope.$apply($location.path('todolog'));
												}else{
												$('#msg_box').slideDown(5000);
												}
											});
											}else{
											$scope.$apply($location.path('login'));
											}
										});
									}
								});
							}else{
								feedback("You've entered either the wrong Username, E-mail or Password with "+(provider.charAt(0).toUpperCase()+provider.substr(1))+". Give it another go.",'login','e');
							}
						}else{
							get_authData.processAPI(provider,authData).then(function(onSuccess){
								if(onSuccess.stat){
									fb_chk_acct.user_exist(null,true).then(function(onSuccess){
										if(onSuccess.exists){	
											$scope.$apply($location.path('todolog'));
										}else{
											$('#msg_box').slideDown(5000);
										}
									});
									$('.msg_box').css('display','block');
									//$scope.$apply($location.path('todolog'));
								}else{
									$scope.$apply($location.path('login'));
								}
							});
						}
					});*/
				};
				this.login=function(){
					$rootScope.persist=this.persist;
					feedback("Logging in with supplied credentials!",'login','g');
					//Use JS RegEx to filter E-mail vailiation
					var email_opt=/^[a-zA-Z0-9]{1,}\@[a-zA-Z]{2,}\.\D{2,}$/.exec(this.email);
					if(email_opt==null){
						this.username=$('#email_input').val();
						$rootScope.pass=this.pass;
						var user_valid=/^[a-zA-Z0-9]{5,}$/.exec(this.username);
						if(user_valid==null){
							feedback("(UCO), Heads-up! It's an Unidentified Character Object!",'login','e');
							$('#email_input').addClass('ng-dirty ng-invalid');
						}else{
							feedback("Attempting to login with supplied Username..."+this.username,'login','g');
							var login_serialized=("username="+this.username+"&password="+this.pass);
							http_post.with_this('/login',login_serialized).then(function(onSuccess){
								if(onSuccess.data.success){
									$timeout(function(){//After 1 milisecond, refresh the login page.
									location.reload();
									},1);
								}else{
									$scope.$apply($location.path('signup'));
								}
							});
						
							/*fb_auth_loop.loopback(this.username).then(function(onSuccess){
								$rootScope.username=onSuccess.username;//Assign the 'username' value temporarily to global.username
								$rootScope.email_loopback=onSuccess.email;//Assign the retrieved 'email' & temporarily to global.email
								//Use the 'fb_login_hndl' (login handle) service while executing it's login() method, passing appropriate params.
								fb_login_hndl.login($rootScope.email_loopback,$rootScope.pass).then(function(onSuccess){
									$rootScope.logged_stat=onSuccess.stat;
									$rootScope.uid=onSuccess.uid;
									if(onSuccess.stat){//Check the Username login status, if it's true...
										login_success();
										$rootScope.uid=($rootScope.username.replace(/\s/g,'_')+'-'+$rootScope.uid);
										$scope.$apply($location.path('todolog'));
										
									}else{//Else, if it's false...
										$scope.$apply($location.path('login'));
									}
								});
							});*/
						}
					}else{
						feedback("Attempting to login with supplied E-mail...",'login','g');
						var login_serialized=("username="+this.email+"&password="+this.pass);
						http_post.with_this('/login',login_serialized).then(function(onSuccess){
							if(onSuccess.data.success){
								$timeout(function(){//After 1 milisecond, refresh the login page.
									location.reload();
								},1);
							}else{
								$scope.$apply($location.path('signup'));
							}
						});

						/*fb_login_hndl.login(this.email,this.pass).then(function(onSuccess){
							$rootScope.logged_stat=onSuccess.stat;
							$rootScope.uid=onSuccess.uid;
							if(onSuccess.stat){//Check the E-mail login status, if it's true...
								//Retreive value set to 'username' by using the 'fb_username.get_username(uid)' service method.
								fb_username.get_username($rootScope.uid).then(function(onSuccess){
									//The store the returned 'username' into 'global.username'
									$rootScope.username=onSuccess.username;
									login_success();
									$rootScope.uid=($rootScope.username.replace(/\s/g,'_')+'-'+$rootScope.uid);
									/*Since we're guarunteed to have extracted the 'username' 
									Re-direct to the 'todolog' UI View.*/
									/*$scope.$apply($location.path('todolog'));
								});
							}else{//Else, if it's false...
								$scope.$apply($location.path('login'));
							}
						});*/
					}
				};
				this.redir=function(){
				$scope.$apply($location.path('signup'));
				};
			}],
			controllerAs:"login"
		}).when('/password-reset',{
			url:'/password-reset',
			templateUrl:'views/password-reset.html',
			controller:["$scope","$rootScope",function($scope,$rootScope){
				$('#signup-opt').hide();
				this.email=null;
				//Handles Password Reset Requests.
				this.password=function(){
					$rootScope.email=this.email;
					$rootScope.fb_ref=new Firebase("https://todolog.firebaseio.com");
					var email_opt=/^[a-zA-Z0-9]{1,}\@[a-zA-Z]{2,}\.\D{2,}$/.exec(this.email);
					if(email_opt==null){
					feedback("You must enter in the E-mail address associated with your Todolog account.",'pwd_reset','e');
					$('#email_input').addClass('ng-dirty ng-invalid');
					}else{
					$rootScope.fb_ref.resetPassword({email:this.email}, function(onError){
						if(onError==null){
							$('#pwd-reset-ui').html("<h2>Password Reset</h2></br>Instructions to reset your password has been sent to "+this.email+"</br></br>Check your inbox ;)").show();
							feedback($('#pwd_reset_feedback').val(),'pwd_reset','e');
						}else{
							switch(onError.code){
								case 'INVALID_USER':
									$('#pwd_reset_feedback').html("The E-mail address <span style='color:rgb(255,0,0);'>"+$rootScope.email+"</span> doesn't exist.</br></br>Please try again.");
									$('#signup-opt').show();
									$('#email_input').addClass('ng-dirty ng-invalid');
									break;
							}
						}
					});
					}
				};
			}],
			controllerAs:"reset"
		}).when('/signup',{
			url:'/signup',
			templateUrl:'views/signup.html',
			controller:["$scope","$rootScope","$location","$http", /*"$firebaseArray", "fb_chk_acct", "fb_signup",*/"togglePassword","http_post", function($scope, $rootScope, $location, $http, /*$firebaseArray, fb_chk_acct, fb_signup,*/ togglePassword, http_post){
			this.username=null;
			this.email=null;
			this.pass=null;
			togglePassword.target('signup_pass');
			this.reg=function(){
					feedback("Attempting to register supplied credentials.",'signup','g');
					//Use JS RegEx to filter Username vailiation
					var user_valid=/^[a-zA-Z0-9]{5,}$/.exec(this.username);
					//Use JS RegEx to filter E-mail vailiation
					var email_valid=/\D{1,}\d*\@\D{2,}\.\w{2,}/.exec(this.email);
					//Use JS RegEx to filter Password vailiation (At least 1:/^(Digit)(Low-Case)(Up-Case)[At Least 8 Letters or Numbers]$/)
					var pass_valid=/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{9,}$/.exec(this.pass);
					if((user_valid==null)||(email_valid==null)||(pass_valid==null)){
						if(user_valid==null){
							feedback("Username must have at least 5 or more alphanumeric characters.",'signup','e');
							$('#user_input').addClass('ng-dirty ng-invalid');
						}else if(email_valid==null){
							feedback("Problem with E-mail formatting.",'signup','e');
							$('#email_input').addClass('ng-dirty ng-invalid');
						}else if(pass_valid==null){
							feedback("Problem with Password formatting.\r\n Password requires at least 9 letters & or Numbers, it's manditory to use at least 1 Capital, 1 Lowercase and 1 Number.",'signup','e');
							$('#pass_input').addClass('ng-dirty ng-invalid');
						}
					}else{
						$rootScope.user_exist=true;
						$rootScope.username=this.username;
						$rootScope.email=this.email;
						$rootScope.password=this.pass;
						var signup_serialized=("username="+this.username+"&email="+this.email+"&password="+this.pass);
						http_post.with_this('/signup',signup_serialized).then(function(onSuccess){
							if(onSuccess.data.success){
								$scope.$apply($location.path('login'));
							}else{
								$scope.$apply($location.path('signup'));
							}
						});
						
						//Scan the 'accounts' DB table entry to see if the Username has already been taken.
						/*fb_chk_acct.user_exist($rootScope.username).then(function(onSuccess){
							$rootScope.user_exist=onSuccess.exists;
							if($rootScope.user_exist==false){//If the 'Username' hasn't already been registered continue...
								//Register account with 'fb_signup' Service by executing it's 'register_acct()' parameter...
								fb_signup.register_acct($rootScope.username,$rootScope.email,$rootScope.password).then(function(onSuccess){
								        $rootScope.reg_stat=onSuccess.reg_stat;
									if(onSuccess.reg_stat){
										$scope.$apply($location.path('login'));
									}else{
										$scope.$apply($location.path('login'));
									}
								});
							}
						});*/
					}
				};
			}],
			controllerAs:"signup"
		}).when('/todolog',{
			url:'/todolog',
			templateUrl:'views/todolog.html'
		}).when('/about',{
			url:'/about',
			templateUrl:'views/about.html'
		}).when('/blog',{
			url:'/blog',
			templateUrl:'views/blog.html'
		}).when('/faq',{
			url:'/faq',
			templateUrl:'views/faq.html'
		}).when('/contact',{
			url:'/contact',
			templateUrl:'views/contact.html'
		}).when('/settings',{
			url:'/settings',
			templateUrl:'views/settings.html',
			controller:["$rootScope","togglePassword",function($rootScope,togglePassword){
				this.email=null;
				this.cur_pass=null;
				this.new_pass=null;
				togglePassword.target('reset_pass');
				if($rootScope.provider_ref!=null){
					$('#chgPassword_ui_frm').hide();
				}
				this.changePassword=function(){
				var fb_ref=new Firebase("https://todolog.firebaseio.com");
				//Use JS RegEx to filter Password vailiation (At least 1:/^(Digit)(Low-Case)(Up-Case)[At Least 8 Letters or Numbers]$/)
				var pass_valid=/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{9,}$/.exec(this.new_pass);
				if(pass_valid==null){
					feedback("Problem with Password formatting.\r\n Password requires at least 9 letters & or Numbers, it's manditory to use at least 1 Capital, 1 Lowercase and 1 Number.",'reset','e');
					$('#new_pass_input').addClass('ng-dirty ng-invalid');
				}else{
					fb_ref.changePassword({
						email:this.email,
						oldPassword:this.cur_pass,
						newPassword:this.new_pass
					},function(onError){
						if(onError==null){
							feedback("Password Reset was Successful!",'reset','g');
						}else{
							switch(onError.code){
								case 'INVALID_USER':
									feedback("You've entered the wrong E-mail address. Give it another go.",'reset','e');
									$('#email_input').addClass('ng-dirty ng-invalid');
									break;
								case 'INVALID_PASSWORD':
									feedback("Your current password was entered incorrectly. Give it another go.",'reset','e');
									$('#cur_pass_input').addClass('ng-dirty ng-invalid');
									break;
							}
						}
					});
				}
				};
			}],
			controllerAs:"settings"
		}).when('/logout',{
			url:'/logout',
			templateUrl:'views/logout.html',
			controller:["$rootScope", "$scope", "$location", "$timeout",function($rootScope,$scope,$location,$timeout){
				if($rootScope.provider_ref!=null){
				$rootScope.provider_ref.unauth();//Un-Authenticate from 3rd-party provider-based Firebase reference.
				}else{
					$rootScope.login_ref.unauth();//Un-Authenticate from E-mail & Password based Firebase reference.
				}
				$rootScope.logged_stat=false;
				$timeout(function(){//Pause for 2000 milliseconds or 2 seconds, then...
					location.reload();//do a page refresh to reinitialize the entire App.
					$scope.$apply($location.path('splash'));//The redirect to the Splash view.
				},2000);
			}],
			controllerAs:"logout"
		});
$locationProvider.html5Mode(true);
}]);
