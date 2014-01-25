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
		grid: [20,20],  // Grid size / Tamaño de cuadricula
		start: true,    // Start after load / Iniciar despues de cargar
		snake: [1,3],   // Initial position / Posicion inicial
		speed: 300,    // Speed in miliseconds / Velocidad en milisegundos
		enemies: 5,     // Draw NPC enemy snakes / Cantidad de serpientes enemigas
		$el: el,        // The jQuery container / El contenedor como objeto jQuery
		walls: false,   // Has walls? / ¿Tablero con paredes?
		fruitPos: null, // Fruit position (for NPC purposes) / Posicion de la fruta (usado por los enemigos)
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
		var i;
		this.genCSS();
		this.renderGrid();
		this.newSnake(this.vals.snake);
		for(i=0;i<this.vals.enemies;i++){
			this.newNPCSnake();
		}
		if(this.vals.walls){
			this.turnWalls(true);
		}
		this.attachEvents();
		if(this.vals.start){
			this.begin();
		}
		this.fruit();
	},
	update: function(params){
		var validParams = false,
			nParam = {},
			tmp;
		switch(typeof params){
			case "undefined":
				return;
			break;
			case "string":
				switch(params){
					case "start":
						validParams = true;
						nParam.start = true;
					break;
					case "stop":
						validParams = true;
						nParam.start = false;
					break;
					case "toggle":
						validParams = true;
						nParam.start = (this.vals.start) ? false : true;
					break;
					case "walls":
						this.turnWalls(true);
					break;
					case "noWalls":
						this.turnWalls();
					break;
					case "toggleWalls":
						tmp = (this.vals.walls) ? false : true;
						this.turnWalls(tmp);
					break;
					case "clear":
						this.vals.start = false;
						this.renderGrid();
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
		if(validParams){
			params = nParam;
		}
		if(typeof params == "object"){
			$.extend(this.vals,params);
			
			// Update grid size
			if(!$.isEmptyObject(params.grid)){
				this.renderGrid();
				this.reloadSnakes();
				this.fruit();
			}
			// Update start
			if(typeof params.start != "undefined"){
				if(params.start){
					this.begin();
				}else{
					this.vals.t = null;
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
			this.vGrid.push(vC);
		}
		this.$grid.append("<input type='text' class='GRIDControl' />");
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
			css += "#GRID.walls{border:3px solid #000}";
			css += "#GRID .cell{margin-left:1px;margin-top:1px;height:10px;width:10px;background-color:#FFF;}";
			css += "#GRID .col {float:left;}";
			css += "#GRID .cell.on{background-color:black;}";
			css += "#GRID .cell.npc{background-color:#69F;}";
			css += "#GRID .cell.dead{background-color:#BBB;}";
			css += "#GRID .cell.fruit{background-color:#F00;}";
			css += "#GRID input.GRIDControl{opacity:0;filter:alpha(opacity=0);position:absolute;top:0;left:0;cursor:pointer !important}";
			$el = $("<style>");
			$el.attr("id","GRIDCSS").append(css);
			$("body").append($el);
		}
	},
	newSnake: function(point,auto){
		var auto = auto || false,
			id = (auto) ? this.snakes.length : false;
			snake = new $.Snake.Snake(this,auto,id);
		this.snakes.push(snake);
		if(!auto){
			this.defSnake = snake;
		}
		snake.start(point);
	},
	newNPCSnake: function(){
		var rand,coords,cell,
			eList = this.getEmpty();
		if(eList){
			rand = Math.floor(Math.random()*eList.length);
			cell = eList[rand];
			coords = cell.getCoords();
			this.newSnake(coords,true);
		}
		
	},
	go:function(){
		var i,len,snake;
		if(!this.vals.start){
			return false;
		}
		for(i=0,len=this.snakes.length;i<len;i++){
			snake = this.snakes[i];
			if(snake.alive){
				snake.go();
			}
		}
		this.begin();
	},
	begin: function(){
		var self = this;
		this.vals.t = setTimeout(function(){
			self.go();
		},this.vals.speed);
	},
	reloadSnakes: function(){
		var i,len,snake;
		for(i=0,len=this.snakes.length;i<len;i++){
			snake = this.snakes[i];
			snake.grid = this.vGrid;
			snake.redraw();
		}
	},
	fruit: function(){
		var rand,cell,
			eList = this.getEmpty();
		if(eList){
			rand = Math.floor(Math.random()*eList.length);
			cell = eList[rand];
			this.vals.fruitPos = cell.getCoords();
			cell.state("fruit");
		}
	},
	getEmpty: function(){
		var i, j, len, x, y, len2, item,
			res = [];
		
		for(i=0,len=this.vGrid.length;i<len;i++){
			x = this.vGrid[i];
			for(j=0,len2=x.length;j<len2;j++){
				item = x[j];
				if(item.state() == "off"){
					res.push(item);
				}
			}
		}
		return (res.length > 0) ? res : false;
	},
	turnWalls: function(walls){
		walls = walls || false;
		this.vals.walls = walls;
		if(walls){
			this.$grid.addClass("walls");
		}else{
			this.$grid.removeClass("walls");
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
$.Snake.Cell = function(id,$el,wall){
	this.id = id;
	this.$el = $el;
	this.wall = wall || false;
	this.st = (this.wall) ? "wall" : "off";
};
$.Snake.Cell.prototype = {
	state: function(s){
		s = s || "get";
		if (s == "get"){
			return this.st
		}else{
			this.st = s;
			if(!this.wall){
				this.refresh();
			}
		}
	},
	refresh: function(){
		this.$el.removeClass().addClass("cell")
		if(this.st != "off"){
			this.$el.addClass(this.st);
		}
	},
	getCoords: function(){
		var coords;
		coords = this.id.split(",");
		coords[0] = parseInt(coords[0]);
		coords[1] = parseInt(coords[1]);
		return coords;
	}
}
$.Snake.Snake = function(board,auto,id){
	this.id = id || false;
	this.auto = auto || false;
	this.alive = true;
	this.state = (auto) ? "npc"+" s"+this.id : "on";
	this.grid = board.vGrid;
	this.board = board;
	this.cells = [];
	this.head = null;
	this.tail = null;
	this.turnDir = "r"
	this.dir = "r";
	this.grow = 0;
	this.NPC = (this.auto) ? new $.Snake.NPC(this.board,this) : false;
}
$.Snake.Snake.prototype = {
	stepsPerFruit:2,
	start:function(point,dir){
		var i,len,cell,p,
			points = [];
		this.dir = dir || "r";
		points.push(point);
		
		step = (point[0] > 0) ? point[0]-1 : this.grid.length-1 ;
		points.splice(0, 0,[step,point[1]]);
		step = (step > 0) ? step-1 : this.grid.length-1 ;
		points.splice(0, 0,[step,point[1]]);
		
		for(i=0,len=points.length;i<len;i++){
			p = points[i];
			cell = {
				next: false,
				prev: false
			};
			cell.cell = this.grid[p[0]][p[1]];
			cell.cell.state(this.state);
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
			case "off":
				this.move(next);
			break;
			case "dead":
				this.move(next);
			break;
			case "fruit":
				this.grow += this.stepsPerFruit;
				this.move(next);
				this.board.fruit();
			break;
			default:
				this.die();
			break;
		}
		if(this.NPC){
			this.dir = this.NPC.getNextDir();
		}
	},
	die: function(){
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
		newHead.cell.state(this.state);
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
	redraw: function(){
		var i, len, cell;
		for(i=0,len=this.cells.length;i<len;i++){
			cell = this.cells[i];
			this.reloadCell(cell);
		}
		if(!this.alive){
			this.die();
		}
	},
	reloadCell: function(cell){
		var newCell = {},
			pCords = cell.cell.getCoords();
		if(typeof this.grid[pCords[0]] != "undefined" && typeof newCell != "undefined"){
			newCell = this.grid[pCords[0]][pCords[1]]
			cell.cell = newCell;
			cell.cell.state(this.state);
		}else{
			this.alive = false;
		}
	},
	getNext: function(dir){
		var cell = this.head.cell,
			coords = cell.getCoords(),
			nextCords = [],
			nextItem = null,
			dir = dir || this.dir,
			walls = this.board.vals.walls,
			outside = false;
		switch(dir){
			case "r":
				if(coords[0] >= this.grid.length-1){
					nextCords[0] = 0;
					outside = true;
				}else{
					nextCords[0] = coords[0] + 1;
				}
				nextCords[1] = coords[1];
			break;
			case "l":
				if(coords[0] < 1){
					nextCords[0] = this.grid.length-1 ;
					outside = true;
				}else{
					nextCords[0] = coords[0] - 1;
				}
				nextCords[1] = coords[1];
			break;
			case "d":
				if(coords[1] >= this.grid[0].length-1){
					nextCords[1] = 0;
					outside = true;
				}else{
					nextCords[1] = coords[1] + 1;
				}
				nextCords[0] = coords[0];
			break;
			case "u":
				if(coords[1] < 1){
					nextCords[1] = this.grid[0].length-1;
					outside = true;
				}else{
					nextCords[1] = coords[1] - 1;
				}
				nextCords[0] = coords[0];
			break;
		}
		nextItem = (walls && outside) ? new $.Snake.Cell("wall",null,true) : this.grid[nextCords[0]][nextCords[1]];
		return nextItem;
	}
}
$.Snake.NPC = function(board,snake){
	this.board = board;
	this.snake = snake;
	this.headPos = [];
	this.dir = "r";
	this.fruitPos = board.vals.fruitPos;
}
$.Snake.NPC.prototype = {
	getNextDir: function(){
		var newDir;
		this.dir = this.snake.dir;
		this.fruitPos = this.board.vals.fruitPos;
		this.headPos = this.snake.head.cell.getCoords();
		newDir = this.evade() || this.lookFruit() || this.dir;
		return newDir;
	},
	evade: function(){
		var dirs = ["r","d","l","u"],
			newDir = this.dir,
			gNCell,i,len;
		gNCell = this.snake.getNext(this.dir);
		if(gNCell.state() == "off" || gNCell.state() == "fruit" || gNCell.state() == "dead"){
			return false;
		}else{
			for(i=0,len=dirs.length;i<len;i++){
				if(this.tryDir(dirs[i])){
					gNCell = this.snake.getNext(dirs[i]);
					if(gNCell.state() == "off" || gNCell.state() == "fruit" || gNCell.state() == "dead"){
						newDir = dirs[i];
						break;
					}
				}
			}
			return newDir;
		}
	},
	lookFruit: function(){
		var lr,ud,dist=[],i=0,len,res,gNCell,dirs = ["r","d","l","u"],order=[],tmp;
		if(this.board.vals.walls){
			lr = (this.fruitPos[0] == this.headPos[0]) ? false : (this.fruitPos[0] < this.headPos[0]) ? "l" : "r";
			ud = (this.fruitPos[1] == this.headPos[1]) ? false : (this.fruitPos[1] < this.headPos[1]) ? "u" : "d";
			order.push(lr);
			order.push(ud);
			tmp = dirs.join("").replace(lr,"").replace(ud,"").split("");
			order.concat(order)
			for(len=order.length;i<len;i++){
				res = this.tryDir(order[i]);
				gNCell = this.snake.getNext(res);
				res = (gNCell.state() == "off" || gNCell.state() == "fruit" || gNCell.state() == "dead") ? res : false;
				if(res){
					break;
				}
			}
			return res;
		}else{
			dist.push({name:"r",val:this.getDist("r")});
			dist.push({name:"l",val:this.getDist("l")});
			dist.push({name:"d",val:this.getDist("d")});
			dist.push({name:"u",val:this.getDist("u")});
			
			dist.sort(function(a,b) {
				return a.val - b.val;
			});
			for(len=dist.length;i<len;i++){
				res = this.tryDir(dist[i]);
				gNCell = this.snake.getNext(res);
				res = (gNCell.state() == "off" || gNCell.state() == "fruit" || gNCell.state() == "dead") ? res : false;
				if(res){
					break;
				}
			}
			return res;
		}
	},
	tryDir: function(dir){
		var op = {
				r:"l",
				l:"r",
				u:"d",
				d:"u",
			},
			target = (typeof dir == "object") ? dir.name : dir;
		return (this.dir != op[target]) ? target : false;
	},
	getDist: function(d){
		var form,fT,hT,o;
		switch(d){
			case "r":
				fT = this.fruitPos[0];
				hT = this.headPos[0];
				o = true;
			break;
			case "l":
				fT = this.fruitPos[0];
				hT = this.headPos[0];
				o = false;
			break;
			case "u":
				fT = this.fruitPos[1];
				hT = this.headPos[1];
				o = false;
			break;
			case "d":
				fT = this.fruitPos[1];
				hT = this.headPos[1];
				o = true;
			break;
		}
		form = fT-hT;
		form = (form<0) ? form+this.board.vGrid.length : form;
		form = (o) ? form : this.board.vGrid.length - form;
		form = (form == 0) ? this.board.vGrid.length : form;
		return form;
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
