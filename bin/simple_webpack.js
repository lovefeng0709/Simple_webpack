#!/usr/bin/env node

// console.log('开始打包')

const path = require('path')
// 读取需要打包项目的配置文件
let config = require(path.resolve('webpack.config.js'))
console.log(config)
const Compiler = require('..lib/compiler.js')

new Compiler(config).start()