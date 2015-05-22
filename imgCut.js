(function(window,$,undefined){

var opacityVal = 0.6;
var stopDragOpacity = 0;
var KEYRIGHT = 39;
var KEYTOP = 38;
var KEYDOWN = 40;
var KEYLEFT = 37;

function imgCut (imgDom, config) {
	return new ImgCut(imgDom,config);
}

function ImgCut(imgDom, config) {
	config = config || {};

	this.$img = $img = $(imgDom);
	var position = $img.offset();
	this.imgBounds = [position.left, position.top, $img.width(), $img.height()];
	this.opacityVal = config.opacityVal || opacityVal;
	this.startDrag = false;
	this.dragPosition = [0,0];

	this.bounds = config.bounds || [0,0,0,0]; //[x1, y1, x2, y2]
	this.haveCut = false;
	this.cutOnFocus = false;
	this.$cutImg = $cutImg = $("<img src='"+ $img.attr("src") +"' class='cutImg'>"); 
	this.$cut = $cut = createCut($cutImg, this);
	this.cutDrag = false;
	this.cutMousePosition = [0,0];

	this.$dragDiv;
	this.resize = false;
	this.resizePosition = [0,0];
	this.resizeKind = undefined;

	this.$wrap = $("<div class='wrapDiv'></div>").append($cut);
	this.$wrap.css({
		"left": this.imgBounds[0],
		"top": this.imgBounds[1],
		"width": this.imgBounds[2],
		"height": this.imgBounds[3]
	});
	
	$("body").append(this.$wrap);

	
	bindEvent(this);
};

ImgCut.prototype.setOpacity = function(val) {
	this.opacityVal = val;
	this.$wrap.css("opacity",val)
};
ImgCut.prototype.deleteCut = function(val) {
	this.$cut.css("display","none");
	this.haveCut = false;
	this.cutOnFocus = false;
};
ImgCut.prototype.initCut = function(bounds) {
	this.haveCut = true;
	this.setBounds(bounds);
	this.cutOnFocus = true;
	this.$cut.css("display","block");	
};
ImgCut.prototype.setBounds = function(bounds) {//传入的为两个对角点，左上，右下，或者 右上，左下
	if(!this.haveCut){
		this.dragPosition = [bounds[0], bounds[1]];
		startDrag(this,bounds);
		stopDrag(this);
		return;
	}
	var height = bounds[3] - bounds[1];
	var width = bounds[2] - bounds[0];
	if((width > 0 && height > 0) || (width < 0 && height < 0)){ //如果是左上，右下
		if(width < 0){
			bounds = [bounds[2], bounds[3], bounds[0], bounds[1]];
		}
	}else{
		if(width > 0){
			bounds = [bounds[0], bounds[3], bounds[2], bounds[1]];
		}else{
			bounds = [bounds[2], bounds[1], bounds[0], bounds[3]];
		}
	}
	if(!this.checkBounds(bounds)){
		return false;
	}
	this.bounds = bounds;
	this.$cut.css({
		"left": this.bounds[0] ,
		"top": this.bounds[1] ,
		"width": Math.abs(width),
		"height": Math.abs(height)
	});
	this.$cutImg.css({
		"left": -this.bounds[0] ,
		"top": -this.bounds[1] 
	});
	this.haveCut = true;
	return true;
};
ImgCut.prototype.getBounds = function() {
	if(this.haveCut){
		return this.bounds;
	}
	return false;
};
ImgCut.prototype.checkBounds = function(bounds) {
	if(bounds[0]<0 || bounds[1]<0 || bounds[2] > this.imgBounds[2] || bounds[3] > this.imgBounds[3]){
		return false;
	}
	return true;
};

function bindEvent (img) {
	wrapBindEvent(img.$wrap,img);

	cutBindEvent(img.$cut,img);

	windowBindEvent($(window), img);
}

function windowBindEvent ($window, img) {
	$window.on("mouseup", img, windowMouseUp);
	$window.on("mousedown", img, windowMouseDown);
	$window.on("keydown", img, windowKeyDown);
}

function windowMouseUp (event) {
	var img = event.data;
	stopDrag(img);
	img.resize = false;
	img.cutDrag = false;
}

function windowMouseDown(event) {
	var img = event.data;
	img.cutOnFocus = false;
}

function windowKeyDown (event) {
	var img = event.data;
	if (!img.cutOnFocus) {
		return;
	};
	requestAnimationFrame(function() {
		var keyCode = event.keyCode;
		var bounds = img.getBounds();

		if(keyCode == KEYLEFT){
			bounds = [bounds[0]-1, bounds[1], bounds[2]-1, bounds[3]];
		}else if(keyCode == KEYRIGHT){
			bounds = [bounds[0]+1, bounds[1], bounds[2]+1, bounds[3]];
		}else if(keyCode == KEYTOP){
			bounds = [bounds[0], bounds[1]-1, bounds[2], bounds[3]-1];
		}else if(keyCode == KEYDOWN){
			bounds = [bounds[0], bounds[1]+1, bounds[2], bounds[3]+1];
		}
		img.setBounds(bounds);
	})
}

function wrapBindEvent($wrap, obj) {
	$wrap.on("mousedown",obj,wrapMouseDown);
	$wrap.on("mousemove",obj,wrapMouseMove);
}

function cutBindEvent($cut, obj) {
	$cut.on("mousedown",obj,cutMouseDown);
}

function wrapMouseMove (event) {
	var img = event.data;
	event.preventDefault();
	if(!img.startDrag && !img.cutDrag && !img.resize){
		return;
	}
	if(img.startDrag){
		requestAnimationFrame(function() {
			var bounds = [img.dragPosition[0],img.dragPosition[1],event.clientX - img.imgBounds[0], event.clientY - img.imgBounds[1]];
			img.setBounds(bounds);
		});
	}
	if(img.cutDrag){
		requestAnimationFrame(function() {
			var setX = event.clientX - img.cutMousePosition[0];
			var setY = event.clientY - img.cutMousePosition[1];
			img.cutMousePosition[0] = event.clientX;
			img.cutMousePosition[1] = event.clientY;
			var bounds = [img.bounds[0]+setX, img.bounds[1]+setY, img.bounds[2]+setX, img.bounds[3]+setY];
			img.setBounds(bounds);
		});
	}
	if(img.resize){
		requestAnimationFrame(function() {
			var bounds = img.getBounds();
			var point = [0,0];

			var setX = event.clientX - img.resizePosition[0];
			var setY = event.clientY - img.resizePosition[1];
			img.resizePosition[0] = event.clientX;
			img.resizePosition[1] = event.clientY;

			switch(img.resizeKind){
				case "l" :{
					point = [bounds[2], bounds[3]];//以右下为基点
					bounds = [bounds[0]+setX, bounds[1]].concat(point);
					break;
				} ;
				case "lt":{
					point = [bounds[2], bounds[3]];//以右下为基点
					bounds = [bounds[0]+setX, bounds[1]+setY].concat(point);
					break;
				} ;
				case "t" : {
					point = [bounds[2], bounds[3]];//以右下为基点
					bounds = [bounds[0], bounds[1]+setY].concat(point);
					break;
				};
				case "r" :{
					point = [bounds[0], bounds[1]];//以左上为基点
					bounds = [bounds[2]+setX, bounds[3]].concat(point);
					break;
				};
				case "b" :{
					point = [bounds[0], bounds[1]];//以左上为基点
					bounds = [bounds[2], bounds[3]+setY].concat(point);
					break;
				};
				case "rb": {
					point = [bounds[0], bounds[1]];//以左上为基点
					bounds = [bounds[2]+setX, bounds[3]+setY].concat(point);
					break;
				};
				case "lb" : {
					point = [bounds[2], bounds[1]];//以右上为基点
					bounds = [bounds[0]+setX, bounds[3]+setY].concat(point);
					break;
				};
				case "rt" : {
					point = [bounds[0], bounds[3]];//以左下为基点
					bounds = [bounds[2]+setX, bounds[1]+setY].concat(point);
					break;
				};
			}
			img.setBounds(bounds);
		});
	}
}

function wrapMouseDown(event) {
	var img = event.data;
	img.dragPosition = [event.offsetX, event.offsetY];
	startDrag(img,[event.offsetX, event.offsetY, event.offsetX, event.offsetY]);
	event.stopPropagation();
}

function cutMouseDown(event) {
	event.preventDefault();
	var img = event.data;
	img.cutDrag = true;
	img.cutOnFocus = true;
	img.cutMousePosition = [event.clientX, event.clientY];
	
	event.stopPropagation();
}

function dragMouseDown (event) {
	var img = event.data;
	img.resizeKind = $(event.target || event.srcElement).attr("data-kind");
	if(!img.resizeKind){
		return;
	}
	img.resize = true;
	img.resizePosition = [event.clientX, event.clientY];
	event.stopPropagation();
}

function  startDrag(img,bounds) {
	img.haveCut = false;
	img.$dragDiv.hide();
	img.deleteCut();
	img.setOpacity(opacityVal);

	img.initCut(bounds);

	img.startDrag = true;
}
function stopDrag (img) {
	if(img.data){
		img = img.data;
	}
	var $cut = img.$cut;

	if($cut.height() == 0 && $cut.width() == 0){
		img.haveCut = false;
		img.deleteCut();
		img.setOpacity(stopDragOpacity);
	}
	img.$dragDiv.show();
	img.startDrag = false;
}

function createCut ($cutImg, img) {
	var $cut =  $("\
		<div class='cutDiv'>\
			<div class='dragDiv'>\
				<div class='resize-dragbar resize-t' data-kind='t'></div>\
				<div class='resize-dragbar resize-b' data-kind='b'></div>\
				<div class='resize-dragbar resize-l' data-kind='l'></div>\
				<div class='resize-dragbar resize-r' data-kind='r'></div>\
				<div class='resize-handle resize-lt' data-kind='lt'></div>\
				<div class='resize-handle resize-lb' data-kind='lb'></div>\
				<div class='resize-handle resize-rt' data-kind='rt'></div>\
				<div class='resize-handle resize-rb' data-kind='rb'></div>\
			</div>\
			<div class='imgWrap'>\
			</div>\
		</div>");

	$(".imgWrap",$cut).append($cutImg);
	img.$dragDiv = $(".dragDiv",$cut).on("mousedown", img, dragMouseDown);

	return $cut;
}

window.imgCut = imgCut;

})(window,jQuery,undefined)