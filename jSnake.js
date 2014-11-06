/**
 * Pedro Carrazco | Snake 1.0
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
 * @version 1.0
 * @author Pedro Jose Carrazco Rivera
 */
$.Snake = function(el,values){
	/* Defaults */
	var defaults = {
		grid: [20,20],   // Grid size / Tamaño de cuadricula
		start: true,     // Start after load / Iniciar despues de cargar
		snake: [2,3],    // Initial position / Posicion inicial
		controls: "auto",// Show Controls by default / Mostrar controles
		speed: 300,      // Speed in miliseconds / Velocidad en milisegundos
		enemies: 0,      // Draw NPC enemy snakes / Cantidad de serpientes enemigas
		killers: 0,      // Draw NPC enemy killer snakes / Cantidad de serpientes enemigas asesinas
		score: false,    // Draw a score board / Mostrar tabla de puntuacion
		$el: el,         // The jQuery container / El contenedor como objeto jQuery
		walls: false,    // Has walls? / ¿Tablero con paredes?
		fruitPos: null,  // Fruit position (for NPC purposes) / Posicion de la fruta (usado por los enemigos)
		fruitVal: 10,    // Points per eaten fruit / Puntos por fruta deborada
		snakeVal: 100,   // Points per beaten snake / Puntos por serpiente derrotada
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
	board: null,
	controls: null,
	init:function(){
		var i;
		this.snakes = [];
		this.defSnake = false,
		this.board = new $.Snake.Board(this);
		this.attachControls();
		this.genCSS();
		this.renderGrid();
		for(i=0;i<this.vals.enemies;i++){
			this.newNPCSnake();
		}
		for(i=0;i<this.vals.killers;i++){
			this.newNPCSnake(true);
		}
		this.newSnake(this.vals.snake);
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
					case "toggleScore":
						tmp = (this.vals.score) ? false : true;
						if(!tmp){
							this.$grid.addClass("noBoard");
						}else{
							this.$grid.removeClass("noBoard");
						}
						this.vals.score = tmp;
					break;
					case "newEnemy":
						this.vals.enemies++;
						this.newNPCSnake();
					break;
					case "newKiller":
						this.vals.killers++;
						this.newNPCSnake(true);
					break;
					case "reset":
						this.vals.start = false;
						this.init();
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
				this.attachEvents();
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
		this.board.$el = $("<div>");
		this.board.$el.addClass("scoreBoard");
		if(!this.vals.score){
			this.$grid.addClass("noBoard");
		}
		this.$grid.append("<input type='text' class='GRIDControl' />").prepend(this.board.$el);
		if(this.controls){
			this.controls.reattach();
		}
		this.$grid.find(".GRIDControl").focus();
		this.vals.$el.html(this.$grid);
		
		setTimeout(function(){
			// Fix grid size / Fijar el tamaño de la cuadricula
			width = (parseInt(self.$grid.find(".cell").css("width"))*self.vals.grid[0])+self.vals.grid[0];
			height = (parseInt(self.$grid.find(".cell").css("height"))*self.vals.grid[1])+self.vals.grid[1];
			self.$grid.css({width:width+"px",height:height+"px"});
			self.vals.$el.find(".GRIDControl").css({width:width+"px",height:height+"px"});
		},100)
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
			css += "#GRID{background-color:#F9F9F9;border:1px solid #CCC;padding:0 1px 1px 0;position:relative;overflow:visible;}";
			css += "#GRID.walls{border:3px solid #000}";
			css += "#GRID.noBoard .scoreBoard{display:none}";
			css += "#GRID .controlPanel{position:absolute;top:100%;left:0;right:0;background-color:#FFF;overflow:hidden}";
			css += "#GRID .controlPanel a{display:block;padding:10px 0;float:left;width:25%;text-align:center;cursor:pointer}";
			css += "#GRID .scoreBoard{position:absolute;bottom:100%;left:0;right:0;background-color:#FFF}";
			css += "#GRID .scoreBoard div{margin:5px;padding:2px;background-color:#EEE}";
			css += "#GRID .scoreBoard div.dead{background-color:#999}";
			css += "#GRID .scoreBoard div .score{display:block;float:right}";
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
	newSnake: function(point,auto,killer){
		var auto = auto || false,
			killer = killer || false,
			id = (auto) ? this.snakes.length.toString() : false,
			snake = new $.Snake.Snake(this,auto,killer,id);
		if(!auto){
			this.defSnake = snake;
		}
		this.snakes.push(snake);
		snake.start(point);
	},
	newNPCSnake: function(killer){
		var rand,coords,cell,
			killer = killer || false,
			eList = this.getEmpty();
		if(eList){
			rand = Math.floor(Math.random()*eList.length);
			cell = eList[rand];
			coords = cell.getCoords();
			this.newSnake(coords,true,killer);
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
				if(snake.id){
					this.board.refresh(snake,i);
				}else{
					this.board.refreshUser(snake);
				}
			}
		}
		for(i=0,len=this.snakes.length;i<len;i++){
			snake = this.snakes[i];
			if(snake.id){
				snake.updateDir();
			}
		}
		this.board.sort();
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
			this.vals.$el.find(".GRIDControl").off("keydown").keydown(function(e){
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
	},
	attachControls: function(){
		var c = this.vals.controls || false;
		if(c === true || (c === "auto" && /Android|Mobile/gi.test(navigator.userAgent))){
			this.controls = new $.Snake.Controls(this);
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
$.Snake.Snake = function(board,auto,killer,id){
	this.id = id || false;
	this.auto = auto || false;
	this.killer = killer || false;
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
	this.NPC = (this.auto) ? new $.Snake.NPC(this.board,this,killer) : false;
	this.points = 0;
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
				this.points += this.board.vals.fruitVal;
				this.grow += this.stepsPerFruit;
				this.move(next);
				this.board.fruit();
			break;
			default:
				this.sendPointsToKiller(nState);
				this.die();
			break;
		}
	},
	updateDir:function(){
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
	},
	sendPointsToKiller: function(killer){
		var kID = "",
			snks = this.board.snakes,
			i,len, snk;
		switch(killer){
			case "wall":
				return false;
			break;
			case "on":
				kID = false;
			break;
			default:
				kID = killer.replace("npc s","");
			break;
		}
		for(i=0,len=snks.length;i<len;i++){
			snk = snks[i];
			if(snk.id === kID && kID != this.id){
				snk.points += this.board.vals.snakeVal;
			}
		}
		
	}
}
$.Snake.NPC = function(board,snake,killer){
	this.board = board;
	this.snake = snake;
	this.killer = killer || false;
	this.headPos = [];
	this.dir = "r";
	this.fruitPos = board.vals.fruitPos;
	this.userPos = null;
	this.target = null;
}
$.Snake.NPC.prototype = {
	getNextDir: function(){
		var newDir;
		this.dir = this.snake.dir;
		this.fruitPos = this.board.vals.fruitPos;
		this.userPos = this.board.defSnake.head.cell.getCoords();
		this.headPos = this.snake.head.cell.getCoords();
		newDir = this.evade() || this.lookTarget() || this.dir;
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
	lookTarget: function(){
		var lr,ud,len,res,gNCell,tmp,
			dist=[],
			i=0,
			dirs = ["r","d","l","u"],
			order=[];
		this.chooseTarget();
		if(this.board.vals.walls){
			lr = (this.target[0] == this.headPos[0]) ? false : (this.target[0] < this.headPos[0]) ? "l" : "r";
			ud = (this.target[1] == this.headPos[1]) ? false : (this.target[1] < this.headPos[1]) ? "u" : "d";
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
				fT = this.target[0];
				hT = this.headPos[0];
				o = true;
			break;
			case "l":
				fT = this.target[0];
				hT = this.headPos[0];
				o = false;
			break;
			case "u":
				fT = this.target[1];
				hT = this.headPos[1];
				o = false;
			break;
			case "d":
				fT = this.target[1];
				hT = this.headPos[1];
				o = true;
			break;
		}
		form = fT-hT;
		form = (form<0) ? form+this.board.vGrid.length : form;
		form = (o) ? form : this.board.vGrid.length - form;
		form = (form == 0) ? this.board.vGrid.length : form;
		return form;
	},
	chooseTarget: function(){
		var uPos, fPos;
		if(this.killer && this.board.defSnake.alive){
			uPos = Math.abs(this.headPos[0]-this.userPos[0])+Math.abs(this.headPos[1]-this.userPos[1]);
			fPos = Math.abs(this.headPos[0]-this.fruitPos[0])+Math.abs(this.headPos[1]-this.fruitPos[1]);
			this.target = (uPos <= fPos) ? this.userPos : this.fruitPos;
		}else{
			this.target = this.fruitPos;
		}
	}
}
$.Snake.Board = function(board){
	this.board = board;
	this.snakes = [];
	this.positions = [];
	this.user = {};
	this.$el = null;
	this.title = $("<h2>").text("Score");
}
$.Snake.Board.prototype = {
	refresh: function(s){
		var $name, $score, i=s.id;
		if($.isEmptyObject(this.snakes[i])){
			this.snakes[i] = {};
			this.snakes[i].alive = true;
			this.snakes[i].name = (s.killer) ? "Killer Snake " + i : "Enemy Snake " + i;
			this.snakes[i].$el = $("<div>");
			this.snakes[i].$el.attr("class","NPC s"+s.id);
			this.snakes[i].points=0;
			$name = $("<span class='name'>");
			$name.text(this.snakes[i].name);
			$score = $("<span class='score'>");
			this.snakes[i].$el.append($name).append($score);
			this.$el.append(this.snakes[i].$el);
		}
		this.snakes[i].$el.find(".score").text(s.points);
		this.snakes[i].points = s.points;
		if(!s.alive && this.snakes[i].alive){
			this.snakes[i].$el.find(".name").append(" (dead)");
			this.snakes[i].$el.addClass("dead");
			this.snakes[i].alive = false;
		}
	},
	refreshUser: function(s){
		var $name, $score;
		if($.isEmptyObject(this.user)){
			this.user = {
				alive: true,
				name: "Player",
				points: s.points,
				$el: $("<div>")
			};
			this.user.$el.attr("class","Player");
			$name = $("<span class='name'>");
			$name.text(this.user.name);
			$score = $("<span class='score'>");
			this.user.$el.append($name).append($score);
			this.$el.append(this.user.$el);
		}
		this.user.$el.find(".score").text(s.points);
		this.user.points = s.points;
		if(!s.alive && this.user.alive){
			this.user.$el.find(".name").append(" (dead)");
			this.user.$el.addClass("dead");
			this.user.alive = false;
		}
	},
	sort: function(){
		var arr = [],
			i,len,s;
		if(navigator.userAgent.indexOf("Trident") > 0){
			return false;
		}
		for(i=0,len=this.snakes.length;i<len;i++){
			s = this.snakes[i];
			if(! $.isEmptyObject(s)){
				arr.push({
					p:s.points,
					$el:s.$el
				})
			}
		}
		arr.push({
			p:this.user.points,
			$el:this.user.$el
		});
		arr.sort(function(a,b){
			 if (a.p > b.p)
			  return -1 
			 if (a.p < b.p)
			  return 1
			 return 0
		});
		this.$el.html("");
		this.$el.append(this.title);
		for(i=0,len=arr.length;i<len;i++){
			s = arr[i];
			this.$el.append(s.$el);
		}
	}
}
$.Snake.Controls = function(board){
	this.board = board;
	this.buttons = [];
	this.arrows = [
		{label:"Up",   dir:"u"},
		{label:"Left", dir:"l"},
		{label:"Right",dir:"r"},
		{label:"Down", dir:"d"}
	];
	this.$el = $("<div class='controlPanel'>");
	this.createButtons();
}
$.Snake.Controls.prototype = {
	reattach: function(){
		this.board.$grid.prepend(this.$el);
	},
	createButtons: function(){
		var i = 0,
			len = this.arrows.length,
			self = this,
			a,tmp;
		this.$el.empty();
		for(; i < len; i++){
			a = this.arrows[i]
			tmp = $("<a>");
			tmp.attr("id","jSnakeBtn_" + a.dir).text(a.label).data("action",a.dir);
			tmp.on("click",function(){self.buttonClick(this)});
			this.$el.append(tmp);
		}
	},
	buttonClick: function(el){
		console.log(this.board)
		var target = this.board.defSnake || false,
			dir = $(el).data("action") || false;
		if(target && dir){
			target.changeDir(dir);
		}
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
