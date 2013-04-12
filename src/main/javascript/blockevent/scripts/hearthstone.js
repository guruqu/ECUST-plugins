var giveHearthStone = 
	function(listener,evt,storage){
		var commandSender = server.getConsoleSender();
		var playerName = evt.getPlayer().name;
		
		
		storage["hearth_"+playerName] = storage["hearth_"+playerName] || {};
		var aDay = 86400000;
		storage["hearth_"+playerName].lastPick = storage["hearth_"+playerName].lastPick || 0;
		
		var timeDiff = new Date().getTime() - storage["hearth_"+playerName].lastPick;
		
		
		//evt.getPlayer().sendMessage("Time Diff: "+timeDiff);
		if(timeDiff<aDay){
			evt.getPlayer().sendMessage("§C 今天已经拿过了。");
		}else{
			server.dispatchCommand(commandSender,"rpgitem hearthstone give "+playerName);
			evt.getPlayer().sendMessage("§A你获得了：§5[土豆炉石]");
			storage["hearth_"+playerName].lastPick = new Date().getTime();
		}
	};