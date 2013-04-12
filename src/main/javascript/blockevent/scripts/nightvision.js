var giveNightvision = 
	function(listener,evt,storage){
		
		var commandSender = server.getConsoleSender();
		var playerName = evt.getPlayer().name;
		
		echo("Player:" + playerName+" is accessing nightvision chest");
		storage["nightvision_"+playerName] = storage["nightvision_"+playerName] || {};
		var aDay = 86400000;
		storage["nightvision_"+playerName].lastPick = storage["nightvision_"+playerName].lastPick || 0;
		
		var timeDiff = new Date().getTime() - storage["nightvision_"+playerName].lastPick;
	
		removePotionEffect("CONFUSION",playerName);
		
		//self.addPotionEffect(pe_blind);
		//evt.getPlayer().sendMessage("Time Diff: "+timeDiff);
		if(timeDiff<3*aDay){
			evt.getPlayer().sendMessage("§C 三天内已经拿过了。");
		}else{
			server.dispatchCommand(commandSender,"rpgitem nightvision give "+playerName);
			evt.getPlayer().sendMessage("§A你获得了：§5[悟空的眼珠]");
			storage["nightvision_"+playerName].lastPick = new Date().getTime();
		}
	};
var removePotionEffect = function(type,playername){
	if(playername==null||playername==undefined)
		playername=self.name;
	var player =server.getPlayer(playername);
	var pe = org.bukkit.potion.PotionEffectType.getByName(type);
	//echo("Effect:"+type+" "+length);
	player.removePotionEffect(pe);
}
	
	
var addPotionEffect = function(type,length,playername,amp){
	if(playername==null||playername==undefined)
		playername=self.name;
	if(amp==undefined) amp=1;
	var player =server.getPlayer(playername);
	var pe = new org.bukkit.potion.PotionEffect(org.bukkit.potion.PotionEffectType.getByName(type), length,1);
	//echo("Effect:"+type+" "+length);
	player.addPotionEffect(pe);
}

var forrestEffect = forrestEffect||{
	onEnter: function(player){
		addPotionEffect("CONFUSION",72000,player,0.3);
	},
	onLeave: function(player){
		removePotionEffect("CONFUSION",player);
	}
}
