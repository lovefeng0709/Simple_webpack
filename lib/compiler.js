const path = require('path')
const fs  = require('fs')
const {SyncHook} = require('tapable')
// 引入parser 解析成ast
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const ejs = require('ejs')
class Compiler {
    constructor(config){
        this.config = config
        this.entry = config.entry
        this.root = process.cwd()
        this.modules={}
        // loader配置项rules
        this.rules = config.module.rules
        // 定义生命周期
        this.hooks={
          make: new SyncHook(),
          run:new SyncHook(),
          emit:new SyncHook(),
          afterEmit: new SyncHook(),
          done:new SyncHook(),
        }
        // 得到plugins数组中的每一个插件对象 ，并执行其内部apply方法 -> 定义事件
        if(Array.isArray(this.config.plugins)){
          this.config.plugins.forEach(plugin=>{
            plugin.apply(this)
          })
        }
       
    }
    // 获取目录文件以utf-8
    getSource(path){
        return fs.readFileSync(path,'utf-8')
    }
    // 解析
    depanalyse(modulePath){
        // console.log(modulePath)
        let depanalyseArr =[]
        // 获取代码
        let source = this.getSource(modulePath)
        // 抽取加载使用loader方法
        let readUseLoader=(useLoaderPath,obj)=>{
          let loaderPath = path.join(this.root,useLoaderPath)
          let loader = require(loaderPath)
          console.log('loader:',loader)
          source = loader.call(obj,source)
        }
        // 处理laoder 倒序遍历
        for(let i=this.rules.length-1; i>=0;i--){
          let {use,test}= this.rules[i]
          if(test.test(modulePath)){
            if(Array.isArray(use)){
              // 如果use是数组
              for(let j=use.length-1;j>=0;j--){
                readUseLoader(use[j])
              }
            }else if(typeof use === 'string'){
              // 如果use是字符串
                // let loaderPath = path.join(this.root,use)
                // let loader = require(loaderPath)
                // source = loader(source)
                readUseLoader(use)
            }else if(use instanceof Object){
              // 如果use是对象
                // let loaderPath = path.join(this.root,use)
                // let loader = require(loaderPath)
                // source = loader.call({query:use.name},source)
              readUseLoader(use.loader,{query:use.options})
            }
          }
        }
        // 抽象语法树
        let ast = parser.parse(source)
        traverse(ast, {
            CallExpression(p) {
                
              if (p.node.callee.name=='require') {
                //   替换require
                p.node.callee.name=" __webpack_require__";
                // 修改路径并避免windows出现\反斜杠
                p.node.arguments[0].value =('./' + path.join('src',p.node.arguments[0].value)).replace(/\\+/g,'/')
                // console.log(p.node.arguments[0].value)
                depanalyseArr.push(p.node.arguments[0].value)
              }
             
            }
          });
        //   替换后生成新code
        let sourceCode = generator(ast).code
        // console.log(sourceCode)
        let modulesId = ('./' + path.relative(this.root,modulePath)).replace(/\\+/g,'/')
        this.modules[modulesId] = sourceCode
        
        // 递归调用
        depanalyseArr.forEach(dep => {
            this.depanalyse(path.resolve(this.root,dep))
        })
    }
    emitFile(){
      // 使用模板拼接字符拼接，生成最终代码
      let template = this.getSource(path.join(__dirname,'../template/output.ejs'))
      let result = ejs.render(template,{
        entry:this.entry,
        modules:this.modules
      })
      // 获取输出目录
     let outputPath = path.join(this.config.output.path,this.config.output.filename)
    //  console.log(outputPath)
    // 输出文件
    fs.writeFileSync(outputPath,result)
    }
    start(){
        // 打包
       this.depanalyse(path.resolve(this.root,this.entry))
      //  console.log(this.modules)
      this.hooks.emit.call()
       this.emitFile()
       this.hooks.afterEmit.call()
       this.hooks.done.call()
    }
}
module.exports = Compiler