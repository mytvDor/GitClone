// const path = require('path');
// const fs = require('fs');
// const crypto = require('crypto');
// const zlib = require('zlib');

// class HashObjectCommand {
//     constructor(flag, filepath) {
//         this.flag = flag;
//         this.filepath = filepath;
//     }

//     execute() {
//         // 1. Make sure file exists
//         const filepath = path.resolve(this.filepath);
//         if (!fs.existsSync(filepath)) {
//             throw new Error(`Could not open ${this.filepath} for reading: No such file or directory`);
//         }

//         // 2. Read the file
//         const fileContents = fs.readFileSync(filepath);
//         const fileLength = fileContents.length;

//         // 3. Create blob
//         const header = `blob ${fileLength}\0`;
//         const blob = Buffer.concat([Buffer.from(header), fileContents]);

//         // 4. Calculate hash
//         const hash = crypto.createHash('sha1').update(blob).digest("hex");

//         // 5. If -w flag is provided, write object to Git object storage
//         if (this.flag === '-w') {
//             const folder = hash.slice(0, 2);
//             const file = hash.slice(2);
//             const completeFolderPath = path.join(process.cwd(), '.git', 'objects', folder);

//             // Check if the directory exists, create it if not
//             if (!fs.existsSync(completeFolderPath)) {
//                 fs.mkdirSync(completeFolderPath, { recursive: true });
//             }

//             // Compress blob data
//             const compressedData = zlib.deflateSync(blob);

//             // Write compressed data to the object file
//             fs.writeFileSync(path.join(completeFolderPath, file), compressedData);
//         }

//         // Write the hash to stdout
//         process.stdout.write(hash);
//     }
// }

// module.exports = HashObjectCommand;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');

class HashObjectCommand {
    constructor(flag, filepath) {
        this.flag = flag;
        this.filepath = filepath;
    }

    execute() {
        // 1. Make sure file exists
        const filepath = path.resolve(this.filepath);
        if (!fs.existsSync(filepath)) {
            throw new Error(`Could not open ${this.filepath} for reading: No such file or directory`);
        }

        // 2. Read the file
        const fileContents = fs.readFileSync(filepath);
        const fileLength = fileContents.length;

        // 3. Create blob with header
        const header = `blob ${fileLength}\0`;
        const blob = Buffer.concat([Buffer.from(header), fileContents]);

        // 4. Calculate hash
        const hash = crypto.createHash('sha1').update(blob).digest("hex");

        // 5. If -w flag is provided, write object to Git object storage
        if (this.flag === '-w') {
            const folder = hash.slice(0, 2);
            const file = hash.slice(2);
            const completeFolderPath = path.join(process.cwd(), '.git', 'objects', folder);

            // Check if the directory exists, create it if not
            if (!fs.existsSync(completeFolderPath)) {
                fs.mkdirSync(completeFolderPath, { recursive: true });
            }

            // Compress blob data
            const compressedData = zlib.deflateSync(blob);

            // Write compressed data to the object file
            fs.writeFileSync(path.join(completeFolderPath, file), compressedData);
        }

        // Write the hash to stdout
        process.stdout.write(hash);
    }
}

module.exports = HashObjectCommand;
