const {Readable} = require('stream');
const fs = require('fs');
const path_lib = require('path');
const {join, resolve, basename} = require('path');

const EventEmitter = require('node:events');

class WatchLog extends Readable {
    constructor(path, options) {
        super(options);
        this.fd = null;
        this.path = path;
        this.buffersize = 64 * 1024;
        this.position = 0;
        this.modified = true;
        this.watcher = null;
        this.run_stream = true;

        if(path_lib.extname(path) != ".log") {
            this.destroy(`INVALID_FILE_NAME ${path_lib.basename(path)} is not supported`);
        }
    }

    // Making the stream ready and let nodejs know it's ready by using callback
    _construct(callback) {
        this.watcher = fs.watchFile(this.path, () => { 
            this.modified = true;
            this.read();
        });

        fs.open(this.path, 'r', (err, fd) => {
            if(err) {
                this.destroy(err);
            }
            this.fd = fd;
            callback();
        });

    }
    
    _read(size) {
    
        if(this.modified) {
            fs.closeSync(this.fd);
            this.fd = fs.openSync(this.path, "r");
            this.modified = false;
        }
        const buffer = Buffer.alloc(this.buffersize);
        fs.read(this.fd, buffer,0, this.buffersize, this.position, (err, bytesRead) => {
            if(err) {
                this.destroy(err);
            }
            else{
                this.position += bytesRead;
                this.push(buffer.slice(0, bytesRead));
            }
        });
    }
}

const stream = new WatchLog("test.log");

stream.on('data', chunk => {
    console.log(chunk.toString());
});

stream.on('error', (err) => {
    console.log(err);
    process.exit();
});
