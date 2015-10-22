module.exports=function(app,passport,mongoose,bodyParser,auth_schema,acct_schema){
	function ensure_auth(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}else{
			res.send(403);
		}
	}

	app.get('/monitor',function(req,res){
		res.json(req.user);
	});
	app.get('/create_acct',ensure_auth,function(req,res,next){
		var acct_signup=new acct_schema;
		acct_signup.uid=req.user.uid;
		acct_signup.save(function(err){
			if(err){
				next(err);
			}else{
				res.json({success:true});
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
					res.json({acct_exists:true,uid:uid,provider:provider,profile:{displayName:displayName,photos:photos}});
				}
			}
		});
	});

	app.get('/auth/google',passport.authenticate('google',{
		scope:['https://www.googleapis.com/auth/plus.login',
		'https://www.googleapis.com/auth/plus.profile.emails.read']}));
	app.get('/auth/google/callback',passport.authenticate('google',{failureRedirect: '/login'}),
			function(req,res){
				res.redirect('/login');
			});

	app.get('/auth/facebook',passport.authenticate('facebook'));
	app.get('/auth/facebook/callback',passport.authenticate('facebook',{failureRedirect:'/login'}),
			function(req,res){
				res.redirect('/login');
			});

	app.get('/auth/twitter',passport.authenticate('twitter'));
	app.get('/auth/twitter/callback',passport.authenticate('twitter',{failureRedirect:'/login'}),
			function(req,res){
				res.redirect('/login');
			});
	var parse_post=bodyParser.urlencoded({extended:false});
	app.post('/signup',parse_post,function(req,res,next){
			var signup=new auth_schema();
			signup.username=req.body.username;
			signup.email=req.body.email;
			signup.hash=signup.setPassword(req.body.password);
			signup.save(function(err){
				if(err){
					return next(err);
				}else{
					res.send({success:true});
					//return res.json({token:signup.generateJWT()});
				}
			});
	});
	app.post('/login',passport.authenticate('local'),function(req,res){
			console.log('sending:true');
			res.send({success:true});
	});
	app.get('*',function(req,res){
		res.sendfile('./public/views/index.htm');
		});
}
