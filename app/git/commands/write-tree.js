
const path = require('path')
const fs = require('fs')
const zlib = require('zlib');
const crypto =require('crypto')


function writeFilBlob(currentPath){

    const contents = fs.readFileSync(currentPath)

    const len = contents.length;

    const header = `blob ${len}\0`

    const blob = Buffer.concat([Buffer.from(header),contents])

    const hash = crypto.createHash('sha1').update(blob).digest("hex");

    const folder = hash.slice(0,2)
    const file = hash.slice(2)

    const completeFolderPath = path.join(process.cwd(), '.git', 'objects', folder);

    if (!fs.existsSync(completeFolderPath)) {
        fs.mkdirSync(completeFolderPath, { recursive: true });
    }

    // Compress blob data
    const compressedData = zlib.deflateSync(blob);

    // Write compressed data to the object file
    fs.writeFileSync(path.join(completeFolderPath, file), compressedData);

    return hash
}


class writeTreeCommand {

    constructor(){}

    execute(){

//recursive read all files

function recursiveCreateTree(bashPath ){

    const dirContents = fs.readdirSync(bashPath)
const results=[]
  for(const dirContent of dirContents){


    if(dirContent.includes('.git')) continue;


    const currentPath = path.join(bashPath , dirContent)

    const stat = fs.statSync(currentPath)

    if(stat.isDirectory()){

const sha = recursiveCreateTree(currentPath)

if(sha){

    results.push({mode:'40000',basename:path.basename(currentPath),sha})

}

    }
    else if(stat.isFile){

const sha = writeFilBlob(currentPath)

results.push({mode:'100644',basename:path.basename(currentPath),sha})
    }
  }

  if(dirContents.length=== 0  || results.length === 0) return null;


  const treeData =results.reduce((acc,current)=>{
const {mode ,basename,sha}= current

return Buffer.concat([acc,Buffer.from(`${mode} ${basename}\0`),Buffer.from(sha,"hex")])
  },Buffer.alloc(0))


const tree = Buffer.concat([Buffer.from(`tree ${treeData.length}\0`),treeData])

const hash = crypto.createHash('sha1').update(tree).digest('hex')


const folder = hash.slice(0,2)
const file = hash.slice(2)

const treeFolderPath = path.join(process.cwd(),'.git','objects',folder)

if (!fs.existsSync(treeFolderPath)) {
    fs.mkdirSync(treeFolderPath);
}

const compressed = zlib.deflateSync(tree)

fs.writeFileSync(path.join(treeFolderPath,file),compressed)

return hash
}


//if item is dir then do it again

// if file create blob  . . .
const sha = recursiveCreateTree(process.cwd())

process.stdout.write(sha)




    }


}

module.exports = writeTreeCommand