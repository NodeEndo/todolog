module.exports=function(mongoose){
	var crypto=require('crypto');
	var jwt=require('jsonwebtoken');
	var authSchema=mongoose.Schema;

	var auth_schema=new authSchema({
		username:{type:String, lowercase:true, unique:true},
	       email:{type:String, lowercase:true, unique:true},
	       unruled_hash:{type:String},
	       salt:{type:String},
	verif_hash:{type:String},
	lock_status:{type:Number, default:1}});
	
	auth_schema.methods.resetPassword=function(){
		var tmp_salt=crypto.randomBytes(8).toString('hex');
		this.salt=(tmp_salt.substring(0,4).toUpperCase()+tmp_salt.substring(5,tmp_salt.length));
		this.unruled_hash=crypto.pbkdf2Sync(this.salt,this.salt,1000,64).toString('hex');
		return {salt:this.salt,hash:this.unruled_hash};
	};

	auth_schema.methods.setVerif=function(username){
		var verif_salt=crypto.randomBytes(16).toString('hex');
		this.verif_hash=crypto.pbkdf2Sync(username,verif_salt,1000,64).toString('hex');
		return this.verif_hash;
	};

	auth_schema.methods.validVerif=function(verif_hash){
		return this.verif_hash===verif_hash;
	};

	auth_schema.methods.setPassword=function(password){
		this.salt=crypto.randomBytes(16).toString('hex');
		this.unruled_hash=crypto.pbkdf2Sync(password,this.salt,1000,64).toString('hex');
	};

	auth_schema.methods.validPassword=function(password){
		var hash=crypto.pbkdf2Sync(password,this.salt,1000,64).toString('hex');
		return this.unruled_hash===hash;
	};

	auth_schema.methods.generateJWT = function() {
		var today = new Date();
		var exp = new Date(today);
		exp.setDate(today.getDate() + 60);
		return jwt.sign({
			_id: this._id,
		       username: this.username,
		       exp: parseInt(exp.getTime() / 1000),
		}, 'SECRET');
	};

return mongoose.model('Users',auth_schema);
}
