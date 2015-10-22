module.exports=function(mongoose){
var acctSchema=mongoose.Schema;
return mongoose.model('Accounts',new acctSchema({
uid:{type:String},
     dynamic:{
	saved:{type:Array},
	 todos:{type:Array},
    	  done:{type:Array}}}));
}
