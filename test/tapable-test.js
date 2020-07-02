const {
    SyncHook,
    SyncBailHook,
    SyncWaterfallHook,
    SyncLoopHook,
    AsyncParallelHook,
    AsyncParallelBailHook,
    AsyncSeriesHook,
    AsyncSeriesBailHook,
    AsyncSeriesWaterfallHook 
 } = require("tapable");

 class TapableTest {
     constructor(){
        //  定义生命周期
        this.hooks={
            // 如需在call是传参，需要在new SyncHook时定义需要的参数
            beforeOne: new SyncHook(['arg']),
            afterOne: new SyncHook(),
            afterTwo: new SyncHook(),
            afterThree: new SyncHook(),
            afterFour: new SyncHook(),
            afterFive: new SyncHook(),
        }
     }
     Test(){
         this.hooks.beforeOne.call('小明')
         console.log('one')
         this.hooks.afterOne.call()
         console.log('two')
         this.hooks.afterTwo.call() 
         console.log('three')
         this.hooks.afterThree.call()
         console.log('four')
         this.hooks.afterFour.call()
         console.log('five')
         this.hooks.afterFive.call()
     }
 }
 let fn = new TapableTest()
//  注册事件
 fn.hooks.beforeOne.tap('beforeOne',(name)=>{
     console.log(name)
     console.log('1:beforeOne')
 })
 fn.hooks.afterOne.tap('afterOne',()=>{
    console.log('2:afterOne')
})
fn.hooks.afterTwo.tap('afterTwo',()=>{
    console.log('3:afterTwo')
})
 fn.Test()