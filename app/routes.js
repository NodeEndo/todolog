module.exports=function(app,passport,mongoose,bodyParser,auth_schema,acct_schema,sendgrid){
	function ensure_auth(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}else{
			res.send(403);
		}
	}
	var parse_post=bodyParser.urlencoded({extended:false});

	/*[PERSISTENCE'] app.post('/persist', ...)
	 * This is where the current data that is submitted from the end-user|client is captured, 
	 *parsed and update the accounts': 'todo', 'done' & 'save' fields in MongoDB*/
	app.post('/persist',parse_post,function(req,res,next){
		var current_data_g=null;
		//Query the 'Accounts' database collection to zero-in on and retrieve the data contained within an account associated with a matching UID.
		acct_schema.findOne({uid:req.body.uid},function(err,account){
			if(err){
				console.log(err);
			}else{/*The 'req.body.what' contains a string that is submitted to 
			       *identify what MongoDB document|record is being updated e.g('todos','done','save').*/
				var what=req.body.what;
				var str_json=req.body[what];//Store the stringified JSON Object that was submitted into a variable...
				/*Strip-away/replace any '$'|dollar symbols from the stringified JSON Object to avoid conflict with MongoDB way of interpreting '$' symbols as delimiters.
				*Then Decode|Parse submitted stringified JSON back to an actual JSON Object.*/
				var dec_json=JSON.parse(str_json.replace(/\$*/gm,''));
				if(what!='save_index'){
				console.log('what:',what,'task:',dec_json,'index:',dec_json.index);
				}else{
				console.log('what:',what,'task:',dec_json);
				}
				account.dynamic[what]=dec_json;//e.g(Accounts[UID]->Dynamic->[todo|done|save|save_index]
				account.save(function(err){
					if(err){
						console.log('_error',err);
						res.send({saved:false});
					}else{
						console.log('_saved');
						res.send({saved:true});
					}
				});
			}
		});
	});
	app.get('/monitor',function(req,res){
		res.json(req.user);
	});
	app.get('/create_acct',ensure_auth,function(req,res,next){
		var acct_signup=new acct_schema;
		acct_signup.uid=req.user.uid;
		acct_signup.save(function(err){
			if(err){
				if(err.code==11000){
				res.send({error:true, error_type:'exists'});//send the current error obj.
				}
			}else{
				res.send({success:true});
			}
		});
	});
	app.get('/auth/complete/api',ensure_auth,function(req,res,next){
		var uid=req.user.uid;
		var provider=req.user.provider;
		var displayName=req.user.username;
		var photos=req.user.photos;
		acct_schema.findOne({uid:req.user.uid},function(err,acct_data){
			if(err){
				res.next(err);
			}else{
				if(!acct_data){
					res.json({acct_exists:false,uid:uid,provider:provider,profile:{displayName:displayName,photos:photos}});
				}else{
					res.json({acct_exists:true,uid:uid,provider:provider,profile:{displayName:displayName,photos:photos,dynamic:acct_data.dynamic}});
				}
			}
		});
	});
	var static_redir=null;
	app.get('/auth/google',function(req,res,next){static_redir=('/'+req.query.redir); next()},passport.authenticate('google',{
		scope:['https://www.googleapis.com/auth/plus.login',
		'https://www.googleapis.com/auth/plus.profile.emails.read']}));
	app.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:static_redir}),
			function(req,res){
				res.redirect(static_redir);
			});

	app.get('/auth/facebook',function(req,res,next){static_redir=('/'+req.query.redir); next()},passport.authenticate('facebook'));
	app.get('/auth/facebook/callback',passport.authenticate('facebook',{failureRedirect:static_redir}),
			function(req,res){
				res.redirect(static_redir);
			});

	app.get('/auth/twitter',function(req,res,next){static_redir=('/'+req.query.redir); next()},passport.authenticate('twitter'));
	app.get('/auth/twitter/callback',passport.authenticate('twitter',{failureRedirect:static_redir}),
			function(req,res){
				res.redirect(static_redir);
			});
	app.get('/verify',function(req,res){
		auth_schema.findOne({username:req.query.username},function(err,auth_data){
			if(err){
				res.redirect('/verif_user');
			}else{
				if(!auth_data.validVerif(req.query.verif_code)){
				res.redirect('/verif_code');
				}else{
					auth_data.lock_status=0;//Replace lock_status from '1'|on, to '0'|off.
					auth_data.save(function(err){
						if(err){
							res.redirect('/verif_failed');
						}else{
							res.redirect('/verif_success');
						}
					});
				}
			}
		});
	});

	app.post('/password-reset',parse_post,function(req,res){
		auth_schema.findOne({email:req.body.email},function(err,auth_data){
			if(!auth_data){
				res.send({error:true,error_type:'INVALID_USER'});
			}else{
				var tmp_json=auth_data.resetPassword();
				auth_data.salt=tmp_json.salt;
				auth_data.hash=tmp_json.hash;
				auth_data.save(function(err){
					if(err){
						res.send({error:true,error_type:'FAILED'});
					}else{
						var email=new sendgrid.Email();
						email.addTo(req.body.email);
						email.setFrom("no_reply@champ.com");
						email.setSubject("So we heard you forgot your password for CHAMP, eh...?");
						email.setHtml('This is your new temporary password:'+auth_data.salt+'<br><a href="'+process.env.DOMAIN+'/login">Click Here</a> to login using your temporary password, then go to your Settings and change to one that you\'d like.');
						sendgrid.send(email,function(err,json){
							if(err){
								console.log(err);
							}else{
								console.log(json);
							}
						});
						res.send({success:true});
					}
				});
			}
		});

	});
	app.post('/signup',parse_post,function(req,res,next){
			var signup=new auth_schema();
			signup.username=req.body.username;
			signup.email=req.body.email;
			signup.verif_hash=signup.setVerif(req.body.username);
			console.log('verif_hash:'+signup.verif_hash);
			signup.hash=signup.setPassword(req.body.password);
			signup.save(function(err){
				if(err){
					res.send({error:true,error_type:'exists'});
					return next(err);
				}else{
					var email=new sendgrid.Email();
					email.addTo(req.body.email);
					email.setFrom("no_reply@champ.com");
					email.setSubject("Account Verification From CHAMP");
					email.setHtml('<a href="'+process.env.DOMAIN+'/verify?username='+signup.username+'&verif_code='+signup.verif_hash+'">Click Here</a> to Verify your new CHAMP account.');
					sendgrid.send(email,function(err,json){
						if(err){
							console.log(err);
						}else{
							console.log(json);
						}
					});
					res.send({success:true});
					//return res.json({token:signup.generateJWT()});
				}
			});
	});
	app.post('/change_password',parse_post,function(req,res,next){
		var chng_schema=new auth_schema();
		auth_schema.findOne({email:req.body.email},function(err,auth_data){
			if (!auth_data) {
				res.send({error:true, error_type:'email'});
			}else{
				if (!auth_data.validPassword(req.body.cur_pass)) {
					res.send({error:true, error_type:'password'});
				}else{
					auth_data.hash=auth_data.setPassword(req.body.new_pass);
					auth_data.save(function(err){
						if(err){
							return next(err);
						}else{
							res.send({success:true});
						}
					});
				}
			}
		});
	});
	app.post('/login/:session',function(req,res,done){//Wrap entire app.post request in a self-executing function while passing req, res & done parameters (see line #:90).
	passport.authenticate('local',{session:req.params.session},function(err,user,info){//Using a callback function to intercept authentication-validation results... (retrieve parsed errors)
			if(!user){//If the user param, (the 2nd parameter) was set to false send error obj.
				res.send({error:true, error_type:info.message});//send the current error obj.
			}else{
				if(!user.lock_status){//If account has been Verified...

					return req.login(user,function(err){//Since we're using a custom callback function, it is required to manually invoke/execute a request.login() passing the user data as the 1st argument.
						if(err){
							return res.sendStatus(500);
						}
						done(null,user);//Now that we're logged the done(null,user) continues to the next express procedure, in this case invoking passport.serializeUser() in the '\server.js' file which parses the 'user' data and generates a cookie to maintain an active server-client session.
					});
				}else{//If account has not been Verified, it's lock_status=1.
					res.send({error:true, error_type:'locked'});
				}
			}
	})(req,res,done)},function(req,res){
		res.send({success:true});
	});

	app.get('/logout',function(req,res,done){
		req.logout();
		req.session.destroy(function(err){
		res.send({logged_stat:false});
		});
	});
	app.get('*',function(req,res){
		res.sendfile('./public/views/index.htm');
		});
}
