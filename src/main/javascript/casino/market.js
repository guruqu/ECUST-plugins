load(__folder + "../events/events.js");

plugin("market", {
	listMarket: function(){
		__plugin.logger.info("List of markets:");
		for(var i in market.store){
			__plugin.logger.info(i);
		}
	},
	getAwayFromOne(v){
		if(v>0.99&&v<=1.0)	return 0.99;
		else if(v>1.0&&v<1.01) return 1.01;
		return v;
	},
	getTradeRatio(from,to,amount){
		var _from = market.store.inventory[from];
		var _to = market.store.inventory[from];
		
		/*
		*  Price for each unit at inventory amount x is: F(x) = C/x^A
		*	G(x, dta) = Int_F(x+dta) - Int_F(x)
		*	Trade ratio gurantees G(x_1,dta_1) = G(x_2,dta_2)
		*	Given resource 1 amount of dta_1 which has inventory amount x_1,
		*	trading for resource 2 at inventory amount x_2, calculate dta_2
		*/
		
		if(!validSource(_from)||!validSource(_to))
			return -1;
		
		// For simplicty of coding, let's get around the case of n=1
		var _n2 = getAwayFromOne(_from.lambda)-1;
		var _n1 = getAwayFromOne(_to.lambda)-1;	
		
		var _x2 = _from.amount;
		var _x1 = _to.amount;
		
		var _c2 = _from.c;
		var _c1 = _to.c;
		
		var _right = _c1/_n1/Math.pow(_x1,_n1) - _c2/_n2*_n1/_c1*(1.0/Math.pow(_x2,_n2) - 1.0/Math.pow(_x2+amount,_n2));
		_right = Math.pow(_right,-1.0/_n1);
		
		return _right;
	},
	updateTrade(sac,world,player){
		// Update bean counts
		// Update board display
	},
	doTrade(sac,world,player){
		// Check the bean counts and do trade accordingly
		// Update board display
	},
	startTrade: function(sac,world,player){
		//__plugin.logger.info("System log");
		var _market = market.store[sac];
		updateTrade(sac,world,player);
		doTrade(sac,world,player);
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
		lambda: 0.5,
		c: 1,
		allow: true
	},
	WOOD: {
		amount: 2000,
		lambda: 1,
		c: 1,
		allow: true
	}
};

market.store.station = {
	trade_diamond: {
		closed: false,
		type: DIAMOND,
		platform: "trade_diamond_platform",
		signTradeReference: "",
		signEqualAmount: "",
		signInventoryAmount: "",
	}
};

ready(function(){	
});