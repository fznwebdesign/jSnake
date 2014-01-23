/**
 * Pedro Carrazco | Snake 0.1
 * 
 * No Copyright so far
 * Sin Copyright hasta ahora
 * 
 * This project is just a hobbie, created by Pedro Carrazco,
 * reproduction is totally allowed as this code is just for fun.
 * 
 * Este proyecto es solamente un hobbie, creado por Pedro Carrazco,
 * cualquier reproduccion es permitida debido a que este codigo tiene 
 * fines unicamente de entretenimiento.
 * 
 * @version 0.1
 * @author Pedro Jose Carrazco Rivera
 */
$.Snake = function(el,values){
	/* Defaults */
	var defaults = {
		grid: [20,20], // Grid size / Tamaño de cuadricula
		start: true,   // Start after load / Iniciar despues de cargar
		snake: [1,3],  // Initial position / Posicion inicial
		speed: 300,    // Speed in miliseconds / Velocidad en milisegundos
		$el: el,        // The jQuery container / El contenedor como objeto jQuery
		t: null
	};
	this.vals = defaults;
	$.extend(this.vals,values);
	if(!this.validateGrid(this.vals.grid)){
		this.vals.grid = defaults.grid;
	}
	// Initialize / Comenzar
	this.init();
};

$.Snake.prototype = {
	vGrid:[],
	$grid:null,
	snakes:[],
	defSnake:false,
	control:null,
	init:function(){
		var self = this;
		this.genCSS();
		this.renderGrid();
		this.newSnake(this.vals.snake);
		this.attachEvents();
		
		if(this.vals.start){
			this.vals.t = setTimeout(function(){
				self.go();
			},this.vals.speed);
		}
		this.fruit();
	},
	update: function(params){
		var validateParams, nParam = {},tmp;
		switch(typeof params){
			case "undefined":
				return;
			break;
			case "string":
				switch(params){
					case "start":
						nParam.start = true;
					break;
					case "stop":
						nParam.start = false;
					break;
					case "toggle":
						nParam.start = (this.vals.start) ? false : true;
					break;
					case "reset":
						this.reset();
						this.vals.start = false;
					break;
					default:
					break;
				}
			break;
			case "number":
				params = {speed:params};
			break;
			case "object":
				if(this.validateGrid(params)){
					params = {grid:params};
				}
			break;
		}
		if(typeof params == "object"){
			$.extend(this.vals,params);
			
			// Update grid size
			if(!$.isEmptyObject(params.grid)){
				tmp = this.read();
				this.renderGrid();
				this.print(tmp)
				if(this.editing){
					this.editing = false;
					this.edit();
				}
			}
			// Update start
			if(typeof params.start != "undefined" && params.start){
				if(!$.isEmptyObject(this.vals.cells) || this.vals.demo){
					this.begin();
				}
			}
		}
	},
	renderGrid:function(){
		var c = 0,
			r = 0,
			self = this,
			i,j,$c,$r,vC,vR,width,height,cell;
		
		// Min / Max grid sizes (private)
		// Tamaños Maximo y Minimo de la cuadricula (variable privada)
		gridLimits = [5,150];
		// Apply Min / Max size limits
		// Ajustar el tamaño dentro de los limites
		this.vals.grid[0] = (this.vals.grid[0] < gridLimits[0]) ? gridLimits[0] : (this.vals.grid[0] > gridLimits[1]) ? gridLimits[1] : this.vals.grid[0];
		this.vals.grid[1] = (this.vals.grid[1] < gridLimits[0]) ? gridLimits[0] : (this.vals.grid[1] > gridLimits[1]) ? gridLimits[1] : this.vals.grid[1];
		
		c = this.vals.grid[0];
		r = this.vals.grid[1];
		this.vGrid = [];
		this.$grid = $("<div>");
		this.$grid.attr("id","GRID");
		for(i=0;i<c;i++){
			vC = [];
			$c = $("<div>");
			$c.addClass("col");
			for(j=0;j<r;j++){
				$r = $("<div>");
				$r.addClass("cell");
				vR = new $.Snake.Cell(i+","+j,$r);
				$c.append($r);
				vC.push(vR);
			}
			this.$grid.append($c);
			this.$grid.append("<input type='text' class='GRIDControl' />")
			this.vGrid.push(vC);
		}
		this.vals.$el.html(this.$grid);
		
		setTimeout(function(){
			// Fix grid size / Fijar el tamaño de la cuadricula
			width = (parseInt(self.$grid.find(".cell").css("width"))*self.vals.grid[0])+self.vals.grid[0];
			height = (parseInt(self.$grid.find(".cell").css("height"))*self.vals.grid[1])+self.vals.grid[1];
			self.$grid.css({width:width+"px",height:height+"px"});
			self.vals.$el.find(".GRIDControl").css({width:width+"px",height:height+"px"});
		},10)
	},
	validateGrid: function(grid){
		// Check format / Revisar el formato
		var res = (!grid instanceof Array || grid.length != 2 || typeof grid[0] != "number" || typeof grid[1] != "number") ? false : true;
		// Validate position / Revisar que la posicion sea valida
		res = (grid[0] < 0) ? false : res;
		res = (grid[1] < 0) ? false : res;
		return res;
	},
	genCSS: function(){
		var css = "",$el=null;
		if($("GRIDCSS").length<=0){
			css += "#GRID{background-color:#F9F9F9;border:1px solid #CCC;padding:0 1px 1px 0;position:relative}";
			css += "#GRID .cell{margin-left:1px;margin-top:1px;height:10px;width:10px;background-color:#FFF;}";
			css += "#GRID .col {float:left;}";
			css += "#GRID .cell.on{background-color:black;}";
			css += "#GRID .cell.dead{background-color:#BBB;}";
			css += "#GRID .cell.fruit{background-color:#F96;}";
			css += "#GRID input.GRIDControl{opacity:0;filter:alpha(opacity=0);position:absolute;top:0;left:0;cursor:pointer !important}";
			$el = $("<style>");
			$el.attr("id","GRIDCSS").append(css);
			$("body").append($el);
		}
	},
	newSnake: function(args,auto){
		var auto = auto || false,
			snake = new $.Snake.Snake(this,auto);
		this.snakes.push(snake);
		if(!auto){
			this.defSnake = snake;
		}
		snake.start(args,"r");
	},
	go:function(){
		var self = this,
			i,len,snake;
		if(!this.vals.start){
			return false;
		}
		for(i=0,len=this.snakes.length;i<len;i++){
			snake = this.snakes[i];
			if(snake.alive){
				snake.go();
			}
		}
		this.vals.t = setTimeout(function(){
			self.go();
		},this.vals.speed);
	},
	fruit: function(){
		var setFruit = false;
		while(!setFruit){
			setFruit = this.rndmFruit();
		}
		setFruit.state("fruit");
	},
	rndmFruit: function(){
		var xR,yR,item;
		xR = Math.floor(Math.random()*this.vGrid.length);
		yR = Math.floor(Math.random()*this.vGrid.length);
		item = this.vGrid[xR][yR];
		if(item.state() != "off"){
			return false;
		}else{
			return item
		}
	},
	attachEvents: function(){
		var target = this.defSnake;
		if(target){
			this.vals.$el.find(".GRIDControl").keydown(function(e){
				switch(e.keyCode){
					case 37:
						target.changeDir("l");
					break;
					case 38:
						target.changeDir("u");
					break;
					case 39:
						target.changeDir("r");
					break;
					case 40:
						target.changeDir("d");
					break;
					default:
						return false;
				}
			});
		}
	}
}
$.Snake.Cell = function(id,$el){
	this.id = id;
	this.$el = $el;
	this.st = "off";
};
$.Snake.Cell.prototype = {
	state: function(s){
		s = s || "get";
		if (s == "get"){
			return this.st
		}else{
			this.st = s;
			this.refresh();
		}
	},
	refresh: function(){
		this.$el.removeClass().addClass("cell")
		if(this.st != "off"){
			this.$el.addClass(this.st);
		}
	}
}
$.Snake.Snake = function(board,auto){
	this.auto = auto || false;
	this.alive = true;
	this.grid = board.vGrid;
	this.board = board;
	this.cells = [];
	this.head = null;
	this.tail = null;
	this.turnDir = "r"
	this.dir = "r";
	this.grow=0;
}
$.Snake.Snake.prototype = {
	stepsPerFruit:2,
	start:function(args,dir){
		var i,len,cell,p,
			points = [];
		this.dir = dir || "r";
		points.push(args);
		
		step = (args[0] > 0) ? args[0]-1 : this.grid.length-1 ;
		points.splice(0, 0,[step,args[1]]);
		step = (step > 0) ? step-1 : this.grid.length-1 ;
		points.splice(0, 0,[step,args[1]]);
		
		for(i=0,len=points.length;i<len;i++){
			p = points[i];
			cell = {
				next: false,
				prev: false
			};
			cell.cell = this.grid[p[0]][p[1]];
			cell.cell.state("on");
			this.cells.push(cell);
		}
		this.setPrevNext();
	},
	setPrevNext: function(){
		var i,len,cell;
		for(i=0,len=this.cells.length;i<len;i++){
			cell = this.cells[i];
			if(i==0){
				cell.prev = false;
				this.tail = cell;
			}else{
				cell.prev = this.cells[(i-1)];
			}
			if(i==(len-1)){
				cell.next = false;
				this.head = cell;
			}else{
				cell.next = this.cells[(i+1)];
			}
		}
	},
	go: function(){
		var next = this.getNext(),
			nState = next.state();
		if(!this.alive){
			return false;
		}
		this.turnDir = this.dir;
		switch(nState){
			case "on":
				this.death();
			break;
			case "fruit":
				this.grow += this.stepsPerFruit;
				this.move(next);
				this.board.fruit();
			break;
			default:
				this.move(next);
			break;
		}
	},
	death: function(){
		var i, len,cell;
		this.alive = false;
		for(i=0,len=this.cells.length;i<len;i++){
			cell = this.cells[i];
			cell.cell.state("dead");
		}
	},
	move: function(next){
		var prevHead = this.head,
			newHead = {
				next: false,
				prev: false
			},
			newTail = this.tail.next;
		newHead.cell = next;
		newHead.cell.state("on");
		newHead.next = false;
		newHead.prev = prevHead;
		prevHead.next = newHead;
		this.head = newHead;
		this.cells.push(newHead);
		
		if(this.grow < 1){
			this.tail.cell.state("off");
			this.tail = newTail;
			this.cells.splice(0,1);
			newTail.prev = false;
		}else{
			this.grow--;
		}
	},
	changeDir: function(dir){
		var op = {
			r:"l",
			l:"r",
			u:"d",
			d:"u",
		}
		if(this.turnDir != op[dir]){
			this.dir = dir;
		}
	},
	getNext: function(dir){
		var cell = this.head.cell,
			cords = cell.id.split(","),
			nextCords = [],
			nextItem = null,
			dir = dir || this.dir;
		cords[0] = parseInt(cords[0]);
		cords[1] = parseInt(cords[1]);
		switch(dir){
			case "r":
				nextCords[0] = (cords[0] >= this.grid.length-1) ? 0 : cords[0] + 1;
				nextCords[1] = cords[1];
			break;
			case "l":
				nextCords[0] = (cords[0] < 1) ? this.grid.length-1 : cords[0] - 1;
				nextCords[1] = cords[1];
			break;
			case "d":
				nextCords[0] = cords[0];
				nextCords[1] = (cords[1] >= this.grid[0].length-1) ? 0 : cords[1] + 1;
			break;
			case "u":
				nextCords[0] = cords[0];
				nextCords[1] = (cords[1] < 1) ? this.grid[0].length-1 : cords[1] - 1;
			break;
		}
		nextItem = this.grid[nextCords[0]][nextCords[1]];
		return nextItem;
	}
}
// jQuery Plugin
$.fn.extend({
	Snake: function(params) {
		return this.each(function() {
			var $this = $(this), Snake = $this.data("Snake");
			if (!Snake){
				params = params || {};
				Snake = new $.Snake($this,params);
				$this.data("Snake", Snake);
			}else{
				$this.data("Snake").update(params);
			}
		});
	}
});
