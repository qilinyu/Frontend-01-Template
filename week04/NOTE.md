# 结构化程序设计和执行过程
## Objective-c
事件循环：node或浏览器里的内容，不是javascript语言的一部分 

在oc中，可以引用一下类型：函数、代码片段、module模块
在oc的jsContext中，有两种方式引用js:
1. evaluateScript
```
(JSValue *)evaluateScript:(NSString *)script;
```
2. evaluateScript:withSourceURL 
```
(JSValue *)evaluateScript:(NSString *)script
            withSourceURL:(NSString *)sourceURL;
```
3. function
```
//var context = new JSContext;
JSContext* context = [[JSContext alloc] init];
JSValue* result;

NSString* code = @"(function(x){ return x * x})";

result = [context evaluateScript:code];

//调用函数
//[result callWithArguments:@[]] 先传一个空参数
NSLog(@"%@", [[result callWithArguments:@[]]]);

//传参
JSValue* arg1 = [JSValue valueWithInt32:4 inContext:context]; 
NSLog(@"%@", [[result callWithArguments:@[arg1]]]);

```
## 宏任务、微任务
oc中有Promise
```
new Promise(resolve => resolve()).then(()=>this.a = 3),
sfunction(){return this.a}
```
```
//var context = new JSContext;
JSContext* context = [[JSContext alloc] init];
JSValue* result;

NSString* code = @"new Promise(resolve => resolve()).then(()=>this.a = 3),
function(){return this.a}";

//匿名函数只被定义，未被执行，result拿到了后面的匿名函数，并调用了匿名函数，就产生了第二个宏任务
//result拿到了后面的匿名函数:为啥拿到匿名函数？原因：有‘，’
//逗号的作用
//var x = (1,2,3)
//console.log(x)打印3
//同理：result拿到了匿名函数
result = [context evaluateScript:code];

//调用函数
//[result callWithArguments:@[]] 先传一个空参数 result()
NSLog(@"%@", [[result callWithArguments:@[]]] toSrting);
//callWithArguments，意思是把第一个宏任务的返回值，也就是函数，执行了一次
```
在这一段代码中，有两个宏任务，如下：
1. [context evaluateScript:code]在这一段代码里面，有两个小的任务：第一个是promie和一个匿名函数，第二个是匿名函数中this.a = 3  
因为有一个resolve被执行了，就产生了第二个微任务this.a = 3

2. [result callWithArguments:@[]]调用这个函数执行了一个人物，返回this.a
function(){return this.a}匿名函数只被定义，未被执行，result拿到了后面的匿名函数，并调用了匿名函数，就产生了第二个宏任务  
result拿到了后面的匿名函数:为啥拿到匿名函数？原因：有‘，’  
逗号的作用  
var x = (1,2,3)
console.log(x)打印3
同理：result拿到了匿名函数

1. 宏任务和微任务
其实所有的JS代码都是一个微任务，只是哪些微任务构成了一个宏任务；执行在JS引擎里的就是微任务，执行在JS引擎之外的就是宏任务，循环宏任务的工作就是事件循环。
并不是说有then才会存在微任务，有then可能产生一个宏任务中有多个微任务的情况，但是一切js中的代码都是在微任务中执行的。
    * 举例：
    拿浏览器举例：setTimeout、setInterval、.onclick 这种其实不是 JS 语法本身的 API，是 JS 的宿主浏览器提供的 API, 所以是宏任务。浏览器的事件也是宏任务，比如click，keyup之类的UI交互，
    一个Script标签内的就算是一个宏任务
    而 Promise 是 JS 本身自带的 API，这种就是微任务。
总结：宿主提供的方法是宏任务，JS 自带的是微任务

2. 这样设计有什么好处吗  
这是以一个被迫的，promise是js标准的一部分，不提供微任务，就不能解释promise,宏任务不在js标准内，而微任务在js标准内。

3. oc中的宏任务执行等待
正常的promise是没有办法把微任务延迟执行的。在一个promise中有多少个resolve，就有多少个额外的微任务
按理 promise 产生一个微任务，而 funciton 是按顺序执行，应该会比promise 结果早一点。是因为OC 里面每调用一步都会把微任务执行完，oc不是一个同步的代码，是可以等的，
任务列表列里面有很多宏任务，然后每个宏任务里面有一个微任务列表，每个宏任务执行第二个宏任务之前会把自己内部的微任务执行完

4. js引擎和宏任务 
js引擎类的目的就是把一段js执行掉，js引擎似于一个库，而一个宏任务队列类似于把一个库包成了一个服务，一个服务就会一直在那里等着，筛给它一段代码它就执行一下，

5. oc中在执行宏任务的时候， setTimeout的定时任务到时间了是怎么被执行的？
在遇到settTimeout之前有sleep。宏任务有数组去存，会把宏任务放到数组里，在执行evaluateScript之前会sleep一下，等下一个任务的时间
如下伪代码：
```
var taskQueue = [{time:1000,code:@"",function:f}]
var task = taskQueue.shift();
//[context evaluateScript: task.code]
//或者[task.f callWithArguments:@[]]
```
setTimeout不会是有一个线程去计时，单开线程，管理很麻烦，还要图同步计时结果，很麻烦  
setTimeout不准时执行的
oc的sleep是真的这个线程就闲下来了，和while(true)等待输入是不一样的，while(true)不是一个真正的死循环，换到jsvascript中可以说是一个await sleep

6. 宏任务中的同步代码以及宏任务的优先级、微任务的执行顺序
一个宏任务里的同步代码也可以理解为微任务  只不过比宏任务里异步代码微任务先入队
微任务是没有优先级的，宏任务是有优先级的。一个宏任务里至少先入队一个微任务，就是这个宏任务里的同步代码，同步代码会归为一个微任务 只有 .then 才能产生新的微任务   
一个宏任务里面的同步的代码最先执行，微任务根据入队时间进行执行。

7. 宏任务中的异步代码
await、then之前都是同步代码
await后面的代码，就相当于多了一个then，await产生的then在分号后面。
只有 new Promise(resolve => resolve()).then(() => { ... ... })能产生方式微任务队列的方法，generator产生的是同步代码。也就是说，在没有Promise的时代，就没有微任务一说。
一个promise 里面的then10秒后执行 还一个promise 的then 3秒后执行 他们是同一级别的promise 他们有可能不再一个宏任务的微任务队列里面，重点在于10秒怎么执行。
微任务里写个10万次循环，后面的宏任务都点等待   

8. 逗号运算符是依次执行所有语句

9. 如果遇到throw Error的话，后面的宏任务微任务还执行吗?
还执行，只打断一个微任务，不会把后面的都干掉，还可以catch呢
```
new Promise(resolve => resolve()).then(()=>{
    console.log("1");
})

setTimeout(function(){
    console.log("2");
},0)
console.log("3")

//执行结果：3，1，2
```

```
new Promise (resolve =>resolve()).then(()=> this.a = 3)

setTimeout(function(){
    console.log(this.a)
},0)

//打印3
```

```

new Promise (resolve =>resolve()).then(()=> console.log("1"))

setTimeout(function(){
    console.log("2")

    new Promise(resolve=>resolve()).then(()=> console.log("3"))
},0)
console.log("4")
//4，1，2，3
```

```
new Promise (resolve =>(console.log("0"),resolve())).then(()=> console.log("1"))

setTimeout(function(){
    console.log("2")

    new Promise(resolve=>resolve()).then(()=> console.log("3"))
},0)
console.log("4")
console.log("5")
//打印出0，4，5，1，2，3
```
有两个宏任务，setTimeout和其他代码
*. 宏任务
同步代码有0，4，5；
1是第一个微任务的异步代码 ，
*. 宏任务
2是第二个宏任务里的第一个微任务 异步，
3是第二个宏任务里的第二个位任务 异步

```
async function afoo(){
    console.log("-1");
}

new Promise (resolve =>(console.log("0"),resolve())).then(()=> console.log("1"))

setTimeout(function(){
    console.log("2")

    new Promise(resolve=>resolve()).then(()=> console.log("3"))
},0)
console.log("4")
console.log("5")
afoo()
//打印出0，4，5，-1,1，2，3
```
如果async中没有await,async函数就相当于同步代码，在await之前都是同步代码
1. 宏任务
0，4，5，-1
1
2. 宏任务
2
3

```
async function afoo(){
    console.log("-2");

    await new Promise(resolve => resolve());
    console.log("-1")
}

new Promise (resolve =>(console.log("0"),resolve())).then(()=> console.log("1"))

setTimeout(function(){
    console.log("2")

    new Promise(resolve=>resolve()).then(()=> console.log("3"))
},0)
console.log("4")
console.log("5")
afoo()
//0，4，5，-2，1，-1，2，3
```
-1变成了第三个微任务
1. 宏任务
0，4，5，-2， 
1
-1
2. 宏任务
2
3

```
async function afoo(){
    console.log("-2")


    await new Promise(resolve => resolve());
    console.log("-1")
}


new Promise(resolve => (console.log("0"), resolve()))
    .then(()=>(
        console.log("1"), 
        new Promise(resolve => resolve())
            .then(() => console.log("1.5")) ));


setTimeout(function(){
    console.log("2");
    
    new Promise(resolve => resolve()) .then(console.log("3"))


}, 0)
console.log("4");
console.log("5");
afoo()
这一段代码有两种执行结果：
//在苹果chorme和node上的结果：0, 4, 5, -2, 1, 1.5, -1, 2, 3
//在window电脑chorme和node上执行结果: 0, 4, 5, -2, 1, -1 1.5, 2, 3
//有可能是实践的问题 safari 里面await后面的代码可能会被套两个then
//https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
//新版的node是和chorme一样的结果
```
分析：
1. 宏任务
0，4，5，-2，  //同步代码
    入队1、-1
1  //
    入队1.5
-1
1.5
2. 宏任务
2
3
一个红任务中，只存在一个微任务队列，根据入队时间决定个微任务执行顺序吗，当前宏任务内微任务执行完之后才会执行下个宏任务，
```
setTimeout(function(){console.log("cool")},2000),(1+2)
//执行结果：
> setTimeout(function(){console.log("cool")},2000),(1+2)
< 3 //向左的键条表示第一份宏任务执行完成
[Log] cool
```

```
async function afoo(){
    console.log("-2")


    await new Promise(resolve => resolve());
    console.log("-1")

    await new Promise(resolve => resolve());
    console.log("-0.5")
}


new Promise(resolve => (console.log("0"), resolve()))
    .then(()=>(
        console.log("1"), 
        new Promise(resolve => resolve())
            .then(() => console.log("1.5")) ));


setTimeout(function(){
    console.log("2");
    
    new Promise(resolve => resolve()) .then(console.log("3"))


}, 0)
console.log("4");
console.log("5");
afoo()
```


```

new Promise(res=>res()).
    then(
        ()=>
        setTimeout(()=>console.log(1),10000),
        console.log(0));
console.log(2);
//0,2,1  相当于在then里加了两个参数
```

```
function sleep(duration) {
    return new Promise(function (resolve, reject) {
        console.log("b");
        setTimeout(function () {
            resolve();
            var begin = Date.now();
            while (Date.now() - begin < 1000);
            console.log("d");
        }, duration);
    })
}
console.log("a");
sleep(0).then(() => console.log("c")); 
//abdc
第一个宏任务里有a,b
第二个宏任务里有 dc c是resolve传进来的

```

```
async function async1() {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
}
async function async2() {
    console.log('async2');
}
async1();
new Promise(function (resolve) {
    console.log('promise1');
    resolve();
}).then(function () {
    console.log('promise2');
});
// async1 start
// async2
// promise1
// async1 end
// promise2
```
分析：
首先执行async1,里面的同步代码有：async1 start  
再执行async2，里面没有await，都是同步代码， 输出：async2  
再执行Promise resolve之前都是同步代码：输出：promise1  
同步代码都是第一个微任务  
第二个微任务：await async2()之后的代码：输出：async1 end  
第三个微任务：promise resolve：输出：promise2  

 
