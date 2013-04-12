var playlvl1 = 
	function(listener,evt,storage){
		var player = evt.getPlayer();
		//player.sendMessage(evt.getAction());
		casino.startGame("lvl1",player.world,player);
	};
	
var playlvl2 = 
	function(listener,evt,storage){
		var player = evt.getPlayer();
		var minbet = {
			DIAMOND:1
		};
		if(!casino.startGame("lvl2",player.world,player,minbet)){
			player.sendMessage("§c最小赌注为： §a 1 个 钻石");
		}
	};
	
var playlvl3 = 
	function(listener,evt,storage){
		var player = evt.getPlayer();
		player.setFireTicks(100);
	};
	
var playlvl4 = 
	function(listener,evt,storage){
		var player = evt.getPlayer();
		player.setFireTicks(100);
	};
var playlvl5 = 
	function(listener,evt,storage){
		var player = evt.getPlayer();
		casino.burnInterior(casino.store["lvl5"].bottom,player.world,false);
	};
