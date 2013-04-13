load(__folder + "../events/events.js");

plugin("casino", {
	listCasino: function(){
		__plugin.logger.info("List of casinos:");
		for(var i in casino.store){
			__plugin.logger.info(i);
		}
	},
	help: function(){
		self.sendMessage("casino.[setRegion][setItem][setReturn([{rate,ratio}])]");
	},
	getItemsIn: function(regionName,world){
		if(world==null||world==undefined) world=self.world;
		var entities = world.getEntitiesByClass(org.bukkit.entity.Item);
		var itemList = [];
		var region = utils.getRegion(regionName,world);
		for(var i=0; i<entities.size(); i++){
			var item = entities.get(i);
			var item_loc = item.getLocation();
			if(region.contains(item_loc.x,item_loc.y,item_loc.z))
				itemList.push(item);
		}
		return itemList;
	},
	pointInCuboid: function(cuboid,rx,ry,rz){
		var minX = Math.min(cuboid.getMinimumPoint().x,cuboid.getMaximumPoint().x);
		var maxX = Math.max(cuboid.getMinimumPoint().x,cuboid.getMaximumPoint().x);
		var maxZ = Math.max(cuboid.getMinimumPoint().z,cuboid.getMaximumPoint().z);
		var minZ = Math.min(cuboid.getMinimumPoint().z,cuboid.getMaximumPoint().z);
		var minY = cuboid.getMinimumPoint().y;
		var maxY = cuboid.getMaximumPoint().y;
		return {
			x:minX+(maxX-minX)*rx,
			y:minY+(maxY-minY)*ry,
			z:minZ+(maxZ-minZ)*rz
		};
	},
	dropItem: function(regionName,world,itemStacks,duration,step,vel){
		duration = typeof duration !== 'undefined' ? duration : 100;
		step = typeof step !== 'undefined' ? step : 10;
		
		var region = utils.getRegion(regionName,world);
		/*itemStacks = [];
		for(var i=0;i<100;i++){
			itemStacks.push(new org.bukkit.inventory.ItemStack(121,2));
		}
*/
		var scheduler = server.getScheduler();

		var stkSchedule = [];
		var iu = itemStacks.length/step;
		var tu = duration/step;
		for(var i=iu,j=0;i<itemStacks.length;i+=iu){
			var stk = [];
			for(;j<i+1&&j<itemStacks.length;j++){
				stk.push(itemStacks[j]);
			}
			stkSchedule.push(stk);
		}
	//	__plugin.logger.info(stkSchedule);
	//	__plugin.logger.info(tu+","+iu);
		for(var i in stkSchedule){
			//var item=new org.bukkit.inventory.ItemStack(100,1);
			(function(item){
				var dropTask =  
					new java.lang.Runnable({
						run: function(){
							//__plugin.logger.info(item);
							var p=true;
							for(var j in item){
								var __loc = casino.pointInCuboid(region,Math.random(),Math.random(),Math.random());
								var loc = new org.bukkit.Location(world,__loc.x,__loc.y,__loc.z);
								var entity = world.dropItemNaturally(loc,item[j]);
								if(vel==undefined) //use default spawn speed
									entity.setVelocity(new org.bukkit.util.Vector((Math.random()-0.5)*0.1,0.5,(Math.random()-0.5)*0.1));
								else//Something funny is happening
									entity.setVelocity(new org.bukkit.util.Vector((Math.random()-0.5)*0.4*vel,0.5*vel,(Math.random()-0.5)*0.4*vel));
								
								if(p)
									world.playSound(loc,org.bukkit.Sound.ITEM_PICKUP,1,0);
								p=false;
							}
						}
					});
				scheduler.runTaskLater(__plugin,dropTask,tu*i);
			})(stkSchedule[i]);
		}
	},
	replaceBlock: function(regionName,world,from,to){
		var blocks = utils.filterRegion(
			regionName,
			world,
			function(blk){
				if(blk.getType()==from)
					return true;
			});
		
		//__plugin.logger.info("X:"+minX+" Y:"+y+" z:"+minZ);
		//__plugin.logger.info("X:"+maxX+" Y:"+y+" z:"+maxZ);
		for(var i in blocks){
			var blk = blocks[i];
			blk.setType(to);
		}
	},
	burnInterior: function(regionName,world,stopFire){
		if(stopFire)
			this.replaceBlock(regionName,world,org.bukkit.Material.FIRE,org.bukkit.Material.AIR);
		else
			this.replaceBlock(regionName,world,org.bukkit.Material.AIR,org.bukkit.Material.FIRE);
	},
	// Convert itemStack entities array to itemStack array
	// Split itemstack larger than maxPerStack
	splitItem: function(items,maxPerStack){
		var ret = [];
		for(var i in items){
			var item = items[i];
			var amount=item.getAmount();
			while(amount>0){
			//	var ni = new org.bukkit.inventory.ItemStack(item.type,amount>maxPerStack?maxPerStack:amount);
				var ni = item.clone();
				ni.setAmount(amount>maxPerStack?maxPerStack:amount);
				ret.push(ni);
				amount-=maxPerStack;
			}
		}
		return ret;
	},
	removeEmptyItems: function(items){
		var it = [];
		for(var i in items){
			if(items[i].getAmount()!=0)
				it.push(items[i]);
		}
		return it;
	},
	aggregate: function(items){
		var ret = {};
		for(var i in items){
			var type = items[i].getType()+"/"+items[i].getData().getData();
			var amount = items[i].getAmount();
			
			if(ret[type]==undefined){
				ret[type] = items[i].clone();
			}else{
				ret[type].setAmount(ret[type].getAmount()+amount);
			}
			//ret[type] = (ret[type]==undefined?org.bukkit.inventory.ItemStack(type,0):ret[type]);
			//ret[type].setAmount(ret[type].getAmount()+amount);
		}
		var _ret = [];
		for(var i in ret){
			_ret.push(ret[i]);
		}
		return _ret;
	},
	startGame: function(sac,world,player,minbet){
		//__plugin.logger.info("System log");
		var cas = casino.store[sac];
		if(minbet==undefined) minbet={};
		var __that=this;
		if(cas==undefined){
			__plugin.logger.info("Cannot initiate casino: "+sac);
			return false;
		}
		
		__plugin.logger.info("User:"+player.name+" using casino <"+sac+">");
		// Count the items on the field
		// Create and split into item stacks
		// Remove those entities
		var items_entity = this.getItemsIn(cas.container,world);
		var items = [];
		for(var i in items_entity) items.push(items_entity[i].getItemStack());
		items = this.splitItem(items,2);
		if(items.length<2){
			player.sendMessage("§c祭坛中的物品不够。");
			return false;
		}
		for(var i in items){
			var type = items[i].getType().toString();
			if(minbet[type]!=undefined)
				minbet[type]-=items[i].getAmount();
		}
		for(var i in minbet)
			if(minbet[i]>0)
				return false;
		
		
		var now = new Date().getTime();
		var cd = (cas.cd==undefined?20:cas.cd);
		var timeDiff = now-(cas.lastUse==undefined?0:cas.lastUse);
		if(timeDiff/1000<cd){
			player.sendMessage("§c祭坛还需要 §a "+(cd-Math.round(timeDiff/1000))+" §c秒才能被使用!");
			return;
		}
		cas.lastUse = now;
		
		player.sendMessage("§1池子里的物品：");
		items = this.aggregate(items);
		for(var i in items){
			var item = items[i];
			__plugin.logger.info("Casino:"+sac+" <"+item.getType()+"/"+item.getAmount()+">");
			player.sendMessage(" - §6"+item.getType()+"/"+item.getAmount()+"§1个");
		}
		world.playSound(player.location,org.bukkit.Sound.FIZZ,2,0);
		for(var i in items_entity){
			items_entity[i].remove();
		}
		
		// Burn!
		
		var outcomes = [];
		
		// Normal random drop
		outcomes.push({
			execute: function(){
			
				var C = (cas.maxReturn==undefined?10:cas.maxReturn);
				var R = (cas.avgReturn==undefined?0.9:cas.avgReturn);
				
				var A = (C/R)-1;
				var x = Math.random();
				var fx = C*Math.pow(x,A);
					//__plugin.logger.info("Normal draw: "+fx);
			
				__plugin.logger.info("Casino:"+sac+" <normal> fx="+fx);
				for(var i in items){
					items[i].setAmount(Math.round(items[i].getAmount()*fx));
				}
				items = __that.removeEmptyItems(items);
				items = __that.splitItem(items,2);
				__that.burnInterior(cas.bottom,world,false);
				var stopFire = new java.lang.Runnable({
					run: function(){
						// Okay, stop the fire.
						__that.burnInterior(cas.bottom,world,true);
						if(fx>1.5)
							world.playSound(player.location,org.bukkit.Sound.LEVEL_UP,1,2);							
						if(fx>5)
							player.sendMessage("§c靠！赚了！赚了！");
						else if(fx>3)
							player.sendMessage("§c赚了！赚了！");
						else if(fx>1.5)
							player.sendMessage("§c赚了！");
						else if(fx<0.8)
							player.sendMessage("§c哎，亏了....");
						// Spray goodies!
						__that.dropItem(cas.dropper,world,items,60,10);
					}
				});
				server.getScheduler().runTaskLater(__plugin,stopFire,100);
			},
			weight: (cas.o_normal==undefined?95:cas.o_normal)
		});
		
		
		// Burn the goodies!
		outcomes.push({
			execute: function(){
				//__plugin.logger.info("Burn the gooodies");
				__plugin.logger.info("Casino:"+sac+" <burn>");
				__that.burnInterior(cas.bottom,world,false);
				var stopFire = new java.lang.Runnable({
					run: function(){
						// Okay, stop the fire.
						__that.burnInterior(cas.bottom,world,true);
					}
				});
				server.getScheduler().runTaskLater(__plugin,stopFire,200);
				
				var sprayGoodie = new java.lang.Runnable({
					run: function(){
						items = __that.splitItem(items,2);
						// Spray goodies!
						world.playSound(player.location,org.bukkit.Sound.EXPLODE,2,4);
						player.sendMessage("§c呀！！ 都被烧了....");
						__that.dropItem(cas.dropper,world,items,60,10);
					}
				});
				server.getScheduler().runTaskLater(__plugin,sprayGoodie,100);
			},
			weight: (cas.o_burn==undefined?10:cas.o_burn)
		});
		
		/*// Spawn mobs
		outcomes.push({
			execute: function(){
				__that.burnInterior(cas.bottom,world,false);
				var stopFire = new java.lang.Runnable({
					run: function(){
						// Okay, stop the fire.
						__that.burnInterior(cas.bottom,world,true);
						
						// Spray goodies!
						__that.dropItem(cas.dropper,world,items,60,10);
					}
				});
				server.getScheduler().runTaskLater(__plugin,stopFire,100);
			},
			weight: 1
		});*/
		
		
		// Goodies fly everywhere
		outcomes.push({
			execute: function(){
				__plugin.logger.info("Casino:"+sac+" <fly>");
				for(var i in items){
					items[i].setAmount(Math.round(items[i].getAmount()*1.3));
				}
				__that.splitItem(items,2);
				__that.burnInterior(cas.bottom,world,false);
				var stopFire = new java.lang.Runnable({
					run: function(){
						// Okay, stop the fire.
						__that.burnInterior(cas.bottom,world,true);
					}
				});
				server.getScheduler().runTaskLater(__plugin,stopFire,80);
				
				var sprayGoodie = new java.lang.Runnable({
					run: function(){
						items = __that.splitItem(items,2);
						world.playSound(player.location,org.bukkit.Sound.EXPLODE,2,4);
						player.sendMessage("§c哟？！都飞走了...");
						// Spray goodies!
						__that.dropItem(cas.dropper,world,items,60,10,2);
					}
				});
				server.getScheduler().runTaskLater(__plugin,sprayGoodie,40);
			},
			weight: (cas.o_fly==undefined?10:cas.o_fly)
		});
		
		
		// Jackpot
		outcomes.push({
			execute: function(){
				__plugin.logger.info("Casino:"+sac+" <jackpot>");
				var jack_return = (cas.o_jackpot_return==undefined?40:cas.o_jackpot_return);
				for(var i in items){
					items[i].setAmount(Math.round(items[i].getAmount()*jack_return));
				}
				__that.splitItem(items,2);
				__that.burnInterior(cas.bottom,world,false);
				var stopFire = new java.lang.Runnable({
					run: function(){
						// Okay, stop the fire.
						__that.burnInterior(cas.bottom,world,true);
					}
				});
				server.getScheduler().runTaskLater(__plugin,stopFire,80);
				
				var sprayGoodie = new java.lang.Runnable({
					run: function(){
						items = __that.splitItem(items,2);
						world.playSound(player.location,org.bukkit.Sound.LEVEL_UP,1,4);						
						player.sendMessage("§5哇！！！ 发了，以后再也不囧上班了...");
						var dropper = cas.skydropper||cas.dropper;
						// Spray goodies!
						__that.dropItem(dropper,world,items,160,25);
					}
				});
				server.getScheduler().runTaskLater(__plugin,sprayGoodie,80);
			},
			weight: (cas.o_jackpot==undefined?1:cas.o_jackpot)
		});
		
		
		
		var ttOutcome = 0;
		for(var j in outcomes) ttOutcome+=outcomes[j].weight;
		var theOut = Math.random()*ttOutcome;
		//__plugin.logger.info(ttOutcome+","+theOut);
		var indx=0;
		for(;theOut-outcomes[indx].weight>0&&indx<outcomes.length;theOut-=outcomes[indx].weight,indx++);
		if(indx>=outcomes.length) indx=0;
		outcomes[indx].execute();
		return true;
	}
},true);

ready(function(){
	//special handle for portal enter event
	/*events.on("player.PlayerPortalEvent",function(listener, evt){
		var player = evt.getPlayer();
		var loc = player.getLocation();
		var region = casino.getRegion("casino",player.world);
		if(region.contains(loc.x,loc.y,loc.z))
			evt.setCancelled(true);
	});*/
});