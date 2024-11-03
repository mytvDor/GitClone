const CatFileCommand = require('./cat-file')
const HashObjectCommand = require('./hash-object')
const LSTreeCommand =require('./ls-tree')
const writeTreeCommand =require('./write-tree')
const CommitTreeCommand =require('./commit-tree')
const CloneCommand = require('./clone')
module.exports= {
    CatFileCommand,
    HashObjectCommand,
    LSTreeCommand,
    writeTreeCommand,
    CommitTreeCommand,
    CloneCommand
}
