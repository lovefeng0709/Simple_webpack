const path = require('path')
const fs  = require('fs')

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
    }
    // 获取目录文件以utf-8
    getSource(path){
        return fs.readFileSync(path,'utf-8')
    }
    // 解析
    depanalyse(modulePath){
        // console.log(modulePath)
        let depanalyseArr =[]
        let source = this.getSource(modulePath)
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
       this.emitFile()
    }
}
module.exports = Compiler