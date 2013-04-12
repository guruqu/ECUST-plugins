/*
 
  The arrows mod adds fancy arrows to the game.
  
  Usage: 

  /js arrows.sign() turns a targeted sign into a Arrows menu
  /js arrows.normal() sets arrow type to normal.
  /js arrows.explosive() - makes arrows explode.
  /js arrows.teleport() - makes player teleport to where arrow has landed.
  /js arrows.flourish() - makes a tree grow where the arrow lands.
  /js arrows.lightning() - lightning strikes where the arrow lands.
 
  All of the above functions can take an optional player object or name as 
  a parameter. E.g.
  
  /js arrows.explosive('player23') makes player23's arrows explosive.
 
*/
ready(function(){
	var restartPeriod = 12*60*60;
	var plugin = server.getPluginManager().getPlugin("ScriptCraftPlugin");
	
	var restartTask = new java.lang.Runnable({
			run: function(){
				server.shutdown();
			}
		});
	
	var timeWarn = [180,60,30,10];
	for(var ti in timeWarn){
		var warn = timeWarn[ti];
		var messageTask = new java.lang.Runnable({
			run: function(){
				server.broadcast("§A服务器 §C"+warn+" §A秒后将进行计划重启。","*");
			}
		});		
		server.getScheduler().scheduleAsyncDelayedTask(plugin,restartTask,(restartPeriod-warn)*20);
	}
	server.getScheduler().scheduleAsyncDelayedTask(plugin,restartTask,restartPeriod*20);
	
});