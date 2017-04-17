(function(owner) {
var taskArr = new Array(); //图片下载任务集合
var isStartTask = false; //是否开启下载任务
owner.loadIcon = function(marker, image_url, big) {
	var hb_path;
	if (big) {
		hb_path = '_downloads/screen/big' + hex_md5(image_url) + '.png'; //HBuilder平台路径
	} else {
		hb_path = '_downloads/screen/' + hex_md5(image_url) + '.png';
	}
	var sd_path = plus.io.convertLocalFileSystemURL(hb_path); //SD卡绝对路径
	//temp用于判断图片文件是否存在
	var temp = new Image();
	temp.src = sd_path;
	temp.onload = function() {
		// 1存在, 则直接显示
		marker.setIcon(hb_path);
	};
	temp.onerror = function() {
		// 2不存在, 则下载图片
		//使用src加载，然后再保存到本地
		var obj = {
			marker: marker,
			image_url: image_url,
			hb_path: hb_path,
			big: big
		}
		taskArr.push(obj);
		//启动下载
		if (!isStartTask) {
			isStartTask = true;
			owner.startTask();
		}
	};
};
/**
 * 图片任务下载 
 * 递归调用方式保持始终只有一张网络图片在进行加载保存操作,避免批量创建Bitmap对象导致内存过大
 */
owner.startTask = function() {
	if (taskArr.length == 0) {
		isStartTask = false;
		return;
	}
	//从任务集合中取一个任务
	var obj = taskArr.shift();
	var temp = new Image();
	temp.src = obj.image_url;
	temp.onload = function() {
		owner.draw(obj.marker, temp, obj.hb_path, obj.big);
	};
	temp.onerror = function() {
		console.log('加载网络图片失败==');
		owner.startTask();
	};
};
/*将Image对象绘制到canvas上，以便保持成本地图片文件*/
owner.draw = function(marker, obj, hb_path, big) {
	var size = 90;
	var borderColor = "#0FC8FF";
	if(big) { // 判断当前要绘制的是大图片还是小图片从而赋予相应的尺寸
		size = 110;
	}
	var canvas = document.createElement('canvas');
	var context = canvas.getContext("2d");
	canvas.width = size;
	canvas.height = size;
	// 绘制底层的圆作为图片的边框
	context.beginPath();
	context.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
	context.fillStyle = borderColor;
	context.closePath();
	context.fill();
	// 绘制一个圆，用于显示图片
	context.beginPath();
	context.arc(size/2, size/2, size/2-5, 0, 2 * Math.PI);
	// 用离屏Canvas，设置好宽高后绘制图片进去，然后作为.createPattern()的渲染对象
	var into = document.createElement("canvas");
	var ctx2 = into.getContext('2d');
	into.width = size;
	into.height = size;
	ctx2.drawImage(obj, 0, 0, size, size);
	// 创建图片纹理
	var pattern = context.createPattern(into, 'no-repeat');
	// 使用图片纹理填充绘制的圆
	context.fillStyle = pattern;
	context.closePath();
	context.fill();
	// 将canvas保存成本地图片文件
	var data = canvas.toDataURL('image/png');
	owner.saveFile(marker, data, hb_path);
};

owner.saveFile = function(marker, data, path) {
	var bitmap = new plus.nativeObj.Bitmap();
	bitmap.loadBase64Data(data, function() {
		bitmap.save(path, {}, function(i) {
			marker.setIcon(path);
			bitmap.clear();
			owner.startTask();
		}, function(e) {
			console.log("保存图片到本地失败");
			bitmap.clear();
			owner.startTask();
		});
	}, function() {
		console.log("保存图片失败");
		bitmap.clear();
		owner.startTask();
	});
};
}(window.snail = {}));