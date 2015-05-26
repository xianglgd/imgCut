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

	this.aspectRatio = config.aspectRatio || 0;  // width : height

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
	this.cutMousePosition = [0,0,0,0,0,0];//拖拽框时的起始鼠标坐标点 x,y 以及起始框所在位置左上角的x,y.和其对立点的x,y

	this.$dragDiv;
	this.resize = false;
	this.resizePosition = [0,0,0,0,0,0,0,0];//拖拽框时的起始鼠标坐标点 x,y. 以及起始框所在位置基点x1,y1 和其对立点的x2,y2.以及 width(x2-x1)，height(y2-y1)
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
ImgCut.prototype.setRatio = function (val) {
	if(!val){
		return false;
	}
	this.aspectRatio = val;
	if(!this.haveCut){
		return true;
	}
	var bounds = this.getBounds();
	bounds = calculateRatio(this, bounds);
	this.setBounds(bounds);
	return true;
}
ImgCut.prototype.setBounds = function(bounds) {//传入的为两个对角点，左上，右下，或者 右上，左下
	if(!this.haveCut){
		bounds = resetBounds(bounds);
		this.dragPosition = [bounds[0], bounds[1]];
		startDrag(this,bounds);
		stopDrag(this);
		return;
	}
	this.haveCut = true;
	bounds = resetBounds(bounds);	
	if(this.aspectRatio!==0){
		bounds = calculateRatio(this, bounds);
	}
	bounds = this.checkBounds(bounds);
	if(!bounds){
		return;
	}
	this.bounds = bounds;
	for(var i in bounds){
		bounds[i] = Math.round(bounds[i]);
	}
	var height = bounds[3] - bounds[1];
	var width = bounds[2] - bounds[0];
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
	return true;
};
ImgCut.prototype.getBounds = function() {
	if(this.haveCut){
		return this.bounds;
	}
	return false;
};
ImgCut.prototype.checkBounds = function(bounds) {
	var beforeBounds = [bounds[0], bounds[1], bounds[2], bounds[3]];
	var position = "";//lt or rb
	if(bounds[0] < 0){
		if(this.aspectRatio!==0){
			return false;
		}
		bounds[0] = 0;//重置左上角坐标后，右下角坐标需要重置
		position = "rb";
	}
	if(bounds[1] < 0){
		if(this.aspectRatio!==0){
			return false;
		}
		bounds[1] = 0;
		position = "rb";
	}
	if(bounds[2] > this.imgBounds[2]){
		if(this.aspectRatio!==0){
			return false;
		}
		bounds[2] = this.imgBounds[2];//重置右下角坐标后，左上角坐标需要重置
		position = "lt";
	}
	if(bounds[3] > this.imgBounds[3]){
		if(this.aspectRatio!==0){
			return false;
		}
		bounds[3] = this.imgBounds[3];
		position = "lt";
	}
	return bounds;
	// if(this.aspectRatio !== 0){
	// 	var setW = Math.abs( bounds[2] - bounds[0] - (beforeBounds[2] - beforeBounds[0]) );
	// 	var setH = Math.abs( bounds[3] - bounds[1] - (beforeBounds[3] - beforeBounds[1]) );
	// 	var resetH = this.aspectRatio * setH;
	// 	if(setW > resetH){
	// 		setW = resetH;
	// 	}else{
	// 		setH = setW/this.aspectRatio;
	// 	}
	// 	if(position == "lt"){
	// 		bounds[0] = bounds[0] - setW;
	// 		bounds[1] = bounds[1] - setH;
	// 	}else if(position == "rb"){
	// 		bounds[2] = bounds[2] + setW;
	// 		bounds[3] = bounds[3] + setH;
	// 	}
	// }
	return bounds;
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
	var width = img.resizePosition[4] - img.resizePosition[2];
	var height = img.resizePosition[5] - img.resizePosition[3];
	img.resizePosition = img.resizePosition.concat([width,height]);
	$(window).on("mousemove", img, windowMouseMove);
	event.stopPropagation();
}

function startInitCut(event, img){
	var setX = event.clientX - img.imgBounds[0] - img.dragPosition[0];
	var setY = event.clientY - img.imgBounds[1] - img.dragPosition[1];
	
	var obj = getSetXY(setX,setY,img.aspectRatio);
	setX = obj.setX;
	setY = obj.setY;

	var bounds = [img.dragPosition[0],img.dragPosition[1], img.dragPosition[0] + setX, img.dragPosition[1] + setY];
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
			if(img.aspectRatio!==0){
				setY = setX / img.aspectRatio;
			}
			var bounds = [img.resizePosition[2], img.resizePosition[3], img.resizePosition[4] + setX, img.resizePosition[5] + setY];
			break;
		};
		case "t" :;
		case "b" :{ // 只发生纵向Y变化		
			setX = 0;
			if(img.aspectRatio!==0){
				setX = setY * img.aspectRatio;
			}
			var bounds = [img.resizePosition[2], img.resizePosition[3], img.resizePosition[4] + setX, img.resizePosition[5] + setY];
			break;
		};
		default :{
			setX = img.resizePosition[6] + setX;
			setY = img.resizePosition[7] + setY;
				
			var obj = getSetXY(setX, setY, img.aspectRatio);
			setX = obj.setX;
			setY = obj.setY;
			var bounds = [img.resizePosition[2], img.resizePosition[3], img.resizePosition[2] + setX, img.resizePosition[3] + setY];
		}
	}

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

function  resetBounds(bounds) { //把任意两个对角点的坐标 转换为 左上，右下
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
	return bounds;
}

function calculateRatio(img, bounds) {
	var width = bounds[2] - bounds[0];
	var height = bounds[3] - bounds[1];
	var resetH = height * img.aspectRatio;
	if(width > resetH){
		height = width / img.aspectRatio;
	}else{
		width = resetH;
	}
	bounds = [bounds[0], bounds[1], bounds[0] + width, bounds[1] + height];
	return bounds;
}
function getSetXY (setX,setY,aspectRatio) {
	var absX = Math.abs(setX);
	var absY = Math.abs(setY);
	if(aspectRatio !== 0){
		var restX = absY * aspectRatio;
		if(restX >= absX){
			setX = getNumSymbol(setX) * restX;
		}else{
			setY = getNumSymbol(setY) * absX / aspectRatio;
		}
	}
	return {
		setX: setX,
		setY: setY
	}
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

function getNumSymbol(num) {
	if(num > 0){
		return 1;
	}
	return -1;
}

window.imgCut = imgCut;

})(window,jQuery,undefined)