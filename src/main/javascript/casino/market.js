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
	updateTrade: function(sac,world,player){
		// Update bean counts
		// Update board display
		var tradeInfo = this.getTrade();
		
		
		return tradeInfo;
	}
	,
	getTrade: function(sac,world,player){
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
			if(_v<0){
				// Notify a non-tradable item
				continue;
			}
			ret.value += _v;
			ret.validItem.push({
				item: item,
				value: _v
			});
		}
		
		var _stationtype = _market.type;
		
		ret.tradeAmount = getEqualAmount(_stationtype,value);
		ret.tradeAmount += _market.remainder;
		ret.newRemain = tradeAmount-Math.floor(tradeAmount);
		ret.tradeAmount = Math.floor(tradeAmount);
		
		return ret
	},
	startTrade: function(sac,world,player){
		//__plugin.logger.info("System log");
		var _market = market.store[sac];
		var _tradeInfo = updateTrade(sac,world,player);
		for(var i in _tradeInfo.itemEntity){
			var entity = _tradeInfo.itemEntity[i];
			entity.remove();
		}
		
		var itemStack = new org.bukkit.inventory.ItemStack(
			org.bukkit.Material.valueOf(_market.type),
			_tradeInfo.tradeAmount);
			
		var itemStacks = casino.splitItem(itemStack,5);
		
		casino.dropItem(_market.platform,world,itemStacks,40,8);
		
		_market.remainder = _tradeInfo.newRemain;
	},
	validSource: function(type){
		var _t = market.store.inventory[type];
		if(_t==undefined || !_t.allow)	return false;
		return true;
	}
},true);


//market.store.inventory = market.store.inventory || {};

// Mock inventoryj, reset every resttart
market.store.inventory = {
	DIAMOND: {
		amount: 1000,
		lambda: 1.1,
		c: 1,
		allow: true
	},
	WOOD: {
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
		signTradeReference: "",
		signEqualAmount: "",
		signInventoryAmount: "",
	}
};

ready(function(){	
});