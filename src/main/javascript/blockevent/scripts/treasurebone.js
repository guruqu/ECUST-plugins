var giveHunterTool = 
	function(listener,evt,storage){
		var commandSender = server.getConsoleSender();
		var playerName = evt.getPlayer().name;
		
		
		storage["trbone_"+playerName] = storage["trbone_"+playerName] || {};
		var aDay = 86400000;
		storage["trbone_"+playerName].lastPick = storage["trbone_"+playerName].lastPick || 0;
		
		var timeDiff = new Date().getTime() - storage["trbone_"+playerName].lastPick;
		
		evt.getPlayer().setFireTicks(100);
		evt.getPlayer().playEffect(evt.getClickedBlock().getLocation(),org.bukkit.Effect.SMOKE,0);
		//evt.getPlayer().sendMessage("Time Diff: "+timeDiff);
		if(timeDiff<aDay){
			evt.getPlayer().sendMessage("§C 今天已经拿过了。");
		}else{
			server.dispatchCommand(commandSender,"rpgitem huntertool give "+playerName);
			evt.getPlayer().sendMessage("&A你获得了：§5[海盗的骨头]");
			storage["trbone_"+playerName].lastPick = new Date().getTime();
		}
	};