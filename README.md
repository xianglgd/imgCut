
setBounds([x1,y1,x2,y2]);
//传入任意的两个点，必须是对角点，

setOpacity(0-1);
//设置透明度，

resetPosition();
//重新定位遮罩

setRatio(float);
//设置宽高比

getBounds();
//得到 左上，右下的坐标

setImg(src);
//设置新的图片

destroy();
//销毁函数，同时销毁对象，由于不能直接将this知悉null，所以删除所有this属性。

checkBounds(bounds)
//传入一个 bounds ，得到符合规则的 bounds ,[x1,y1,x2,y2] 必须为 左上，右下。


aspectRatio： 0 ， 宽高比，为0表示随意 取值为 0以上

opacityVal： 0.6，拖拽时的透明度

stopDragOpacity： 停止拖拽时的透明度

use3d: true; 是否开启3D变换，默认为true 。在不支持3D的浏览器上依然采用原始的css变换

beforeChange：null ，自定义方法，改变bounds之前执行，参数为 nowbounds ,changebounds。 如果返回 true 则该次变化取消.

afterChange：null , 自定义方法，改变bounds后执行，参数为 nowBounds .

afterLoad：null , 自定义方法，加载完图片后执行，参数为 imgbounds ， 图片左上角距离页面的 top，left。以及图片的宽度，高度


# imgCut
cut part of the picture, very small.Dependence jquery.
先把主要功能做出，后面会继续添加新功能，欢迎关注。
目前只是把主要功能，做了出来，代码方面还需要很多完善的地方，希望大家多多指正。
目前应该是要告一段落了，过段时间，我会把代码重构一下。

调用该方法时，请确保 图片已经加载，并在网页中显示。
