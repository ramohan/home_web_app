(function() {
    function require(path, parent, orig) {
        var resolved = require.resolve(path);
        if (null == resolved) {
            orig = orig || path;
            parent = parent || "root";
            var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
            err.path = orig;
            err.parent = parent;
            err.require = true;
            throw err
        }
        var module = require.modules[resolved];
        if (!module._resolving && !module.exports) {
            var mod = {};
            mod.exports = {};
            mod.client = mod.component = true;
            module._resolving = true;
            module.call(this, mod.exports, require.relative(resolved), mod);
            delete module._resolving;
            module.exports = mod.exports
        }
        return module.exports
    }
    require.modules = {};
    require.aliases = {};
    require.resolve = function(path) {
        if (path.charAt(0) === "/") path = path.slice(1);
        var paths = [path, path + ".js", path + ".json", path + "/index.js", path + "/index.json"];
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (require.modules.hasOwnProperty(path)) return path;
            if (require.aliases.hasOwnProperty(path)) return require.aliases[path]
        }
    };
    require.normalize = function(curr, path) {
        var segs = [];
        if ("." != path.charAt(0)) return path;
        curr = curr.split("/");
        path = path.split("/");
        for (var i = 0; i < path.length; ++i) {
            if (".." == path[i]) {
                curr.pop()
            } else if ("." != path[i] && "" != path[i]) {
                segs.push(path[i])
            }
        }
        return curr.concat(segs).join("/")
    };
    require.register = function(path, definition) {
        require.modules[path] = definition
    };
    require.alias = function(from, to) {
        if (!require.modules.hasOwnProperty(from)) {
            throw new Error('Failed to alias "' + from + '", it does not exist')
        }
        require.aliases[to] = from
    };
    require.relative = function(parent) {
        var p = require.normalize(parent, "..");

        function lastIndexOf(arr, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === obj) return i
            }
            return -1
        }

        function localRequire(path) {
            var resolved = localRequire.resolve(path);
            return require(resolved, parent, path)
        }
        localRequire.resolve = function(path) {
            var c = path.charAt(0);
            if ("/" == c) return path.slice(1);
            if ("." == c) return require.normalize(p, path);
            var segs = parent.split("/");
            var i = lastIndexOf(segs, "deps") + 1;
            if (!i) i = 0;
            path = segs.slice(0, i + 1).join("/") + "/deps/" + path;
            return path
        };
        localRequire.exists = function(path) {
            return require.modules.hasOwnProperty(localRequire.resolve(path))
        };
        return localRequire
    };
    require.register("visionmedia-node-querystring/index.js", function(exports, require, module) {
        var toString = Object.prototype.toString;
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var indexOf = typeof Array.prototype.indexOf === "function" ? function(arr, el) {
            return arr.indexOf(el)
        } : function(arr, el) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === el) return i
            }
            return -1
        };
        var isArray = Array.isArray || function(arr) {
            return toString.call(arr) == "[object Array]"
        };
        var objectKeys = Object.keys || function(obj) {
            var ret = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    ret.push(key)
                }
            }
            return ret
        };
        var forEach = typeof Array.prototype.forEach === "function" ? function(arr, fn) {
            return arr.forEach(fn)
        } : function(arr, fn) {
            for (var i = 0; i < arr.length; i++) fn(arr[i])
        };
        var reduce = function(arr, fn, initial) {
            if (typeof arr.reduce === "function") return arr.reduce(fn, initial);
            var res = initial;
            for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);
            return res
        };
        var isint = /^[0-9]+$/;

        function promote(parent, key) {
            if (parent[key].length == 0) return parent[key] = {};
            var t = {};
            for (var i in parent[key]) {
                if (hasOwnProperty.call(parent[key], i)) {
                    t[i] = parent[key][i]
                }
            }
            parent[key] = t;
            return t
        }

        function parse(parts, parent, key, val) {
            var part = parts.shift();
            if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
            if (!part) {
                if (isArray(parent[key])) {
                    parent[key].push(val)
                } else if ("object" == typeof parent[key]) {
                    parent[key] = val
                } else if ("undefined" == typeof parent[key]) {
                    parent[key] = val
                } else {
                    parent[key] = [parent[key], val]
                }
            } else {
                var obj = parent[key] = parent[key] || [];
                if ("]" == part) {
                    if (isArray(obj)) {
                        if ("" != val) obj.push(val)
                    } else if ("object" == typeof obj) {
                        obj[objectKeys(obj).length] = val
                    } else {
                        obj = parent[key] = [parent[key], val]
                    }
                } else if (~indexOf(part, "]")) {
                    part = part.substr(0, part.length - 1);
                    if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                    parse(parts, obj, part, val)
                } else {
                    if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                    parse(parts, obj, part, val)
                }
            }
        }

        function merge(parent, key, val) {
            if (~indexOf(key, "]")) {
                var parts = key.split("["),
                    len = parts.length,
                    last = len - 1;
                parse(parts, parent, "base", val)
            } else {
                if (!isint.test(key) && isArray(parent.base)) {
                    var t = {};
                    for (var k in parent.base) t[k] = parent.base[k];
                    parent.base = t
                }
                set(parent.base, key, val)
            }
            return parent
        }

        function compact(obj) {
            if ("object" != typeof obj) return obj;
            if (isArray(obj)) {
                var ret = [];
                for (var i in obj) {
                    if (hasOwnProperty.call(obj, i)) {
                        ret.push(obj[i])
                    }
                }
                return ret
            }
            for (var key in obj) {
                obj[key] = compact(obj[key])
            }
            return obj
        }

        function parseObject(obj) {
            var ret = {
                base: {}
            };
            forEach(objectKeys(obj), function(name) {
                merge(ret, name, obj[name])
            });
            return compact(ret.base)
        }

        function parseString(str) {
            var ret = reduce(String(str).split("&"), function(ret, pair) {
                var eql = indexOf(pair, "="),
                    brace = lastBraceInKey(pair),
                    key = pair.substr(0, brace || eql),
                    val = pair.substr(brace || eql, pair.length),
                    val = val.substr(indexOf(val, "=") + 1, val.length);
                if ("" == key) key = pair, val = "";
                if ("" == key) return ret;
                return merge(ret, decode(key), decode(val))
            }, {
                base: {}
            }).base;
            return compact(ret)
        }
        exports.parse = function(str) {
            if (null == str || "" == str) return {};
            return "object" == typeof str ? parseObject(str) : parseString(str)
        };
        var stringify = exports.stringify = function(obj, prefix) {
            if (isArray(obj)) {
                return stringifyArray(obj, prefix)
            } else if ("[object Object]" == toString.call(obj)) {
                return stringifyObject(obj, prefix)
            } else if ("string" == typeof obj) {
                return stringifyString(obj, prefix)
            } else {
                return prefix + "=" + encodeURIComponent(String(obj))
            }
        };

        function stringifyString(str, prefix) {
            if (!prefix) throw new TypeError("stringify expects an object");
            return prefix + "=" + encodeURIComponent(str)
        }

        function stringifyArray(arr, prefix) {
            var ret = [];
            if (!prefix) throw new TypeError("stringify expects an object");
            for (var i = 0; i < arr.length; i++) {
                ret.push(stringify(arr[i], prefix + "[" + i + "]"))
            }
            return ret.join("&")
        }

        function stringifyObject(obj, prefix) {
            var ret = [],
                keys = objectKeys(obj),
                key;
            for (var i = 0, len = keys.length; i < len; ++i) {
                key = keys[i];
                if ("" == key) continue;
                if (null == obj[key]) {
                    ret.push(encodeURIComponent(key) + "=")
                } else {
                    ret.push(stringify(obj[key], prefix ? prefix + "[" + encodeURIComponent(key) + "]" : encodeURIComponent(key)))
                }
            }
            return ret.join("&")
        }

        function set(obj, key, val) {
            var v = obj[key];
            if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
            if (undefined === v) {
                obj[key] = val
            } else if (isArray(v)) {
                v.push(val)
            } else {
                obj[key] = [v, val]
            }
        }

        function lastBraceInKey(str) {
            var len = str.length,
                brace, c;
            for (var i = 0; i < len; ++i) {
                c = str[i];
                if ("]" == c) brace = false;
                if ("[" == c) brace = true;
                if ("=" == c && !brace) return i
            }
        }

        function decode(str) {
            try {
                return decodeURIComponent(str.replace(/\+/g, " "))
            } catch (err) {
                return str
            }
        }
    });
    require.register("component-emitter/index.js", function(exports, require, module) {
        module.exports = Emitter;

        function Emitter(obj) {
            if (obj) return mixin(obj)
        }

        function mixin(obj) {
            for (var key in Emitter.prototype) {
                obj[key] = Emitter.prototype[key]
            }
            return obj
        }
        Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
            this._callbacks = this._callbacks || {};
            (this._callbacks[event] = this._callbacks[event] || []).push(fn);
            return this
        };
        Emitter.prototype.once = function(event, fn) {
            var self = this;
            this._callbacks = this._callbacks || {};

            function on() {
                self.off(event, on);
                fn.apply(this, arguments)
            }
            on.fn = fn;
            this.on(event, on);
            return this
        };
        Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
            this._callbacks = this._callbacks || {};
            if (0 == arguments.length) {
                this._callbacks = {};
                return this
            }
            var callbacks = this._callbacks[event];
            if (!callbacks) return this;
            if (1 == arguments.length) {
                delete this._callbacks[event];
                return this
            }
            var cb;
            for (var i = 0; i < callbacks.length; i++) {
                cb = callbacks[i];
                if (cb === fn || cb.fn === fn) {
                    callbacks.splice(i, 1);
                    break
                }
            }
            return this
        };
        Emitter.prototype.emit = function(event) {
            this._callbacks = this._callbacks || {};
            var args = [].slice.call(arguments, 1),
                callbacks = this._callbacks[event];
            if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) {
                    callbacks[i].apply(this, args)
                }
            }
            return this
        };
        Emitter.prototype.listeners = function(event) {
            this._callbacks = this._callbacks || {};
            return this._callbacks[event] || []
        };
        Emitter.prototype.hasListeners = function(event) {
            return !!this.listeners(event).length
        }
    });
    require.register("component-indexof/index.js", function(exports, require, module) {
        module.exports = function(arr, obj) {
            if (arr.indexOf) return arr.indexOf(obj);
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i] === obj) return i
            }
            return -1
        }
    });
    require.register("component-object/index.js", function(exports, require, module) {
        var has = Object.prototype.hasOwnProperty;
        exports.keys = Object.keys || function(obj) {
            var keys = [];
            for (var key in obj) {
                if (has.call(obj, key)) {
                    keys.push(key)
                }
            }
            return keys
        };
        exports.values = function(obj) {
            var vals = [];
            for (var key in obj) {
                if (has.call(obj, key)) {
                    vals.push(obj[key])
                }
            }
            return vals
        };
        exports.merge = function(a, b) {
            for (var key in b) {
                if (has.call(b, key)) {
                    a[key] = b[key]
                }
            }
            return a
        };
        exports.length = function(obj) {
            return exports.keys(obj).length
        };
        exports.isEmpty = function(obj) {
            return 0 == exports.length(obj)
        }
    });
    require.register("component-event/index.js", function(exports, require, module) {
        var bind = window.addEventListener ? "addEventListener" : "attachEvent",
            unbind = window.removeEventListener ? "removeEventListener" : "detachEvent",
            prefix = bind !== "addEventListener" ? "on" : "";
        exports.bind = function(el, type, fn, capture) {
            el[bind](prefix + type, fn, capture || false);
            return fn
        };
        exports.unbind = function(el, type, fn, capture) {
            el[unbind](prefix + type, fn, capture || false);
            return fn
        }
    });
    require.register("component-clone/index.js", function(exports, require, module) {
        var type;
        try {
            type = require("component-type")
        } catch (_) {
            type = require("type")
        }
        module.exports = clone;

        function clone(obj) {
            switch (type(obj)) {
                case "object":
                    var copy = {};
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            copy[key] = clone(obj[key])
                        }
                    }
                    return copy;
                case "array":
                    var copy = new Array(obj.length);
                    for (var i = 0, l = obj.length; i < l; i++) {
                        copy[i] = clone(obj[i])
                    }
                    return copy;
                case "regexp":
                    var flags = "";
                    flags += obj.multiline ? "m" : "";
                    flags += obj.global ? "g" : "";
                    flags += obj.ignoreCase ? "i" : "";
                    return new RegExp(obj.source, flags);
                case "date":
                    return new Date(obj.getTime());
                default:
                    return obj
            }
        }
    });
    require.register("component-bind/index.js", function(exports, require, module) {
        var slice = [].slice;
        module.exports = function(obj, fn) {
            if ("string" == typeof fn) fn = obj[fn];
            if ("function" != typeof fn) throw new Error("bind() requires a function");
            var args = [].slice.call(arguments, 2);
            return function() {
                return fn.apply(obj, args.concat(slice.call(arguments)))
            }
        }
    });
    require.register("component-props/index.js", function(exports, require, module) {
        var globals = /\b(this|Array|Date|Object|Math|JSON)\b/g;
        module.exports = function(str, fn) {
            var p = unique(props(str));
            if (fn && "string" == typeof fn) fn = prefixed(fn);
            if (fn) return map(str, p, fn);
            return p
        };

        function props(str) {
            return str.replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, "").replace(globals, "").match(/[$a-zA-Z_]\w*/g) || []
        }

        function map(str, props, fn) {
            var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
            return str.replace(re, function(_) {
                if ("(" == _[_.length - 1]) return fn(_);
                if (!~props.indexOf(_)) return _;
                return fn(_)
            })
        }

        function unique(arr) {
            var ret = [];
            for (var i = 0; i < arr.length; i++) {
                if (~ret.indexOf(arr[i])) continue;
                ret.push(arr[i])
            }
            return ret
        }

        function prefixed(str) {
            return function(_) {
                return str + _
            }
        }
    });
    require.register("component-to-function/index.js", function(exports, require, module) {
        var expr = require("props");
        module.exports = toFunction;

        function toFunction(obj) {
            switch ({}.toString.call(obj)) {
                case "[object Object]":
                    return objectToFunction(obj);
                case "[object Function]":
                    return obj;
                case "[object String]":
                    return stringToFunction(obj);
                case "[object RegExp]":
                    return regexpToFunction(obj);
                default:
                    return defaultToFunction(obj)
            }
        }

        function defaultToFunction(val) {
            return function(obj) {
                return val === obj
            }
        }

        function regexpToFunction(re) {
            return function(obj) {
                return re.test(obj)
            }
        }

        function stringToFunction(str) {
            if (/^ *\W+/.test(str)) return new Function("_", "return _ " + str);
            return new Function("_", "return " + get(str))
        }

        function objectToFunction(obj) {
            var match = {};
            for (var key in obj) {
                match[key] = typeof obj[key] === "string" ? defaultToFunction(obj[key]) : toFunction(obj[key])
            }
            return function(val) {
                if (typeof val !== "object") return false;
                for (var key in match) {
                    if (!(key in val)) return false;
                    if (!match[key](val[key])) return false
                }
                return true
            }
        }

        function get(str) {
            var props = expr(str);
            if (!props.length) return "_." + str;
            var val;
            for (var i = 0, prop; prop = props[i]; i++) {
                val = "_." + prop;
                val = "('function' == typeof " + val + " ? " + val + "() : " + val + ")";
                str = str.replace(new RegExp(prop, "g"), val)
            }
            return str
        }
    });
    require.register("component-each/index.js", function(exports, require, module) {
        var type = require("type");
        var toFunction = require("to-function");
        var has = Object.prototype.hasOwnProperty;
        module.exports = function(obj, fn, ctx) {
            fn = toFunction(fn);
            ctx = ctx || this;
            switch (type(obj)) {
                case "array":
                    return array(obj, fn, ctx);
                case "object":
                    if ("number" == typeof obj.length) return array(obj, fn, ctx);
                    return object(obj, fn, ctx);
                case "string":
                    return string(obj, fn, ctx)
            }
        };

        function string(obj, fn, ctx) {
            for (var i = 0; i < obj.length; ++i) {
                fn.call(ctx, obj.charAt(i), i)
            }
        }

        function object(obj, fn, ctx) {
            for (var key in obj) {
                if (has.call(obj, key)) {
                    fn.call(ctx, key, obj[key])
                }
            }
        }

        function array(obj, fn, ctx) {
            for (var i = 0; i < obj.length; ++i) {
                fn.call(ctx, obj[i], i)
            }
        }
    });
    require.register("component-find/index.js", function(exports, require, module) {
        var toFunction = require("to-function");
        module.exports = function(arr, fn) {
            if ("function" != typeof fn) {
                if (Object(fn) === fn) fn = objectToFunction(fn);
                else fn = toFunction(fn)
            }
            for (var i = 0, len = arr.length; i < len; ++i) {
                if (fn(arr[i], i)) return arr[i]
            }
        };

        function objectToFunction(obj) {
            return function(o) {
                for (var key in obj) {
                    if (o[key] != obj[key]) return false
                }
                return true
            }
        }
    });
    require.register("component-json/index.js", function(exports, require, module) {
        module.exports = "undefined" == typeof JSON ? require("component-json-fallback") : JSON
    });
    require.register("component-type/index.js", function(exports, require, module) {
        var toString = Object.prototype.toString;
        module.exports = function(val) {
            switch (toString.call(val)) {
                case "[object Function]":
                    return "function";
                case "[object Date]":
                    return "date";
                case "[object RegExp]":
                    return "regexp";
                case "[object Arguments]":
                    return "arguments";
                case "[object Array]":
                    return "array";
                case "[object String]":
                    return "string"
            }
            if (val === null) return "null";
            if (val === undefined) return "undefined";
            if (val && val.nodeType === 1) return "element";
            if (val === Object(val)) return "object";
            return typeof val
        }
    });
    require.register("component-trim/index.js", function(exports, require, module) {
        exports = module.exports = trim;

        function trim(str) {
            if (str.trim) return str.trim();
            return str.replace(/^\s*|\s*$/g, "")
        }
        exports.left = function(str) {
            if (str.trimLeft) return str.trimLeft();
            return str.replace(/^\s*/, "")
        };
        exports.right = function(str) {
            if (str.trimRight) return str.trimRight();
            return str.replace(/\s*$/, "")
        }
    });
    require.register("component-map/index.js", function(exports, require, module) {
        var toFunction = require("to-function");
        module.exports = function(arr, fn) {
            var ret = [];
            fn = toFunction(fn);
            for (var i = 0; i < arr.length; ++i) {
                ret.push(fn(arr[i], i))
            }
            return ret
        }
    });
    require.register("yields-merge/index.js", function(exports, require, module) {
        module.exports = function(a, b) {
            for (var k in b) a[k] = b[k];
            return a
        }
    });
    require.register("learnboost-jsonp/index.js", function(exports, require, module) {
        var debug = require("debug")("jsonp");
        module.exports = jsonp;
        var count = 0;

        function noop() {}

        function jsonp(url, opts, fn) {
            if ("function" == typeof opts) {
                fn = opts;
                opts = {}
            }
            if (!opts) opts = {};
            var prefix = opts.prefix || "__jp";
            var param = opts.param || "callback";
            var timeout = null != opts.timeout ? opts.timeout : 6e4;
            var enc = encodeURIComponent;
            var target = document.getElementsByTagName("script")[0] || document.head;
            var script;
            var timer;
            var id = prefix + count++;
            if (timeout) {
                timer = setTimeout(function() {
                    cleanup();
                    if (fn) fn(new Error("Timeout"))
                }, timeout)
            }

            function cleanup() {
                script.parentNode.removeChild(script);
                window[id] = noop
            }
            window[id] = function(data) {
                debug("jsonp got", data);
                if (timer) clearTimeout(timer);
                cleanup();
                if (fn) fn(null, data)
            };
            url += (~url.indexOf("?") ? "&" : "?") + param + "=" + enc(id);
            url = url.replace("?&", "?");
            debug('jsonp req "%s"', url);
            script = document.createElement("script");
            script.src = url;
            target.parentNode.insertBefore(script, target)
        }
    });
    require.register("visionmedia-debug/debug.js", function(exports, require, module) {
        module.exports = debug;

        function debug(name) {
            if (!debug.enabled(name)) return function() {};
            return function(fmt) {
                fmt = coerce(fmt);
                var curr = new Date;
                var ms = curr - (debug[name] || curr);
                debug[name] = curr;
                fmt = name + " " + fmt + " +" + debug.humanize(ms);
                window.console && console.log && Function.prototype.apply.call(console.log, console, arguments)
            }
        }
        debug.names = [];
        debug.skips = [];
        debug.enable = function(name) {
            try {
                localStorage.debug = name
            } catch (e) {}
            var split = (name || "").split(/[\s,]+/),
                len = split.length;
            for (var i = 0; i < len; i++) {
                name = split[i].replace("*", ".*?");
                if (name[0] === "-") {
                    debug.skips.push(new RegExp("^" + name.substr(1) + "$"))
                } else {
                    debug.names.push(new RegExp("^" + name + "$"))
                }
            }
        };
        debug.disable = function() {
            debug.enable("")
        };
        debug.humanize = function(ms) {
            var sec = 1e3,
                min = 60 * 1e3,
                hour = 60 * min;
            if (ms >= hour) return (ms / hour).toFixed(1) + "h";
            if (ms >= min) return (ms / min).toFixed(1) + "m";
            if (ms >= sec) return (ms / sec | 0) + "s";
            return ms + "ms"
        };
        debug.enabled = function(name) {
            for (var i = 0, len = debug.skips.length; i < len; i++) {
                if (debug.skips[i].test(name)) {
                    return false
                }
            }
            for (var i = 0, len = debug.names.length; i < len; i++) {
                if (debug.names[i].test(name)) {
                    return true
                }
            }
            return false
        };

        function coerce(val) {
            if (val instanceof Error) return val.stack || val.message;
            return val
        }
        try {
            if (window.localStorage) debug.enable(localStorage.debug)
        } catch (e) {}
    });
    require.register("johntron-asap/asap.js", function(exports, require, module) {
        "use strict";
        var head = {
            task: void 0,
            next: null
        };
        var tail = head;
        var flushing = false;
        var requestFlush = void 0;
        var hasSetImmediate = typeof setImmediate === "function";
        var domain;
        if (typeof global != "undefined") {
            var process = global.process
        }
        var isNodeJS = !!process && {}.toString.call(process) === "[object process]";

        function flush() {
            while (head.next) {
                head = head.next;
                var task = head.task;
                head.task = void 0;
                try {
                    task()
                } catch (e) {
                    if (isNodeJS) {
                        requestFlush();
                        throw e
                    } else {
                        setTimeout(function() {
                            throw e
                        }, 0)
                    }
                }
            }
            flushing = false
        }
        if (isNodeJS) {
            requestFlush = function() {
                var currentDomain = process.domain;
                if (currentDomain) {
                    domain = domain || (1, require)("domain");
                    domain.active = process.domain = null
                }
                if (flushing && hasSetImmediate) {
                    setImmediate(flush)
                } else {
                    process.nextTick(flush)
                } if (currentDomain) {
                    domain.active = process.domain = currentDomain
                }
            }
        } else if (hasSetImmediate) {
            requestFlush = function() {
                setImmediate(flush)
            }
        } else if (typeof MessageChannel !== "undefined") {
            var channel = new MessageChannel;
            channel.port1.onmessage = function() {
                requestFlush = requestPortFlush;
                channel.port1.onmessage = flush;
                flush()
            };
            var requestPortFlush = function() {
                channel.port2.postMessage(0)
            };
            requestFlush = function() {
                setTimeout(flush, 0);
                requestPortFlush()
            }
        } else {
            requestFlush = function() {
                setTimeout(flush, 0)
            }
        }

        function asap(task) {
            if (isNodeJS && process.domain) {
                task = process.domain.bind(task)
            }
            tail = tail.next = {
                task: task,
                next: null
            };
            if (!flushing) {
                requestFlush();
                flushing = true
            }
        }
        module.exports = asap
    });
    require.register("chrissrogers-promise/index.js", function(exports, require, module) {
        "use strict";
        var Promise = require("./core.js");
        var asap = require("asap");
        module.exports = Promise;

        function ValuePromise(value) {
            this.then = function(onFulfilled) {
                if (typeof onFulfilled !== "function") return this;
                return new Promise(function(resolve, reject) {
                    asap(function() {
                        try {
                            resolve(onFulfilled(value))
                        } catch (ex) {
                            reject(ex)
                        }
                    })
                })
            }
        }
        ValuePromise.prototype = Promise.prototype;
        var TRUE = new ValuePromise(true);
        var FALSE = new ValuePromise(false);
        var NULL = new ValuePromise(null);
        var UNDEFINED = new ValuePromise(undefined);
        var ZERO = new ValuePromise(0);
        var EMPTYSTRING = new ValuePromise("");
        Promise.resolve = function(value) {
            if (value instanceof Promise) return value;
            if (value === null) return NULL;
            if (value === undefined) return UNDEFINED;
            if (value === true) return TRUE;
            if (value === false) return FALSE;
            if (value === 0) return ZERO;
            if (value === "") return EMPTYSTRING;
            if (typeof value === "object" || typeof value === "function") {
                try {
                    var then = value.then;
                    if (typeof then === "function") {
                        return new Promise(then.bind(value))
                    }
                } catch (ex) {
                    return new Promise(function(resolve, reject) {
                        reject(ex)
                    })
                }
            }
            return new ValuePromise(value)
        };
        Promise.from = Promise.cast = function(value) {
            var err = new Error("Promise.from and Promise.cast are deprecated, use Promise.resolve instead");
            err.name = "Warning";
            console.warn(err.stack);
            return Promise.resolve(value)
        };
        Promise.denodeify = function(fn, argumentCount) {
            argumentCount = argumentCount || Infinity;
            return function() {
                var self = this;
                var args = Array.prototype.slice.call(arguments);
                return new Promise(function(resolve, reject) {
                    while (args.length && args.length > argumentCount) {
                        args.pop()
                    }
                    args.push(function(err, res) {
                        if (err) reject(err);
                        else resolve(res)
                    });
                    fn.apply(self, args)
                })
            }
        };
        Promise.nodeify = function(fn) {
            return function() {
                var args = Array.prototype.slice.call(arguments);
                var callback = typeof args[args.length - 1] === "function" ? args.pop() : null;
                try {
                    return fn.apply(this, arguments).nodeify(callback)
                } catch (ex) {
                    if (callback === null || typeof callback == "undefined") {
                        return new Promise(function(resolve, reject) {
                            reject(ex)
                        })
                    } else {
                        asap(function() {
                            callback(ex)
                        })
                    }
                }
            }
        };
        Promise.all = function() {
            var calledWithArray = arguments.length === 1 && Array.isArray(arguments[0]);
            var args = Array.prototype.slice.call(calledWithArray ? arguments[0] : arguments);
            if (!calledWithArray) {
                var err = new Error("Promise.all should be called with a single array, calling it with multiple arguments is deprecated");
                err.name = "Warning";
                console.warn(err.stack)
            }
            return new Promise(function(resolve, reject) {
                if (args.length === 0) return resolve([]);
                var remaining = args.length;

                function res(i, val) {
                    try {
                        if (val && (typeof val === "object" || typeof val === "function")) {
                            var then = val.then;
                            if (typeof then === "function") {
                                then.call(val, function(val) {
                                    res(i, val)
                                }, reject);
                                return
                            }
                        }
                        args[i] = val;
                        if (--remaining === 0) {
                            resolve(args)
                        }
                    } catch (ex) {
                        reject(ex)
                    }
                }
                for (var i = 0; i < args.length; i++) {
                    res(i, args[i])
                }
            })
        };
        Promise.reject = function(value) {
            return new Promise(function(resolve, reject) {
                reject(value)
            })
        };
        Promise.race = function(values) {
            return new Promise(function(resolve, reject) {
                values.forEach(function(value) {
                    Promise.resolve(value).then(resolve, reject)
                })
            })
        };
        Promise.prototype.done = function(onFulfilled, onRejected) {
            var self = arguments.length ? this.then.apply(this, arguments) : this;
            self.then(null, function(err) {
                asap(function() {
                    throw err
                })
            })
        };
        Promise.prototype.nodeify = function(callback) {
            if (typeof callback != "function") return this;
            this.then(function(value) {
                asap(function() {
                    callback(null, value)
                })
            }, function(err) {
                asap(function() {
                    callback(err)
                })
            })
        };
        Promise.prototype["catch"] = function(onRejected) {
            return this.then(null, onRejected)
        }
    });
    require.register("chrissrogers-promise/core.js", function(exports, require, module) {
        "use strict";
        var asap = require("asap");
        module.exports = Promise;

        function Promise(fn) {
            if (typeof this !== "object") throw new TypeError("Promises must be constructed via new");
            if (typeof fn !== "function") throw new TypeError("not a function");
            var state = null;
            var value = null;
            var deferreds = [];
            var self = this;
            this.then = function(onFulfilled, onRejected) {
                return new self.constructor(function(resolve, reject) {
                    handle(new Handler(onFulfilled, onRejected, resolve, reject))
                })
            };

            function handle(deferred) {
                if (state === null) {
                    deferreds.push(deferred);
                    return
                }
                asap(function() {
                    var cb = state ? deferred.onFulfilled : deferred.onRejected;
                    if (cb === null) {
                        (state ? deferred.resolve : deferred.reject)(value);
                        return
                    }
                    var ret;
                    try {
                        ret = cb(value)
                    } catch (e) {
                        deferred.reject(e);
                        return
                    }
                    deferred.resolve(ret)
                })
            }

            function resolve(newValue) {
                try {
                    if (newValue === self) throw new TypeError("A promise cannot be resolved with itself.");
                    if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
                        var then = newValue.then;
                        if (typeof then === "function") {
                            doResolve(then.bind(newValue), resolve, reject);
                            return
                        }
                    }
                    state = true;
                    value = newValue;
                    finale()
                } catch (e) {
                    reject(e)
                }
            }

            function reject(newValue) {
                state = false;
                value = newValue;
                finale()
            }

            function finale() {
                for (var i = 0, len = deferreds.length; i < len; i++) handle(deferreds[i]);
                deferreds = null
            }
            doResolve(fn, resolve, reject)
        }

        function Handler(onFulfilled, onRejected, resolve, reject) {
            this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
            this.onRejected = typeof onRejected === "function" ? onRejected : null;
            this.resolve = resolve;
            this.reject = reject
        }

        function doResolve(fn, onFulfilled, onRejected) {
            var done = false;
            try {
                fn(function(value) {
                    if (done) return;
                    done = true;
                    onFulfilled(value)
                }, function(reason) {
                    if (done) return;
                    done = true;
                    onRejected(reason)
                })
            } catch (ex) {
                if (done) return;
                done = true;
                onRejected(ex)
            }
        }
    });
    require.register("kewah-mixin/index.js", function(exports, require, module) {
        if (typeof Object.keys === "function") {
            module.exports = function(to, from) {
                Object.keys(from).forEach(function(property) {
                    Object.defineProperty(to, property, Object.getOwnPropertyDescriptor(from, property))
                })
            }
        } else {
            module.exports = function(to, from) {
                for (var property in from) {
                    if (from.hasOwnProperty(property)) {
                        to[property] = from[property]
                    }
                }
            }
        }
    });
    require.register("pluma-par/dist/par.js", function(exports, require, module) {
        var slice = Array.prototype.slice;

        function par(fn) {
            var args0 = slice.call(arguments, 1);
            return function() {
                var argsN = slice.call(arguments, 0),
                    args = [];
                args.push.apply(args, args0);
                args.push.apply(args, argsN);
                return fn.apply(this, args)
            }
        }

        function rpartial(fn) {
            var argsN = slice.call(arguments, 1);
            return function() {
                var args = slice.call(arguments, 0);
                args.push.apply(args, argsN);
                return fn.apply(this, args)
            }
        }
        par.rpartial = rpartial;
        par.lpartial = par;
        module.exports = par
    });
    require.register("ianstormtaylor-to-no-case/index.js", function(exports, require, module) {
        module.exports = toNoCase;
        var hasSpace = /\s/;
        var hasCamel = /[a-z][A-Z]/;
        var hasSeparator = /[\W_]/;

        function toNoCase(string) {
            if (hasSpace.test(string)) return string.toLowerCase();
            if (hasSeparator.test(string)) string = unseparate(string);
            if (hasCamel.test(string)) string = uncamelize(string);
            return string.toLowerCase()
        }
        var separatorSplitter = /[\W_]+(.|$)/g;

        function unseparate(string) {
            return string.replace(separatorSplitter, function(m, next) {
                return next ? " " + next : ""
            })
        }
        var camelSplitter = /(.)([A-Z]+)/g;

        function uncamelize(string) {
            return string.replace(camelSplitter, function(m, previous, uppers) {
                return previous + " " + uppers.toLowerCase().split("").join(" ")
            })
        }
    });
    require.register("ianstormtaylor-to-space-case/index.js", function(exports, require, module) {
        var clean = require("to-no-case");
        module.exports = toSpaceCase;

        function toSpaceCase(string) {
            return clean(string).replace(/[\W_]+(.|$)/g, function(matches, match) {
                return match ? " " + match : ""
            })
        }
    });
    require.register("ianstormtaylor-to-slug-case/index.js", function(exports, require, module) {
        var toSpace = require("to-space-case");
        module.exports = toSlugCase;

        function toSlugCase(string) {
            return toSpace(string).replace(/\s/g, "-")
        }
    });
    require.register("recurly/lib/index.js", function(exports, require, module) {
        var Recurly = require("./recurly");
        module.exports = exports = new Recurly;
        exports.Recurly = Recurly
    });
    require.register("recurly/lib/recurly.js", function(exports, require, module) {
        var bind = require("bind");
        var json = require("json");
        var each = require("each");
        var type = require("type");
        var merge = require("merge");
        var mixin = require("mixin");
        var jsonp = require("jsonp");
        var qs = require("querystring");
        var Emitter = require("emitter");
        var errors = require("./errors");
        var version = require("./version");
        var debug = require("debug")("recurly");
        var defaults = {
            currency: "USD",
            timeout: 6e4,
            publicKey: "",
            api: "https://api.recurly.com/js/v1"
        };
        var mixins = ["open", "coupon", "paypal", "plan", "tax", "token", "pricing", "validate"];
        module.exports = Recurly;

        function Recurly(options) {
            this.id = 0;
            this.version = version;
            this.configured = false;
            this.config = merge({}, defaults);
            if (options) this.configure(options)
        }
        Emitter(Recurly.prototype);
        Recurly.prototype.configure = function configure(options) {
            if (this.configured) throw errors("already-configured");
            debug("configure");
            if (type(options) === "string") options = {
                publicKey: options
            };
            if ("publicKey" in options) {
                this.config.publicKey = options.publicKey
            } else {
                throw errors("missing-public-key")
            } if ("api" in options) {
                this.config.api = options.api
            }
            if ("currency" in options) {
                this.config.currency = options.currency
            }
            this.configured = true
        };
        Recurly.prototype.url = function url(route) {
            return this.config.api + route
        };
        Recurly.prototype.request = function request(route, data, done) {
            debug("request");
            if (false === this.configured) {
                throw errors("not-configured")
            }
            if ("function" == type(data)) {
                done = data;
                data = {}
            }
            var url = this.url(route);
            var timeout = this.config.timeout;
            data.version = this.version;
            data.key = this.config.publicKey;
            url += "?" + qs.stringify(data);
            this.cache(url, function(res, set) {
                if (res) return done(null, res);
                jsonp(url, {
                    timeout: timeout
                }, function(err, res) {
                    if (err) return done(err);
                    if (res.error) {
                        done(errors("api-error", res.error))
                    } else {
                        done(null, set(res))
                    }
                })
            })
        };
        Recurly.prototype.cache = function cache(url, done) {
            debug("cache");
            var stored = localStorage.getItem(url);
            if (stored) {
                debug("cache found " + url);
                return done(json.parse(stored))
            } else {
                debug("cache set " + url);
                return done(null, set)
            }

            function set(obj) {
                return obj
            }
        };
        each(mixins, function(name) {
            mixin(Recurly.prototype, require("./recurly/" + name))
        })
    });
    require.register("recurly/lib/version.js", function(exports, require, module) {
        module.exports = "3.0.5"
    });
    require.register("recurly/lib/errors.js", function(exports, require, module) {
        var mixin = require("mixin");
        module.exports = exports = errors;

        function errors(name, options) {
            return errors.get(name, options)
        }
        errors.map = {};
        errors.baseURL = "";
        errors.doc = function(baseURL) {
            errors.baseURL = baseURL
        };
        errors.get = function(name, context) {
            if (!(name in errors.map)) {
                throw new Error("invalid error")
            } else {
                return new errors.map[name](context)
            }
        };
        errors.add = function(name, config) {
            config = config || {};

            function RecurlyError(context) {
                Error.call(this);
                this.name = this.code = name;
                this.message = config.message;
                mixin(this, context || {});
                if (config.help) {
                    this.help = errors.baseURL + config.help;
                    this.message += " (need help? " + this.help + ")"
                }
            }
            RecurlyError.prototype = new Error;
            return errors.map[name] = RecurlyError
        };
        errors.doc("https://docs.recurly.com/js");
        errors.add("already-configured", {
            message: "Configuration may only be set once.",
            help: "#identify-your-site"
        });
        errors.add("not-configured", {
            message: "Not configured. You must first call recurly.configure().",
            help: "#identify-your-site"
        });
        errors.add("missing-public-key", {
            message: "The publicKey setting is required.",
            help: "#identify-your-site"
        });
        errors.add("api-error", {
            message: "There was an error with your request."
        });
        errors.add("validation", {
            message: "There was an error validating your request."
        });
        errors.add("missing-callback", {
            message: "Missing callback"
        });
        errors.add("invalid-options", {
            message: "Options must be an object"
        });
        errors.add("missing-plan", {
            message: "A plan must be specified."
        });
        errors.add("missing-coupon", {
            message: "A coupon must be specified."
        });
        errors.add("invalid-item", {
            message: "The given item does not appear to be a valid recurly plan, coupon, addon, or taxable address."
        });
        errors.add("invalid-addon", {
            message: "The given addon_code is not among the valid addons for the specified plan."
        });
        errors.add("invalid-currency", {
            message: "The given currency is not among the valid codes for the specified plan."
        });
        errors.add("unremovable-item", {
            message: "The given item cannot be removed."
        })
    });
    require.register("recurly/lib/util/dom.js", function(exports, require, module) {
        var slug = require("to-slug-case");
        var type = require("type");
        var each = require("each");
        var map = require("map");
        module.exports = {
            element: element,
            value: value,
            data: data
        };

        function element(node) {
            var isJQuery = window.jQuery && node instanceof jQuery;
            var isArray = type(node) === "array";
            if (isJQuery || isArray) node = node[0];
            var isElem = typeof HTMLElement !== "undefined" ? node instanceof HTMLElement : node && node.nodeType === 1;
            return isElem && node
        }

        function value(node, value) {
            if (!element(node)) return null;
            return typeof value !== "undefined" ? valueSet(node, value) : valueGet(node)
        }

        function valueGet(node) {
            node = element(node);
            var nodeType = node && node.type && node.type.toLowerCase();
            var value;
            if (!nodeType) {
                value = ""
            } else if ("options" in node) {
                value = node.options[node.selectedIndex].value
            } else if (nodeType === "checkbox") {
                if (node.checked) value = node.value
            } else if (nodeType === "radio") {
                var radios = document.querySelectorAll('input[data-recurly="' + data(node, "recurly") + '"]');
                each(radios, function(radio) {
                    if (radio.checked) value = radio.value
                })
            } else if ("value" in node) {
                value = node.value
            }
            return value
        }

        function valueSet(nodes, value) {
            if (type(nodes) !== "array") nodes = [nodes];
            each(nodes, function(node) {
                if (!node) return;
                else if ("value" in node) node.value = value;
                else if ("textContent" in node) node.textContent = value;
                else if ("innerText" in node) node.innerText = value
            })
        }

        function data(node, key, value) {
            node = element(node);
            if (!node) return;
            return typeof value !== "undefined" ? dataSet(node, key, value) : dataGet(node, key)
        }

        function dataGet(node, key) {
            return node.dataset ? node.dataset[key] : node.getAttribute("data-" + slug(key))
        }

        function dataSet(node, key, value) {
            if (node.dataset) node.dataset[key] = value;
            else node.setAttribute("data-" + slug(key), value)
        }
    });
    require.register("recurly/lib/util/parse-card.js", function(exports, require, module) {
        module.exports = function parseCard(number) {
            return number && number.toString().replace(/[-\s]/g, "")
        }
    });
    require.register("recurly/lib/recurly/open.js", function(exports, require, module) {
        var bind = require("bind");
        var type = require("type");
        var json = require("json");
        var events = require("event");
        var qs = require("querystring");
        var errors = require("../errors");
        var debug = require("debug")("recurly:open");
        exports.open = function(url, data, done) {
            debug("open");
            if (false === this.configured) {
                throw errors("not-configured")
            }
            if ("function" == type(data)) {
                done = data;
                data = {}
            }
            data = data || {};
            data.version = this.version;
            data.event = "recurly-open-" + this.id++;
            data.key = this.config.publicKey;
            this.once(data.event, done);
            if (!/^https?:\/\//.test(url)) url = this.url(url);
            url += (~url.indexOf("?") ? "&" : "?") + qs.stringify(data);
            this.relay(function() {
                window.open(url)
            })
        };
        exports.relay = function(done) {
            var self = this;
            if (false === this.configured) {
                throw errors("not-configured")
            }
            events.bind(window, "message", function listener(event) {
                var data = json.parse(event.data);
                var name = data.recurly_event;
                var body = data.recurly_message;
                var err = body.error ? errors("api-error", body.error) : null;
                events.unbind(window, "message", listener);
                if (name) self.emit(name, err, body);
                if (frame) document.body.removeChild(frame)
            });
            if ("documentMode" in document) {
                var frame = document.createElement("iframe");
                frame.width = frame.height = 0;
                frame.src = this.url("/relay");
                frame.name = "recurly-relay";
                frame.style.display = "none";
                frame.onload = bind(this, done);
                document.body.appendChild(frame)
            } else {
                done()
            }
        }
    });
    require.register("recurly/lib/recurly/coupon.js", function(exports, require, module) {
        var type = require("type");
        var debug = require("debug")("recurly:coupon");
        var errors = require("../errors");
        exports.coupon = function(options, callback) {
            debug("%j", options);
            if ("function" !== type(callback)) {
                throw errors("missing-callback")
            }
            if ("object" !== type(options)) {
                throw errors("invalid-options")
            }
            if (!("plan" in options)) {
                throw errors("missing-plan")
            }
            if (!("coupon" in options)) {
                throw errors("missing-coupon")
            }
            this.request("/plans/" + options.plan + "/coupons/" + options.coupon, options, callback)
        }
    });
    require.register("recurly/lib/recurly/paypal.js", function(exports, require, module) {
        var debug = require("debug")("recurly:paypal");
        exports.paypal = function(data, done) {
            debug("start");
            this.open("/paypal/start", data, done)
        }
    });
    require.register("recurly/lib/recurly/plan.js", function(exports, require, module) {
        var type = require("type");
        var debug = require("debug")("recurly:plan");
        exports.plan = function(code, callback) {
            debug("%s", code);
            if ("function" != type(callback)) {
                throw new Error("Missing callback")
            }
            if ("undefined" == type(code)) {
                return callback(new Error("Missing plan code"))
            }
            this.request("/plans/" + code, callback)
        }
    });
    require.register("recurly/lib/recurly/tax.js", function(exports, require, module) {
        var type = require("type");
        var clone = require("clone");
        var debug = require("debug")("recurly:tax");
        exports.tax = function(options, callback) {
            var request = clone(options);
            if ("function" != type(callback)) {
                throw new Error("Missing callback")
            }
            if (!("currency" in request)) {
                request.currency = this.config.currency
            }
            this.request("/tax", request, callback)
        }
    });
    require.register("recurly/lib/recurly/token.js", function(exports, require, module) {
        var bind = require("bind");
        var each = require("each");
        var type = require("type");
        var index = require("indexof");
        var debug = require("debug")("recurly:token");
        var dom = require("../util/dom");
        var parseCard = require("../util/parse-card");
        var errors = require("../errors");
        var fields = ["first_name", "last_name", "number", "month", "year", "cvv", "address1", "address2", "country", "city", "state", "postal_code", "phone", "vat_number", "token"];
        exports.token = function(options, done) {
            var open = bind(this, this.open);
            var data = normalize(options);
            var input = data.values;
            var userErrors = validate.call(this, input);
            if ("function" !== type(done)) {
                throw errors("missing-callback")
            }
            if (userErrors.length) {
                return done(errors("validation", {
                    fields: userErrors
                }))
            }
            this.request("/token", input, function(err, res) {
                if (err) return done(err);
                if (data.fields.token && res.id) {
                    data.fields.token.value = res.id
                }
                done(null, res)
            })
        };

        function normalize(options) {
            var el = dom.element(options);
            var data = {
                fields: {},
                values: {}
            };
            if (el && "form" === el.nodeName.toLowerCase()) {
                each(el.querySelectorAll("[data-recurly]"), function(field) {
                    var name = dom.data(field, "recurly");
                    if (~index(fields, name)) {
                        data.fields[name] = field;
                        data.values[name] = dom.value(field)
                    }
                })
            } else {
                data.values = options
            }
            data.values.number = parseCard(data.values.number);
            return data
        }

        function validate(input) {
            var errors = [];
            if (!this.validate.cardNumber(input.number)) {
                errors.push("number")
            }
            if (!this.validate.expiry(input.month, input.year)) {
                errors.push("month", "year")
            }
            if (!input.first_name) {
                errors.push("first_name")
            }
            if (!input.last_name) {
                errors.push("last_name")
            }
            return errors
        }
    });
    require.register("recurly/lib/recurly/validate.js", function(exports, require, module) {
        var find = require("find");
        var trim = require("trim");
        var index = require("indexof");
        var parseCard = require("../util/parse-card");
        var types = [{
            type: "discover",
            pattern: /^(6011|622|64[4-9]|65)/,
            lengths: [16]
        }, {
            type: "master",
            pattern: /^5[0-5]/,
            lengths: [16]
        }, {
            type: "american_express",
            pattern: /^3[47]/,
            lengths: [15]
        }, {
            type: "visa",
            pattern: /^4/,
            lengths: [13, 16]
        }, {
            type: "jcb",
            pattern: /^35[2-8]\d/,
            lengths: [16]
        }, {
            type: "diners_club",
            pattern: /^(30[0-5]|309|36|3[89]|54|55|2014|2149)/,
            lengths: [14]
        }];
        exports.validate = {
            cardNumber: function(number) {
                var str = parseCard(number);
                var ca, sum = 0,
                    mul = 1;
                var i = str.length;
                while (i--) {
                    ca = parseInt(str.charAt(i), 10) * mul;
                    sum += ca - (ca > 9) * 9;
                    mul ^= 3
                }
                return sum % 10 === 0 && sum > 0
            },
            cardType: function(number) {
                var str = parseCard(number);
                var card = find(types, function(card) {
                    return card.pattern.test(str) && ~index(card.lengths, str.length)
                });
                return card && card.type || "unknown"
            },
            expiry: function(month, year) {
                month = parseInt(month, 10) - 1;
                if (month < 0 || month > 11) return false;
                year = parseInt(year, 10);
                year += year < 100 ? 2e3 : 0;
                var expiry = new Date;
                expiry.setYear(year);
                expiry.setDate(1);
                expiry.setHours(0);
                expiry.setMinutes(0);
                expiry.setSeconds(0);
                expiry.setMonth(month + 1);
                return new Date < expiry
            },
            cvv: function(number) {
                number = trim(number + "");
                return /^\d+$/.test(number) && (number.length === 3 || number.length === 4)
            }
        }
    });
    require.register("recurly/lib/recurly/pricing/index.js", function(exports, require, module) {
        var Emitter = require("emitter");
        var index = require("indexof");
        var each = require("each");
        var type = require("type");
        var bind = require("bind");
        var find = require("find");
        var mixin = require("mixin");
        var keys = require("object").keys;
        var json = require("json");
        var debug = require("debug")("recurly:pricing");
        var PricingPromise = require("./promise");
        var Calculations = require("./calculations");
        var errors = require("../../errors");
        exports.Pricing = Pricing;

        function Pricing(recurly) {
            if (this instanceof require("../../recurly")) return new Pricing(this);
            this.recurly = recurly;
            this.reset()
        }
        Emitter(Pricing.prototype);
        Pricing.properties = ["plan", "addon", "coupon", "address", "currency"];
        Pricing.prototype.reset = function() {
            this.items = {};
            this.items.addons = [];
            this.currency(this.recurly.config.currency)
        };
        Pricing.prototype.remove = function(opts, done) {
            var self = this;
            var item;
            debug("remove");
            return new PricingPromise(function(resolve, reject) {
                var prop = keys(opts)[0];
                var id = opts[prop];
                if (!~index(Pricing.properties, prop)) return reject(errors("invalid-item"));
                if (prop === "addon") {
                    var pos = index(self.items.addons, findAddon(self.items.addons, {
                        code: id
                    }));
                    if (~pos) {
                        item = self.items.addons.splice(pos)
                    }
                } else if (self.items[prop] && (id === self.items[prop].code || id === true)) {
                    item = self.items[prop];
                    delete self.items[prop]
                } else {
                    return reject(errors("unremovable-item", {
                        type: prop,
                        id: id,
                        reason: "does not exist on this pricing instance."
                    }))
                }
            }, this).nodeify(done)
        };
        Pricing.prototype.reprice = function(done) {
            var self = this;
            debug("reprice");
            return new PricingPromise(function(resolve, reject) {
                if (!self.items.plan) return reject(errors("missing-plan"));
                Calculations(self, function(price) {
                    if (json.stringify(price) === json.stringify(self.price)) return resolve(price);
                    self.price = price;
                    self.emit("change", price);
                    resolve(price)
                })
            }, this).nodeify(done)
        };
        Pricing.prototype.plan = function(planCode, meta, done) {
            var self = this;
            var plan = this.items.plan;
            var quantity;
            if (type(meta) === "function") {
                done = meta;
                meta = undefined
            }
            meta = meta || {};
            if (plan && plan.quantity) quantity = plan.quantity;
            if (meta.quantity) quantity = parseInt(meta.quantity, 10);
            if (!quantity || quantity < 1) quantity = 1;
            return new PricingPromise(function(resolve, reject) {
                if (plan && plan.code === planCode) {
                    plan.quantity = quantity;
                    return resolve(plan)
                }
                self.recurly.plan(planCode, function(err, plan) {
                    if (err) return reject(err);
                    plan.quantity = quantity;
                    self.items.plan = plan;
                    if (!(self.items.currency in plan.price)) {
                        self.currency(keys(plan.price)[0])
                    }
                    debug("set.plan");
                    self.emit("set.plan", plan);
                    resolve(plan)
                })
            }, this).nodeify(done)
        };
        Pricing.prototype.addon = function(addonCode, meta, done) {
            var self = this;
            if (type(meta) === "function") {
                done = meta;
                meta = undefined
            }
            meta = meta || {};
            return new PricingPromise(function(resolve, reject) {
                if (!self.items.plan) return reject(errors("missing-plan"));
                var planAddon = findAddon(self.items.plan.addons, addonCode);
                if (!planAddon) {
                    return reject(errors("invalid-addon", {
                        planCode: self.items.plan.code,
                        addonCode: addonCode
                    }))
                }
                var quantity = addonQuantity(meta, planAddon);
                var addon = findAddon(self.items.addons, addonCode);
                if (quantity === 0) {
                    self.remove({
                        addon: addonCode
                    })
                }
                if (addon) {
                    addon.quantity = quantity
                } else {
                    addon = json.parse(json.stringify(planAddon));
                    addon.quantity = quantity;
                    self.items.addons.push(addon)
                }
                debug("set.addon");
                self.emit("set.addon", addon);
                resolve(addon)
            }, this).nodeify(done)
        };
        Pricing.prototype.coupon = function(couponCode, done) {
            var self = this;
            var coupon = this.items.coupon;
            return new PricingPromise(function(resolve, reject) {
                if (!self.items.plan) return reject(errors("missing-plan"));
                if (coupon) {
                    if (coupon.code === couponCode) return resolve(coupon);
                    else self.remove({
                        coupon: coupon.code
                    })
                }
                if (!couponCode) return resolve();
                self.recurly.coupon({
                    plan: self.items.plan.code,
                    coupon: couponCode
                }, function(err, coupon) {
                    if (err && err.code !== "not_found") return reject(err);
                    self.items.coupon = coupon;
                    debug("set.coupon");
                    self.emit("set.coupon", coupon);
                    resolve(coupon)
                })
            }, this).nodeify(done)
        };
        Pricing.prototype.address = function(address, done) {
            var self = this;
            return new PricingPromise(function(resolve, reject) {
                if (json.stringify(address) === json.stringify(self.items.address)) {
                    return resolve(self.items.address)
                }
                self.items.address = address;
                debug("set.address");
                self.emit("set.address", address);
                resolve(address)
            }, this).nodeify(done)
        };
        Pricing.prototype.currency = function(code, done) {
            var self = this;
            var plan = this.items.plan;
            var currency = this.items.currency;
            return new PricingPromise(function(resolve, reject) {
                if (currency === code) return resolve(currency);
                if (plan && !(code in plan.price)) {
                    return reject(errors("invalid-currency", {
                        currencyCode: code,
                        planCurrencies: keys(plan.price)
                    }))
                }
                self.items.currency = code;
                debug("set.currency");
                self.emit("set.currency", code);
                resolve(code)
            }, this).nodeify(done)
        };
        mixin(Pricing.prototype, require("./attach"));

        function addonQuantity(meta, planAddon) {
            var qty = 1;
            if ("quantity" in planAddon) qty = planAddon.quantity;
            if ("quantity" in meta) qty = meta.quantity;
            return parseInt(qty, 10) || 0
        }

        function findAddon(addons, code) {
            return addons && find(addons, {
                code: code
            })
        }
    });
    require.register("recurly/lib/recurly/pricing/promise.js", function(exports, require, module) {
        var Promise = require("promise");
        var mixin = require("mixin");
        var bind = require("bind");
        var each = require("each");
        var type = require("type");
        var par = require("par");
        var debug = require("debug")("recurly:pricing:promise");
        module.exports = PricingPromise;

        function PricingPromise(resolver, pricing) {
            if (!(this instanceof PricingPromise)) return new PricingPromise(resolver, pricing);
            var self = this;
            this.pricing = pricing;
            this.constructor = par.rpartial(this.constructor, pricing);
            Promise.call(this, resolver);
            each(require("./").Pricing.prototype, function(method) {
                self[method] = function() {
                    var args = arguments;
                    return self.then(function() {
                        return self.pricing[method].apply(self.pricing, args)
                    })
                }
            })
        }
        mixin(PricingPromise.prototype, Promise.prototype);
        PricingPromise.prototype.constructor = PricingPromise;
        PricingPromise.prototype.done = function() {
            Promise.prototype.done.apply(this.then(this.reprice), arguments);
            return this.pricing
        };
        PricingPromise.prototype.nodeify = function(done) {
            if (type(done) === "function") this.reprice();
            return Promise.prototype.nodeify.apply(this, arguments)
        }
    });
    require.register("recurly/lib/recurly/pricing/calculations.js", function(exports, require, module) {
        var each = require("each");
        var bind = require("bind");
        var find = require("find");
        module.exports = Calculations;

        function Calculations(pricing, done) {
            if (!(this instanceof Calculations)) {
                return new Calculations(pricing, done)
            }
            this.pricing = pricing;
            this.items = pricing.items;
            this.price = {
                now: {},
                next: {},
                addons: {},
                currency: {
                    code: this.items.currency,
                    symbol: this.planPrice().symbol
                }
            };
            this.subtotal();
            this.tax(function() {
                this.total();
                each(this.price.now, decimal, this.price.now);
                each(this.price.next, decimal, this.price.next);
                each(this.price.addons, decimal, this.price.addons);
                done(this.price)
            })
        }
        Calculations.prototype.subtotal = function() {
            var subtotal = this.planPrice().amount;
            this.price.now.subtotal = subtotal;
            this.price.next.subtotal = subtotal;
            if (this.items.plan.trial) this.price.now.subtotal = 0;
            this.addons();
            this.price.now.subtotal += this.price.now.addons;
            this.price.next.subtotal += this.price.next.addons;
            this.discount();
            this.price.now.subtotal -= this.price.now.discount;
            this.price.next.subtotal -= this.price.next.discount;
            this.setupFee();
            this.price.now.subtotal += this.price.now.setupFee
        };
        Calculations.prototype.tax = function(done) {
            this.price.now.tax = 0;
            this.price.next.tax = 0;
            if (this.items.address) {
                var self = this;
                this.pricing.recurly.tax(this.items.address, function applyTax(err, taxes) {
                    if (err) {
                        self.pricing.emit("error", err)
                    } else {
                        each(taxes, function(tax) {
                            if (tax.type === "usst" && self.items.plan.tax_exempt) return;
                            self.price.now.tax += self.price.now.subtotal * tax.rate;
                            self.price.next.tax += self.price.next.subtotal * tax.rate
                        });
                        self.price.now.tax = Math.ceil(self.price.now.tax * 100) / 100;
                        self.price.next.tax = Math.ceil(self.price.next.tax * 100) / 100
                    }
                    done.call(self)
                })
            } else done.call(this)
        };
        Calculations.prototype.total = function() {
            this.price.now.total = this.price.now.subtotal + this.price.now.tax;
            this.price.next.total = this.price.next.subtotal + this.price.next.tax
        };
        Calculations.prototype.addons = function() {
            this.price.now.addons = 0;
            this.price.next.addons = 0;
            each(this.items.plan.addons, function(addon) {
                var price = addon.price[this.items.currency].unit_amount;
                this.price.addons[addon.code] = price;
                var selected = find(this.items.addons, {
                    code: addon.code
                });
                if (selected) {
                    price = price * selected.quantity;
                    if (!this.items.plan.trial) this.price.now.addons += price;
                    this.price.next.addons += price
                }
            }, this)
        };
        Calculations.prototype.discount = function() {
            var coupon = this.items.coupon;
            this.price.now.discount = 0;
            this.price.next.discount = 0;
            if (coupon) {
                if (coupon.discount.rate) {
                    this.price.now.discount = Math.round(this.price.now.subtotal * coupon.discount.rate * 100) / 100;
                    this.price.next.discount = Math.round(this.price.next.subtotal * coupon.discount.rate * 100) / 100
                } else {
                    this.price.now.discount = coupon.discount.amount[this.items.currency];
                    this.price.next.discount = coupon.discount.amount[this.items.currency]
                }
            }
        };
        Calculations.prototype.setupFee = function() {
            this.price.now.setupFee = this.planPrice().setup_fee
        };
        Calculations.prototype.planPrice = function() {
            var plan = this.items.plan;
            var price = plan.price[this.items.currency];
            price.amount = price.unit_amount * (plan.quantity || 1);
            return price
        };

        function decimal(prop) {
            this[prop] = (Math.round(Math.max(this[prop], 0) * 100) / 100).toFixed(2)
        }
    });
    require.register("recurly/lib/recurly/pricing/attach.js", function(exports, require, module) {
        var each = require("each");
        var events = require("event");
        var find = require("find");
        var type = require("type");
        var dom = require("../../util/dom");
        var debug = require("debug")("recurly:pricing:attach");
        exports.attach = function(el) {
            var self = this;
            var elems = {};
            var el = dom.element(el);
            if (!el) throw new Error("invalid dom element");
            if (this.attach.detatch) this.attach.detatch();
            self.on("change", update);
            each(el.querySelectorAll("[data-recurly]"), function(elem) {
                if (dom.data(elem, "recurly") === "zip") dom.data(elem, "recurly", "postal_code");
                var name = dom.data(elem, "recurly");
                if (!elems[name]) elems[name] = [];
                elems[name].push(elem);
                events.bind(elem, "change", change);
                events.bind(elem, "propertychange", change)
            });
            this.attach.detatch = detatch;
            change();

            function change(event) {
                debug("change");
                var targetName = event && event.target && dom.data(event.target, "recurly");
                targetName = targetName || window.event && window.event.srcElement;
                var pricing = self.plan(dom.value(elems.plan), {
                    quantity: dom.value(elems.plan_quantity)
                });
                if (target("currency")) {
                    pricing = pricing.currency(dom.value(elems.currency))
                }
                if (target("addon") && elems.addon) {
                    addons()
                }
                if (target("coupon") && elems.coupon) {
                    pricing = pricing.coupon(dom.value(elems.coupon)).then(null, ignoreBadCoupons)
                }
                if (target("country") || target("postal_code") || target("vat_number")) {
                    pricing = pricing.address({
                        country: dom.value(elems.country),
                        postal_code: dom.value(elems.postal_code),
                        vat_number: dom.value(elems.vat_number)
                    })
                }
                pricing.done();

                function addons() {
                    each(elems.addon, function(node) {
                        var plan = self.items.plan;
                        var addonCode = dom.data(node, "recurlyAddon");
                        if (plan.addons && find(plan.addons, {
                            code: addonCode
                        })) {
                            pricing = pricing.addon(addonCode, {
                                quantity: dom.value(node)
                            })
                        }
                    })
                }

                function target(name) {
                    if (!targetName) return true;
                    if (targetName === name) return true;
                    return false
                }
            }

            function update(price) {
                dom.value(elems.currency_code, price.currency.code);
                dom.value(elems.currency_symbol, price.currency.symbol);
                each(["addons", "discount", "setup_fee", "subtotal", "tax", "total"], function(value) {
                    dom.value(elems[value + "_now"], price.now[value]);
                    dom.value(elems[value + "_next"], price.next[value])
                });
                if (elems.addonPrice) {
                    each(elems.addonPrice, function(elem) {
                        var addonPrice = price.addons[dom.data(elem, "recurlyAddon")];
                        if (addonPrice) dom.value(elem, addonPrice)
                    })
                }
            }

            function detatch() {
                each(elems, function(name, elems) {
                    each(elems, function(elem) {
                        events.unbind(elem, "change", change);
                        events.unbind(elem, "propertychange", change)
                    }, this)
                }, this)
            }
        };

        function ignoreBadCoupons(err) {
            if (err.code === "not-found") return;
            else throw err
        }
        exports.binding = exports.attach
    });
    require.alias("visionmedia-node-querystring/index.js", "recurly/deps/querystring/index.js");
    require.alias("visionmedia-node-querystring/index.js", "querystring/index.js");
    require.alias("component-emitter/index.js", "recurly/deps/emitter/index.js");
    require.alias("component-emitter/index.js", "emitter/index.js");
    require.alias("component-indexof/index.js", "recurly/deps/indexof/index.js");
    require.alias("component-indexof/index.js", "indexof/index.js");
    require.alias("component-object/index.js", "recurly/deps/object/index.js");
    require.alias("component-object/index.js", "object/index.js");
    require.alias("component-event/index.js", "recurly/deps/event/index.js");
    require.alias("component-event/index.js", "event/index.js");
    require.alias("component-clone/index.js", "recurly/deps/clone/index.js");
    require.alias("component-clone/index.js", "clone/index.js");
    require.alias("component-type/index.js", "component-clone/deps/type/index.js");
    require.alias("component-bind/index.js", "recurly/deps/bind/index.js");
    require.alias("component-bind/index.js", "bind/index.js");
    require.alias("component-each/index.js", "recurly/deps/each/index.js");
    require.alias("component-each/index.js", "each/index.js");
    require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
    require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
    require.alias("component-type/index.js", "component-each/deps/type/index.js");
    require.alias("component-find/index.js", "recurly/deps/find/index.js");
    require.alias("component-find/index.js", "find/index.js");
    require.alias("component-to-function/index.js", "component-find/deps/to-function/index.js");
    require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
    require.alias("component-json/index.js", "recurly/deps/json/index.js");
    require.alias("component-json/index.js", "json/index.js");
    require.alias("component-type/index.js", "recurly/deps/type/index.js");
    require.alias("component-type/index.js", "type/index.js");
    require.alias("component-trim/index.js", "recurly/deps/trim/index.js");
    require.alias("component-trim/index.js", "trim/index.js");
    require.alias("component-map/index.js", "recurly/deps/map/index.js");
    require.alias("component-map/index.js", "map/index.js");
    require.alias("component-to-function/index.js", "component-map/deps/to-function/index.js");
    require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
    require.alias("yields-merge/index.js", "recurly/deps/merge/index.js");
    require.alias("yields-merge/index.js", "merge/index.js");
    require.alias("learnboost-jsonp/index.js", "recurly/deps/jsonp/index.js");
    require.alias("learnboost-jsonp/index.js", "recurly/deps/jsonp/index.js");
    require.alias("learnboost-jsonp/index.js", "jsonp/index.js");
    require.alias("visionmedia-debug/debug.js", "learnboost-jsonp/deps/debug/debug.js");
    require.alias("visionmedia-debug/debug.js", "learnboost-jsonp/deps/debug/index.js");
    require.alias("visionmedia-debug/debug.js", "visionmedia-debug/index.js");
    require.alias("learnboost-jsonp/index.js", "learnboost-jsonp/index.js");
    require.alias("visionmedia-debug/debug.js", "recurly/deps/debug/debug.js");
    require.alias("visionmedia-debug/debug.js", "recurly/deps/debug/index.js");
    require.alias("visionmedia-debug/debug.js", "debug/index.js");
    require.alias("visionmedia-debug/debug.js", "visionmedia-debug/index.js");
    require.alias("chrissrogers-promise/index.js", "recurly/deps/promise/index.js");
    require.alias("chrissrogers-promise/core.js", "recurly/deps/promise/core.js");
    require.alias("chrissrogers-promise/index.js", "promise/index.js");
    require.alias("johntron-asap/asap.js", "chrissrogers-promise/deps/asap/asap.js");
    require.alias("johntron-asap/asap.js", "chrissrogers-promise/deps/asap/index.js");
    require.alias("johntron-asap/asap.js", "johntron-asap/index.js");
    require.alias("kewah-mixin/index.js", "recurly/deps/mixin/index.js");
    require.alias("kewah-mixin/index.js", "recurly/deps/mixin/index.js");
    require.alias("kewah-mixin/index.js", "mixin/index.js");
    require.alias("kewah-mixin/index.js", "kewah-mixin/index.js");
    require.alias("pluma-par/dist/par.js", "recurly/deps/par/dist/par.js");
    require.alias("pluma-par/dist/par.js", "recurly/deps/par/index.js");
    require.alias("pluma-par/dist/par.js", "par/index.js");
    require.alias("pluma-par/dist/par.js", "pluma-par/index.js");
    require.alias("ianstormtaylor-to-slug-case/index.js", "recurly/deps/to-slug-case/index.js");
    require.alias("ianstormtaylor-to-slug-case/index.js", "to-slug-case/index.js");
    require.alias("ianstormtaylor-to-space-case/index.js", "ianstormtaylor-to-slug-case/deps/to-space-case/index.js");
    require.alias("ianstormtaylor-to-no-case/index.js", "ianstormtaylor-to-space-case/deps/to-no-case/index.js");
    require.alias("recurly/lib/index.js", "recurly/index.js");
    if (typeof exports == "object") {
        module.exports = require("recurly")
    } else if (typeof define == "function" && define.amd) {
        define([], function() {
            return require("recurly")
        })
    } else {
        this["recurly"] = require("recurly")
    }
})();