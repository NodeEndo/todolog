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
			controller:["$scope", "$rootScope", "$location", "refresh", "togglePassword","passport", "http_post", function($scope, $rootScope, $location, refresh, togglePassword,passport,http_post){
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
					feedback($rootScope.username+" was successfully registered. You can now log in!",'login','g');
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
						$scope.$apply($location.path('todolog'));
					}else{
						$('#msg_box').slideDown(1000);
					}
				});

				//Third-party Login Authentication (Google, Twitter, Facebook)
				this.popup=function(provider){
					passport.selectProvider(provider);
				};
				this.login=function(){
					//$rootScope.persist=this.persist;
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
							http_post.with_this('/login/'+this.persist,login_serialized).then(function(onSuccess){
								if(onSuccess.data.success){
									feedback("Successfully logged in!",'login','g');
									refresh.page(1);//After 1 milisecond, refresh the login page.
								}else{
									if(onSuccess.data.error){
										switch(onSuccess.data.error_type){
											case 'username':
											feedback("There is no existing Todolog account with the Username:"+$rootScope.username+", Have you signed up?<a href='signup'>Click Here</a> if you haven't already.",'login','e');
												break;
											case 'password':
												feedback("You've entered the wrong Password.",'login','e');
												break;
										}
									}
								}
							});
						}
					}else{
						feedback("Attempting to login with supplied E-mail...",'login','g');
						var login_serialized=("username="+this.email+"&password="+this.pass);
						http_post.with_this('/login/'+this.persist,login_serialized).then(function(onSuccess){
							if(onSuccess.data.success){
								feedback("Successfully logged in!",'login','g');
								refresh.page(1);//After 1 milisecond, refresh the login page.
							}else{
								if(onSuccess.data.error){
									switch(onSuccess.data.error_type){
										case 'email':
											feedback("There is no existing Todolog account with the E-mail:"+$rootScope.username+", Have you signed up?<a href='signup'>Click Here</a> if you haven't already.",'login','e');
											break;
										case 'password':
											feedback("You've entered the wrong Password.",'login','e');
											break;
									}
								}
							}
						});
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
			controller:["$scope","$rootScope","$location","togglePassword","http_post", function($scope, $rootScope, $location, togglePassword, http_post){
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
								$rootScope.reg_stat=true;
								feedback("YESSS... You have sucessfully registered and may now login!",'login','g');
								$scope.$apply($location.path('login'));
							}else{
								if(onSuccess.data.error){
									switch(onSuccess.data.error_type){
										case 'exists':
											feedback("Shucks the Username you wanted already exists... meditate on that one.",'signup','e');
											break;
									}
								}
								$scope.$apply($location.path('signup'));
							}
						});
						
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
			controller:["$scope","$rootScope","togglePassword","http_post",function($scope,$rootScope,togglePassword,http_post){
				this.email=null;
				this.cur_pass=null;
				this.new_pass=null;
				togglePassword.target('reset_pass');
				if($rootScope.provider_ref!=null){
					$('#chgPassword_ui_frm').hide();
				}
				this.changePassword=function(){
				//var fb_ref=new Firebase("https://todolog.firebaseio.com");
				//Use JS RegEx to filter Password vailiation (At least 1:/^(Digit)(Low-Case)(Up-Case)[At Least 8 Letters or Numbers]$/)
				var pass_valid=/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{9,}$/.exec(this.new_pass);
				if(pass_valid==null){
					feedback("Problem with Password formatting.\r\n Password requires at least 9 letters & or Numbers, it's manditory to use at least 1 Capital, 1 Lowercase and 1 Number.",'reset','e');
					$('#new_pass_input').addClass('ng-dirty ng-invalid');
				}else{
					var serialized_data=("&email="+this.email+"&cur_pass="+this.cur_pass+"&new_pass="+this.new_pass);
					http_post.with_this('/change_password',serialized_data).then(function(onSuccess){
						if(onSuccess.data.success){
							feedback("Password Reset was Successful!",'reset','g');
							$('#email_input,#cur_pass_input,#new_pass_input').val('');
						}else{
							if(onSuccess.data.error){
								switch(onSuccess.data.error_type){
									case 'email':
										feedback("You've entered the wrong E-mail address. Give it another go.",'reset','e');
										$('#email_input').addClass('ng-dirty ng-invalid');
										break;
									case 'password':
										feedback("Your current password was entered incorrectly. Give it another go.",'reset','e');
										$('#cur_pass_input').addClass('ng-dirty ng-invalid');
										break;
								}
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
			controller:["$rootScope", "$scope", "$location", "$timeout", function($rootScope,$scope,$location,$timeout){
				$timeout(function(){//Pause for 2000 milliseconds or 2 seconds, then...
					location.reload();//do a page refresh to reinitialize the entire App.
					$scope.$apply($location.path('splash'));//The redirect to the Splash view.
				},2000);
			}],
			controllerAs:"logout"
		});
$locationProvider.html5Mode(true);
}]);
