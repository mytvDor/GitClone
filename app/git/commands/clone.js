const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');

class CloneCommand {
    constructor(repoUrl, targetDir) {
        this.repoUrl = repoUrl;
        this.targetDir = targetDir;
    }
    async execute() {
        try {
            await this.clone();
            console.log("Cloning complete.");
        } catch (error) {
            console.error(`Error during cloning: ${error.message}`);
        }
    }
    async clone() {
        await this.initGitDirectory();
        const refs = await this.fetchRefs();
        if (!refs || Object.keys(refs).length === 0) {
            throw new Error('No references found. Ensure the repository exists and is accessible.');
        }
        const packfile = await this.fetchPackfile(refs);
        await this.unpackPackfile(packfile);
    }
    async initGitDirectory() {
        const gitDir = path.join(this.targetDir, '.git');
        fs.mkdirSync(gitDir, { recursive: true });
        fs.mkdirSync(path.join(gitDir, 'objects'), { recursive: true });
        fs.mkdirSync(path.join(gitDir, 'refs'), { recursive: true });
        fs.mkdirSync(path.join(gitDir, 'info'), { recursive: true });
    }
    async fetchRefs() {
        return new Promise((resolve, reject) => {
            https.get(`${this.repoUrl}/info/refs?service=git-upload-pack`, res => {
                let data = [];
                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    const response = Buffer.concat(data).toString();
                    resolve(this.parseRefs(response));
                });
            }).on('error', err => reject(new Error(`Failed to fetch refs: ${err.message}`)));
        });
    }
    parseRefs(data) {
        const refs = {};
        data.split('\n').forEach(line => {
            const parts = line.split(' ');
            if (parts.length === 2) refs[parts[1]] = parts[0];
        });
        return refs;
    }
    async fetchPackfile(refs) {
        return new Promise((resolve, reject) => {
            const refHash = Object.values(refs)[0];
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-git-upload-pack-request',
                }
            };
    
            const req = https.request(`${this.repoUrl}/git-upload-pack`, options, res => {
                let data = [];
                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    const response = Buffer.concat(data);
                    if (response.length === 0) {
                        console.error(`Received empty response from ${this.repoUrl}/git-upload-pack`);
                        return reject(new Error('Received empty response when fetching packfile.'));
                    }
                    resolve(response);
                });
            });
    
            req.on('error', err => {
                console.error(`Request error: ${err.message}`);
                reject(new Error(`Failed to fetch packfile: ${err.message}`));
            });
    
            // Prepare the request body for the packfile
            const requestBody = `0032want ${refHash}\n0000`;
            req.write(requestBody);
            req.end();
        });
    }
    
    async unpackPackfile(packfile) {
        const header = packfile.slice(0, 4).toString();
        if (header !== 'PACK') throw new Error('Invalid packfile signature');
        const version = packfile.readUInt32BE(4);
        if (version !== 2) throw new Error('Unsupported packfile version: ' + version);
        const objectCount = packfile.readUInt32BE(8);
        let offset = 12;
        for (let i = 0; i < objectCount; i++) {
            const objectData = this.parseObject(packfile, offset);
            offset += objectData.consumedBytes;
            this.storeObject(objectData);
        }
    }
    parseObject(packfile, offset) {
        let byte = packfile[offset++];
        let type = (byte >> 4) & 0b111;
        let size = byte & 0b1111;
        let shift = 4;
        while (byte & 0b10000000) {
            byte = packfile[offset++];
            size |= (byte & 0b01111111) << shift;
            shift += 7;
        }
        let compressedData = packfile.slice(offset);
        let decompressedData;
        try {
            decompressedData = zlib.inflateSync(compressedData);
        } catch (err) {
            throw new Error("Failed to decompress object data: " + err.message);
        }
        const consumedBytes = compressedData.length - decompressedData.length;
        const header = `${['invalid', 'commit', 'tree', 'blob', 'tag'][type]} ${decompressedData.length}\0`;
        const data = Buffer.concat([Buffer.from(header), decompressedData]);
        const hash = crypto.createHash('sha1').update(data).digest('hex');
        return { hash, content: decompressedData, length: decompressedData.length, consumedBytes: consumedBytes + offset };
    }
    storeObject({ hash, content }) {
        const folder = hash.slice(0, 2);
        const file = hash.slice(2);
        const objectDir = path.join(this.targetDir, '.git', 'objects', folder);
        fs.mkdirSync(objectDir, { recursive: true });
        fs.writeFileSync(path.join(objectDir, file), zlib.deflateSync(content));
    }
}

module.exports = CloneCommand;
