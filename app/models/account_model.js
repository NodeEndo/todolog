module.exports=function(mongoose){
	var acctSchema=mongoose.Schema;
	return mongoose.model('Accounts',new acctSchema({
		uid:{type:String},
	       dynamic:{
		       save_index:{type:Number,default:0},
	       save:{type:Array},
	       todo:{type:Array},
	       done:{type:Array}}}));
}
