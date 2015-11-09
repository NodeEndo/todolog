var express=require('express');
var expressSession=require('express-session');
var passport=require('passport');
var passportHttp=require('passport-http');
var LocalStrategy=require('passport-local');
var FacebookStrategy=require('passport-facebook').Strategy;
var GoogleStrategy=require('passport-google-oauth2').Strategy;
var TwitterStrategy=require('passport-twitter').Strategy;
var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');
var mongoose=require('mongoose');
var mongoose_url=require('./config/db.js');
var auth_schema=require('./app/models/signup_model.js')(mongoose);
var acct_schema=require('./app/models/account_model.js')(mongoose);
var app=express();
//app.set('Access-Control-Allow-Origin','*');
app.set('views',__dirname+'/views');
//app.set('view engine','ejs');

var sendgrid=require("sendgrid")(process.env.SENDGRID_USER,process.env.SENDGRID_PASSWORD);
app.use(expressSession({
	secret:process.env.SESSION_SECRET || 'secret',
	resave:false,
	saveUninitialized:false}));

app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname+'/public'));

require('./app/routes')(app,passport,mongoose,bodyParser,auth_schema,acct_schema,sendgrid);

mongoose.connect(mongoose_url.url);
var static_id=null;
var static_provider=null;
var static_photos=null;
var lock_status=null;
function validate_creds(username,password,done){
	static_photos='http://';
	static_provider="todolog";
	var email=/^[a-zA-Z0-9]{1,}\@[a-zA-Z]{2,}\.\D{2,}$/.exec(username);
	if(!email){
		console.log('username:'+username+',password:'+password);
		auth_schema.findOne({username:username},function(err,auth_data) {
			if(err){return done(err);}
			if (!auth_data) {
				console.log('Incorrect Username');
				return done(null, false, {message:'username'});
			}
			if (!auth_data.validPassword(password)) {
				console.log('Incorrect Password');
				return done(null, false, {message:'password'});
			}
			console.log('Login Successful!');
			return done(null, auth_data);
		});
	}else{
		console.log('email:'+email+',password:'+password);
		auth_schema.findOne({email:email},function(err,auth_data) {
			if(err){return done(err);}
			if (!auth_data) {
				console.log('Incorrect E-mail.');
				return done(null, false, {message:'email'});
			}
			if (!auth_data.validPassword(password)) {
				console.log('Incorrect Password');
				return done(null, false, {message:'password'});
			}
			console.log('Login Successful!');
			return done(null, auth_data);
		});

	}
}

//[Google]------------------------------------------
passport.use(new GoogleStrategy({
	clientID:process.env.GOOGLE_CLIENT_ID,
	clientSecret:process.env.GOOGLE_SECRET,
	callbackURL:process.env.DOMAIN+'/auth/google/callback'},function(accessToken, refreshToken, profile, done){
		static_id=profile.id;
		static_provider='google';
		static_photos=profile.photos;
		lock_status=0;
		done(null,{provider:'google',id:profile.id,username:profile.displayName,photos:profile.photos});
	}));
//----------------------------------------------------
//[FACEBOOK]------------------------------------------
passport.use(new FacebookStrategy({
	profileFields:['id','displayName','photos'],
	clientID:process.env.FACEBOOK_CLIENT_ID,
	clientSecret:process.env.FACEBOOK_SECRET,
	callbackURL:process.env.DOMAIN+'/auth/facebook/callback'},function(accessToken, refreshToken, profile, done){
		static_id=profile.id;
		static_provider='facebook';
		static_photos=profile.photos;
		lock_status=0;
		done(null,{provider:'facebook',id:profile.id,username:profile.displayName,photos:profile.photos});
	}));
//----------------------------------------------------
////[Twitter]------------------------------------------
passport.use(new TwitterStrategy({
	consumerKey:process.env.TWITTER_CONSUMER_KEY,
	consumerSecret:process.env.TWITTER_SECRET,
	callbackURL:process.env.DOMAIN+'/auth/twitter/callback'},function(accessToken, refreshToken, profile, done){
		static_id=profile.id;
		static_provider='twitter';
		static_photos=profile.photos;
		lock_status=0;
		done(null,{provider:'twitter',id:profile.id,username:profile.displayName,photos:profile.photos});
	}));
//----------------------------------------------------

//passport.use(new passportHttp.BasicStrategy(validate_creds));
passport.use(new LocalStrategy(validate_creds));
passport.serializeUser(function(user_data,done){
	if(static_provider=='todolog'){
	static_id=user_data._id;
	lock_status=user_data.lock_status;
	console.log('lock_status:',lock_status);
	}
	console.log('serializing data:',JSON.stringify(user_data));
	done(null,user_data.username);
});
passport.deserializeUser(function(username,done){
	console.log('deserializing data');
	var uid_dsp_name=username.toLowerCase();	
	done(null,{provider:static_provider,uid:(uid_dsp_name.replace(/\s/g,'_')+'_'+static_id+'_'+static_provider),username:username,photos:static_photos,lock_status:lock_status});
});

app.set('port',process.env.PORT || 8080);
app.listen(app.get('port'),function(){
	console.log('Listening on PORT#:',app.get('port'));
});
