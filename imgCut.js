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
	this.dragKind = "";// startDrag 最开始截图，cutDrag 拖拽 cut, resize 改变cut大小 
	var position = $img.offset();
	this.imgBounds = [position.left, position.top, $img.width(), $img.height()];
	this.opacityVal = config.opacityVal || opacityVal;
	this.startDrag = false;
	this.dragPosition = [0,0];

	this.bounds = config.bounds || [0,0,0,0]; //[x1, y1, x2, y2] 左上，右下 坐标
	this.haveCut = false;
	this.cutOnFocus = false;
	this.$cutImg = $cutImg = $("<img src='"+ $img.attr("src") +"' class='cutImg'>"); 
	this.$cut = $cut = createCut($cutImg, this);
	this.cutDrag = false;
	this.cutMousePosition = [0,0,0,0,0,0];//拖拽框时的起始鼠标坐标点 x,y 以及起始框所在位置左上角的x,y.以及 width，height

	this.$dragDiv;
	this.resize = false;
	this.resizePosition = [0,0,0,0,0,0];//拖拽框时的起始鼠标坐标点 x,y. 以及起始框所在位置基点x,y 和其对立点的x,y
	this.resizeKind = undefined;

	this.$wrap = $("<div class='imgCutWrapDiv'></div>").append($cut);
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
	this.checkBounds(bounds)
	this.bounds = bounds;
	height = bounds[3] - bounds[1];
	width = bounds[2] - bounds[0];
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
	if(bounds[0] < 0){
		bounds[0] = 0;
	}
	if(bounds[1] < 0){
		bounds[1] = 0;
	}
	if(bounds[2] > this.imgBounds[2]){
		bounds[2] = this.imgBounds[2];
	}
	if(bounds[3] > this.imgBounds[3]){
		bounds[3] = this.imgBounds[3];
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
	img.dragKind = "";
	$(window).off("mousemove", windowMouseMove);
}

function windowMouseDown(event) {
	var img = event.data;
	img.cutOnFocus = false;
}

function windowMouseMove (event) {
	var img = event.data;
	event.preventDefault();
	if(!img.dragKind){
		return;
	}
	if(img.dragKind == "startDrag"){
		startInitCut(event,img);
		//requestAnimationFrame(startInitCut);
	}
	if(img.dragKind == "cutDrag"){
		startDragCut(event,img);
		//requestAnimationFrame(startDragCut);
	}
	if(img.dragKind == "resize"){
		startResizeCut(event,img);
		//requestAnimationFrame(startResizeCut);
	}
}

function windowKeyDown (event) {
	var img = event.data;
	if (!img.cutOnFocus) {
		return;
	};
	keyCutMove(event,img);
}

function wrapBindEvent($wrap, obj) {
	$wrap.on("mousedown",obj,wrapMouseDown);
}

function cutBindEvent($cut, obj) {
	$cut.on("mousedown",obj,cutMouseDown);
}

function wrapMouseDown(event) {
	var img = event.data;
	img.dragPosition = [event.offsetX, event.offsetY];
	startDrag(img,[event.offsetX, event.offsetY, event.offsetX, event.offsetY]);
	$(window).on("mousemove", img, windowMouseMove);
	event.stopPropagation();
}

function cutMouseDown(event) {
	event.preventDefault();
	var img = event.data;
	img.dragKind = "cutDrag";
	img.cutOnFocus = true;
	var bounds = img.getBounds();
	img.cutMousePosition = [event.clientX, event.clientY, bounds[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1]];
	$(window).on("mousemove", img, windowMouseMove);
	event.stopPropagation();
}

function dragMouseDown (event) {
	var img = event.data;
	img.dragKind = "resize";
	img.resizeKind = $(event.target || event.srcElement).attr("data-kind");
	if(!img.resizeKind){
		return;
	}
	img.resizePosition = [event.clientX, event.clientY];
	var bounds = img.getBounds();
	switch(img.resizeKind){
		case "l" :{//以右下为基点
			img.resizePosition = img.resizePosition.concat([bounds[2], bounds[3],bounds[0],bounds[1]]);
			break;
		} ;
		case "lt":{//以右下为基点
			img.resizePosition = img.resizePosition.concat([bounds[2], bounds[3], bounds[0], bounds[1]]);
			break;
		} ;
		case "t" : {//以右下为基点
			img.resizePosition = img.resizePosition.concat([bounds[2], bounds[3], bounds[0], bounds[1]]);
			break;
		};
		case "r" :{//以左上为基点
			img.resizePosition = img.resizePosition.concat([bounds[0], bounds[1], bounds[2], bounds[3]]);
			break;
		};
		case "b" :{//以左上为基点
			img.resizePosition = img.resizePosition.concat([bounds[0], bounds[1], bounds[2], bounds[3]]);
			break;
		};
		case "rb": {//以左上为基点
			img.resizePosition = img.resizePosition.concat([bounds[0], bounds[1], bounds[2], bounds[3]]);
			break;
		};
		case "lb" : {//以右上为基点
			img.resizePosition = img.resizePosition.concat([bounds[2], bounds[1], bounds[0], bounds[3]]);
			break;
		};
		case "rt" : {//以左下为基点
			img.resizePosition = img.resizePosition.concat([bounds[0], bounds[3], bounds[2], bounds[1]]);
			break;
		};
	}
	$(window).on("mousemove", img, windowMouseMove);
	event.stopPropagation();
}

function startInitCut(event, img){
	var bounds = [img.dragPosition[0],img.dragPosition[1],event.clientX - img.imgBounds[0], event.clientY - img.imgBounds[1]];
	img.setBounds(bounds);
}

function startDragCut(event, img){
	var setX = event.clientX - img.cutMousePosition[0];
	var setY = event.clientY - img.cutMousePosition[1];
	var width = img.cutMousePosition[4];
	var height = img.cutMousePosition[5];
	var pointlt = [img.cutMousePosition[2]+setX, img.cutMousePosition[3]+setY];
	var pointrb = [pointlt[0] + width, pointlt[1] + height];
	if(pointlt[0] < 0){
		pointlt[0] = 0;
		pointrb[0] = pointlt[0] + width;
	}
	if(pointlt[1] < 0){
		pointlt[1] = 0;
		pointrb[1] = pointlt[1] + height;
	}
	if(pointrb[0] > img.imgBounds[2]){
		pointrb[0] = img.imgBounds[2];
		pointlt[0] = pointrb[0] - width;
	}
	if(pointrb[1] > img.imgBounds[3]){
		pointrb[1] = img.imgBounds[3];
		pointlt[1] = pointrb[1] - height;
	}
	var bounds = pointlt.concat(pointrb);
	img.setBounds(bounds);
}

function startResizeCut(event, img){
	var setX = event.clientX - img.resizePosition[0];
	var setY = event.clientY - img.resizePosition[1];
	switch(img.resizeKind){
		case "l" :;
		case "r" :{ // 只发生横向X变化
			setY = 0;
			break;
		};
		case "t" :;
		case "b" :{ // 只发生纵向Y变化
			setX = 0;
			break;
		};
	}
	var bounds = [img.resizePosition[2], img.resizePosition[3], img.resizePosition[4] + setX, img.resizePosition[5] + setY];
	img.setBounds(bounds);
}

function keyCutMove (event,img) {
	var keyCode = event.keyCode;
	var bounds = img.getBounds();

	if(keyCode == KEYLEFT && bounds[0] > 0){
		bounds = [bounds[0]-1, bounds[1], bounds[2]-1, bounds[3]];
	}else if(keyCode == KEYRIGHT && bounds[2] < img.imgBounds[2]){
		bounds = [bounds[0]+1, bounds[1], bounds[2]+1, bounds[3]];
	}else if(keyCode == KEYTOP && bounds[1] > 0){
		bounds = [bounds[0], bounds[1]-1, bounds[2], bounds[3]-1];
	}else if(keyCode == KEYDOWN && bounds[3] < img.imgBounds[3]){
		bounds = [bounds[0], bounds[1]+1, bounds[2], bounds[3]+1];
	}
	img.setBounds(bounds);
}

function  startDrag(img,bounds) {
	img.haveCut = false;
	img.$dragDiv.hide();
	img.deleteCut();
	img.setOpacity(opacityVal);

	img.initCut(bounds);

	img.dragKind = "startDrag";
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
	img.dragKind = "";
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