load(__folder + "../events/events.js");
plugin("keepinventory", {
	
},true);




ready(function(){
	if(keepinventory.store.bestChance==undefined)
		keepinventory.store.bestChance=100.0;
	if(keepinventory.store.worstChance==undefined)
		keepinventory.store.worstChance=100.0;	
	
	events.on("entity.PlayerDeathEvent",function(listener, evt){
			var player = evt.getEntity();
			if(player.getInventory==undefined)
				return;
			var armor = player.getInventory().getArmorContents();
			
			for(var i in armor){
				evt.getDrops().remove(armor[i]);
			}
			
			
			var inv = player.getInventory().getContents();
			var keep=0,lost=0;
			for(var i in inv){
				var chnc = ((1.0-i/36.0)*(keepinventory.store.bestChance-keepinventory.store.worstChance)+keepinventory.store.worstChance)/100.0;
				//echo(chnc);
				if(inv[i]==null)
					continue;
				if(chnc>Math.random()){
					evt.getDrops().remove(inv[i]);
						keep++;
				}
				else{
					inv[i]=null;
					lost++;
				}
			}
			
			var plugin = server.getPluginManager().getPlugin("ScriptCraftPlugin");
			var recInv = new java.lang.Runnable({
				run: function(){
					player.getInventory().setContents(inv);
				}
			});
			
			var recArmor = new java.lang.Runnable({
				run: function(){
					player.getInventory().setArmorContents(armor);
				}
			});
			
			server.getScheduler().scheduleSyncDelayedTask(plugin, recInv);
			server.getScheduler().scheduleSyncDelayedTask(plugin, recArmor);
			
			if(keep+lost<5&&keep>lost)
				player.sendMessage("§A很幸运，你只丢失了"+lost+"/"+(lost+keep));
			else
				player.sendMessage("§C真不幸，你丢失了"+lost+"/"+(lost+keep));
		});
});