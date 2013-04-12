load(__folder + "../events/events.js");
plugin("blockevent", {
	convertBlock: function(block){
		return ({
				x: block.x,
				y: block.y,
				z: block.z,
				world: ""+block.world.name
			});
	},
	dobind: function(block,event,cbName,triggerName){
		if(typeof eval(cbName)!="function"){
			self.sendMessage("Must have a function name");
			return false;
		}

		
		events.on(event,function(listener, evt){
			var isPlayerEvent = (event=="player.PlayerInteractEvent");
			var nbLoc;
			if(isPlayerEvent){
				nbLoc = blockevent.convertBlock(evt.getClickedBlock().getLocation());
			}else{
				nbLoc = blockevent.convertBlock(evt.getBlock().getLocation());
			}
			if(nbLoc==undefined||nbLoc==null){
				self.sendMessage("Error with event: "+triggerName);
				return false;
			}
			if(JSON.stringify(nbLoc)==JSON.stringify(block)){
					var func = eval(cbName);
					var estore = blockevent.store.eventstores;
					func(listener,evt,estore);
					//evt.handler.unregister(listener)
				}
		});
		return true;
	},
	unbind: function(name){
		this.store.events[name] = undefined;
	},
	bind: function(name,event,listen){
		if(self.name=="CONSOLE"){
			self.sendMessage("Cannot initiate from console!");
			return false;
		}
		if(this.store.events[name]!=undefined){
			self.sendMessage("Already exists please use rebind");
			return false;
		}
		if((typeof listen)!="string"){
			self.sendMessage("name of the listener please");
			return false;
		}
		if(this.blook[self.name]==undefined){
			self.sendMessage("please use /bpos first");
			return false;
		}
		block_n = this.blook[self.name];
		block = blockevent.convertBlock(block_n);
		this.store.events[name]={
			event: event,
			cbName: listen,
			block: block
		};
		
		this.dobind(block,event,listen,name);
		self.sendMessage("Bind successful");
	},		
	bpos: function(){
		if(self.name=="CONSOLE"){
			self.sendMessage("Cannot initiate from console!");
			return false;
		}
		
		var player = self;
		var lineOfSight = player.getLineOfSight(null, 20);
		for (var bi=0; bi < lineOfSight.size(); bi++) {
			var block = lineOfSight.get(bi);
			if (!block.isEmpty()) {
				var location = block.location;
				this.blook[self.name] = location;
				self.sendMessage("You are looking at: "+location);
				return true;
			}
		}
		self.sendMessage("You need to look at the block to name and/or get closer to it");
		return false;
    }
},true);


blockevent.store.events = blockevent.store.events || {}
blockevent.blook = blockevent.blook || {}
blockevent.store.eventstores = blockevent.store.eventstores || {}

ready(function(){
	echo("[JS BlockEvent] Loading");
	for(var ei in (blockevent.store.events)){
		var evt = blockevent.store.events[ei];
		echo("[JS BlockEvent] Adding Block Event: "+ei+"->"+evt.cbName);
		blockevent.dobind(evt.block,evt.event,evt.cbName,ei);		
	}
});