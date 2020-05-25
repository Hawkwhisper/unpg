var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * @const {Function} newWorker
 * Creates a worker process.
 * (Used for multi-threading)
 */
var newWorker = function () {
    var src = "./js/plugins/unpgWorker.js";
    var worker = new Worker(src);
    return worker;
};
/**
 * @const {Array} __threads
 * Container for thread processes
 */
var __threads = [];
/**
 * @const {Number} __threadsToCreate
 * Amount of thread processes to create.
 * (not linked to actual core / thread
 * count, but more should take advantage
 * if people have the threads for it.)
 */
var __threadsToCreate = window.navigator.hardwareConcurrency;
/**
 * @var {Number} _workerIndex
 * Index of the worker thread. Used to
 * reduce workload by attaching
 * each sprite to a different
 * thread until it loops back to
 * 0.
 */
var _workerIndex = 0;
/**
 * Create the thread workers.
 */
(function () {
    var _loop_1 = function (i) {
        __threads.push({
            worker: newWorker(),
            sprites: []
        });
        //Set target to thread that was just created
        var target = __threads[__threads.length - 1];
        //Scan throught all sprites and determine render flag
        target.worker.onmessage = function (e) {
            target.sprites[e.target] = e.data.__renderable;
        };
    };
    for (var i = 0; i < __threadsToCreate; i++) {
        _loop_1(i);
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
var uSprite = /** @class */ (function (_super) {
    __extends(uSprite, _super);
    function uSprite(bitmap) {
        var _this = _super.call(this, bitmap) || this;
        _this.__threadId = _workerIndex % __threadsToCreate;
        _this.setCreationData();
        _this._process();
        return _this;
    }
    uSprite.prototype._process = function () {
        var _w = 0;
        var _h = 0;
        if (this.bitmap) {
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
    };
    /**
     * @method setCreationData
     * Sets the creation data used
     * for tracking its initial position
     * upon being created. Not sure
     * if we'll use this, but its here if
     * we need it.
     */
    uSprite.prototype.setCreationData = function () {
        this.creationData = {
            x: this.x,
            y: this.y
        };
        __threads[this.__threadId].sprites.push({
            __renderable: false
        });
        //Set spritelink value to the sprite ID
        //in the worker array.
        this._SPRITELINK = __threads[this.__threadId].sprites.length - 1;
    };
    return uSprite;
}(Sprite));
/**
 * UnPG EDITOR MODE
 */
(function () {
    /**
     * @const sms
     * Alias for Scene_Map start process
     */
    var sms = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function () {
        sms.apply(this, arguments);
        /**
         * Create editing tools
         */
        if ($dataMap.meta.enableEditor)
            this.createEditorTools();
    };
    Scene_Map.prototype.createEditorTools = function () {
        // Get the current window
        var win = nw.Window.get();
        // Create a new window and get it
        nw.Window.open('./js/plugins/_htm/editor.html', {}, function (new_win) {
            // And listen to new window's focus event
            new_win.on('focus', function () {
                console.log(new_win);
            });
            win.on('close', function () {
                new_win.close();
                process.exit();
            });
        });
    };
})();
