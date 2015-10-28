	var logged_stat=false;	
	//Generate a random integer within a given (min,max) range.
	function randInt(min,max){
		return Math.floor(Math.random()*(max-min))+min;
	}	
	//Render Timestamp with getTime() method which returns 
	//the number of milliseconds which have passed since Jan. 1, 1970
	function rend_timestamp(){
		var date=new Date();
	
		return date.getTime();
	}
	//Gen new index for 'todo' depending which list ('todo'|'done') 
	//has the item with the largest index property value, to avoid duplicate index values.
	function pred_succ_index(path,func){
		var item_index=null;
		switch(func){
			case 'add'://Render index's for the index property in 'path.todo' array (the editor).
			sortByIndex(path.todo);//Sort newly rendered path.todo Array
			if(path.done.length>0){
			var l_done_item_index=path.done[path.done.length-1].index;	
				if(typeof(path.todo[path.todo.length-1])!='undefined'){
					var l_todo_item_index=path.todo[path.todo.length-1].index;
					if(l_todo_item_index<l_done_item_index){
						item_index=l_done_item_index+1;
					}else{
						item_index=l_todo_item_index+1;
					}
				}else{
					item_index=l_done_item_index+1;
				}
				
			}else{
				if(typeof(path.todo[path.todo.length-1])!='undefined'){
				var l_todo_item_index=path.todo[path.todo.length-1].index;
				item_index=l_todo_item_index+1;
				}else{
					item_index=0;
				}
			}
			break;
			case 'save'://Render index's for the index property in 'path.days' array.
				if((path.days.length>0)&&(path.days[path.days.length-1].index>=0)){
				item_index=path.days[path.days.length-1].index+1;
				}else{
				item_index=0;
				}
			break;
		}
		return item_index;
	}
	/*Sort the Todo list by Items' Index JSON property. 
	(NOTE:ng-repeat="todo in main.todo | orderBy:'index') 
	only is pure front-end/visual functionality, 
	this backend sortByIndex(path) function is still required 
	for ordering and manipulation of the 'todo' & 'done' arrays.*/
	function sortByIndex(path){
		path.sort(function(a,b){
			return a.index>b.index;
		});
	}
	//Output Feedback
	function feedback(msg,target,type){
		var msg_color={'e':'rgb(255,0,0)','g':'rgb(0,255,0)'};
		$('#'+target+'_feedback').html(msg).show();
		$('#'+target+'_feedback').css('color',msg_color[type]);
	}
	//Actions to take directly after successful login.
	function login_success(){
	$('.root_ui_btn').hide();
	$('#todolog_btn,.todo_ui_btn').show();
	}
