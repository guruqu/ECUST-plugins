load(__folder + "../events/events.js");

plugin("market", {
	listMarket: function(){
		__plugin.logger.info("List of markets:");
		for(var i in market.store){
			__plugin.logger.info(i);
		}
	},
	getAwayFromOne: function(v){
		if(v>0.99&&v<=1.0)	return 0.99;
		else if(v>1.0&&v<1.01) return 1.01;
		return v;
	},
	getTradeRatio: function(from,to,amount){
		var _from = market.store.inventory[from];
		var _to = market.store.inventory[to];
		
		/*
		*  Price for each unit at inventory amount x is: F(x) = C/x^A
		*	G(x, dta) = Int_F(x+dta) - Int_F(x)
		*	Trade ratio gurantees G(x_1,dta_1) = G(x_2, -dta_2)
		*	Given resource 1 amount of dta_1 which has inventory amount x_1,
		*	trading for resource 2 at inventory amount x_2, calculate dta_2
		*/

		var _value = this.getValueOf(from,amount);
		var _amnt = this.getEqualAmount(to,-_value);
		return -_amnt;
	},
	getValueOf: function(type,amount){
		var _from = market.store.inventory[type];
		if(!this.validSource(type))
			return -1;
		var _n2 = this.getAwayFromOne(_from.lambda)-1;
		var _x2 = _from.amount;
		var _c2 = _from.c;
		
		if(_x2+amount<0)
			return -1;
		var _right = _c2/_n2*(1.0/Math.pow(_x2,_n2)-1.0/Math.pow(_x2+amount,_n2));
		return _right;
	},
	getEqualAmount: function(type,value){
		var _from = market.store.inventory[type];
		if(!this.validSource(type))
			return -1;
		
		var _n1 = this.getAwayFromOne(_from.lambda)-1;
		var _c1 = _from.c;
		var _x1 = _from.amount;
		
		var _right = 1.0/Math.pow(_x1,_n1)-value*_n1/_c1;
		if(_right<0)
			throw "WTF _right: "+_right;
			
		_right = Math.pow(_right,-1.0/_n1)-_x1;
		return _right;
	},
	setSign: function(region,world,textArr){
		var signs = utils.filterRegion(
			region,
			world,
			function(block){
				return block.getState() instanceof org.bukkit.block.Sign;
			});
		for(var i in signs){
			var _sign = signs[i].getState();
			for(var j=0;j<textArr.length;j++){
				_sign.setLine(j,textArr[j]);
			//	echo(j+","+textArr[j]);
			}
			_sign.update();
		}
	}
	,
	getTrade: function(sac,world){
		var _market = market.store.stations[sac];
		if(_market==undefined){
			echo("Undefined market: "+sac);
			return;
		}
		var _container = _market.platform;
		var _itemsEntity = casino.getItemsIn(_container,world);
		var _items = [];
		for(var i in _itemsEntity) _items.push(_itemsEntity[i].getItemStack());
		
		var ret = {};
		ret.value=0;
		ret.validItem=[];
		ret.itemEntity = _itemsEntity;
		for(var i in _items){
			var item = _items[i];
			var _v = this.getValueOf(item.getType(),item.getAmount());
			if(_v<0 || item.getType()==_market.type){
				// Notify a non-tradable item
			//	echo("Invalid item:"+item.getType());
				continue;
			}
			ret.value += _v;
			ret.validItem.push({
				item: item,
				value: _v
			});
		}
		
		var _stationtype = _market.type;
		
		ret.tradeAmount = -this.getEqualAmount(_stationtype,-ret.value);
		if(ret.tradeAmount<0)
			return ret;
		ret.tradeAmount += _market.remainder+1e-5;
		ret.newRemain = ret.tradeAmount-Math.floor(ret.tradeAmount);
		ret.tradeAmount = Math.floor(ret.tradeAmount);
		
		return ret
	},
	getRefPrices: function(){
		var ret = {};
		for(var type in market.store.inventory){
			var _type = market.store.inventory[type];
			var _v = _type.c/Math.pow(_type.amount,_type.lambda);
			ret[type] = _v;
		}
		return ret;
	},
	startTrade: function(sac,world,player){
		//__plugin.logger.info("System log");
		var _market = market.store.stations[sac];
		var _tradeInfo = this.getTrade(sac,world);
		for(var i in _tradeInfo.itemEntity){
			var entity = _tradeInfo.itemEntity[i];
			var is = entity.getItemStack();
			if(this.validSource(is.getType())&&is.getType()!=_market.type)
			{
				market.store.inventory[is.getType()].amount += is.getAmount();
				entity.remove();
				if(is.getAmount()>0){
					__plugin.logger.info("User:"+player+" sold <"+is.getType()+"/"+is.getAmount()+">");
				}
			}
		}
		
		var itemStack = new org.bukkit.inventory.ItemStack(
			org.bukkit.Material.valueOf(_market.type),
			_tradeInfo.tradeAmount);
		if(_tradeInfo.tradeAmount<=0)
			return;
		
		__plugin.logger.info("User:"+player+" bought <"+_market.type+"/"+_tradeInfo.tradeAmount+">");
		market.store.inventory[_market.type].amount -= _tradeInfo.tradeAmount;
		var itemStacks = casino.splitItem([itemStack],32);
		casino.dropItem(_market.dropper,world,itemStacks,10,2,0.2);
		
		_market.remainder = _tradeInfo.newRemain;
	},
	validSource: function(type,avoidType){
		var _t = market.store.inventory[type];
		if(_t==undefined || !_t.allow)	return false;
		if(avoidType!=undefined&&avoidType==_t) return false;
		return true;
	},	
	tradeSignUpdate: function(){
		var refValue = this.getRefPrices();
		
		
		for(var si in market.store.stations){
			var station = market.store.stations[si];
			var world = server.getWorld(station.world);
			var tradeInfo = this.getTrade(si,world);
	//utils.keys(tradeInfo);
			if(tradeInfo.tradeAmount<=0){
				this.setSign(station.signEqualAmount,world,
					[
						"",
						"请放入交易物品",
						""
					]);
			}else{
				this.setSign(station.signEqualAmount,world,
					[
						"可以交换",
						"§a"+tradeInfo.tradeAmount+".§c["+Math.floor(100*tradeInfo.newRemain)+"]","",
						"§6<"+station.type+">"
					]);
			}
			
			this.setSign(station.signTradeReference,world,
					[
						"参考价值",
						"§a"+java.lang.String.format("%.2f",refValue[station.type]*100000),
						"",
						"§6<"+station.type+">"
					]);
		}
	}
},true);


//market.store.inventory = market.store.inventory || {};

// Mock inventoryj, reset every resttart
/*market.store.inventory = {
	DIAMOND: {
		amount: 1000,
		lambda: 1.1,
		c: 1,
		allow: true
	},
	LOG: {
		amount: 2000,
		lambda: 1.1,
		c: 1,
		allow: true
	}
};

market.store.stations = {
	trade_diamond: {
		closed: false,
		remainder: 0,
		type: "DIAMOND",
		platform: "trade_diamond_platform",
		dropper: "4",
		signTradeReference: "trade_diamond_sign_ref",
		signEqualAmount: "trade_diamond_sign_amount",
		signInventoryAmount: "",
		world: "world"
	}
};
*/
ready(function(){
	var updateTask = new java.lang.Runnable({
		run: function(){
			market.tradeSignUpdate();
		}
	});
	server.getScheduler().runTaskTimer(__plugin,updateTask,20,20);
});