const path = require('path')
const fs  = require('fs')
const parser = require('@babel/parser')
class Compiler {
    constructor(config){
        this.config = config
        this.entry = config.entry
        this.root = process.cwd()
    }
    // 获取目录文件以utf-8
    getSource(path){
        return fs.readFileSync(path,'utf-8')
    }
    // 解析
    depanalyse(modulePath){
        // console.log(modulePath)
       let source = this.getSource(modulePath)
       console.log(source)
        let ast = parser.parse(source)
        console.log(ast)
    }
    start(){
        // 打包
       this.depanalyse(path.resolve(this.root,this.entry))
    }
}
module.exports = Compiler