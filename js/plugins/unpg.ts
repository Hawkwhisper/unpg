declare var Sprite:any;
declare var Graphics:any;
declare var Scene_Base:any;
declare var Scene_Map:any;
declare var Bitmap:any;
declare var $dataMap:any;
declare var nw:any;
declare var process:any;

/**
 * @const {Function} newWorker
 * Creates a worker process.
 * (Used for multi-threading)
 */
const newWorker = () => {
    let src = `./js/plugins/unpgWorker.js`;
    let worker = new Worker(src);
    return worker;
};

/**
 * @const {Array} __threads
 * Container for thread processes
 */
const __threads=[];

/**
 * @const {Number} __threadsToCreate
 * Amount of thread processes to create.
 * (not linked to actual core / thread
 * count, but more should take advantage
 * if people have the threads for it.)
 */
const __threadsToCreate = window.navigator.hardwareConcurrency;

/**
 * @var {Number} _workerIndex
 * Index of the worker thread. Used to
 * reduce workload by attaching
 * each sprite to a different
 * thread until it loops back to
 * 0.
 */
let _workerIndex = 0;
/**
 * Create the thread workers.
 */
(() => {
    for(let i=0;i<__threadsToCreate;i++) {
        __threads.push({
            worker: newWorker(),
            sprites: []
        });

        //Set target to thread that was just created
        let target = __threads[__threads.length-1];

        //Scan throught all sprites and determine render flag
        target.worker.onmessage = e => {
            target.sprites[e.target] = e.data.__renderable
        }
    }
})();


/**
 * @class uSprite
 * @extends Sprite
 * 
 * Processes X/Y on a separate thread
 * to improve performance by removing
 * entirely when off screen.
 */
class uSprite extends Sprite {
    constructor(bitmap) {
        super(bitmap);
        this.__threadId = _workerIndex%__threadsToCreate;

        this.setCreationData();
        this._process();
    }

    _process() {
        let _w = 0;
        let _h = 0;
        if(this.bitmap) {
            _w = this.bitmap.width;
            _h = this.bitmap.height;
        }
        __threads[this.__threadId].worker.postMessage({
            x: this.x,
            y: this.y,
            w: _w,
            h: _h,
            sw: Graphics.boxWidth,
            sh: Graphics.boxHeight,
            target: this._SPRITELINK
        });

        this.visible = this._SPRITELINK.__renderable;
        
    }

    /**
     * @method setCreationData
     * Sets the creation data used
     * for tracking its initial position
     * upon being created. Not sure
     * if we'll use this, but its here if
     * we need it.
     */
    setCreationData() {
        this.creationData = {
            x: this.x,
            y: this.y,
        }

         __threads[this.__threadId].sprites.push({
             __renderable: false,
         });

         //Set spritelink value to the sprite ID
         //in the worker array.
         this._SPRITELINK = __threads[this.__threadId].sprites.length-1;
    }
}

/**
 * UnPG EDITOR MODE
 */
(() => {
    /**
     * @const sms
     * Alias for Scene_Map start process
     */
    const sms = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        sms.apply(this, arguments);

        /**
         * Create editing tools
         */
        if($dataMap.meta.enableEditor) this.createEditorTools();
    }

    Scene_Map.prototype.createEditorTools = function() {
        // Get the current window
        var win = nw.Window.get();

        // Create a new window and get it
        nw.Window.open('./js/plugins/_htm/editor.html', {}, function(new_win) {
        // And listen to new window's focus event
            new_win.on('focus', function() {
                console.log(new_win);
            });
            win.on('close', () => {
                new_win.close();
                process.exit();
            });
        });
    }
})();