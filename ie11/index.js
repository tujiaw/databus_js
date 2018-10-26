(function (global, factory) {
  /* CommonJS */
  if (typeof require === 'function' && typeof module === "object" && module && module["exports"])
    module['exports'] = (function () {
      return factory(require('./cbusCore'));
    })();
  /* Global */
  else
    global["cbus"] = factory(global.CBusCore);
})(this, function (CBusCore) {
  const CmdParse = function () {
    this.commandCache = {}
  }
  const cmdParse = new CmdParse();

  'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ClientBus = function () {
  function ClientBus() {
    _classCallCheck(this, ClientBus);

    this._cbusCore = new CBusCore(cmdParse); // 通信核心
    this._wsurlList = []; // 连接地址列表
    this._lastConnectUrl = ''; // 最后一次连接的地址
    this._subscribeList = []; // 订阅列表
    this._publishCallback = null; // 推送消息回调
    this._subIdStart = 123; // 订阅ID的起始值
    this._clientName = 'test'; // 客户端名字
    this._heartBeatTimer = 0; // 心跳ID
    this._hearBeatIntervalSecond = 5; // 心跳间隔5秒
    this._sendqueue = 0; // 发送的消息数
    this._receivequeue = 0; // 接收的消息树
    this._event = { // 网络事件回调
      onConnectSuccess: function onConnectSuccess() {},
      onConnectClose: function onConnectClose() {},
      onConnectError: function onConnectError() {}
    };
    this._onRegisterService = function (data) {
      console.log('register service:' + JSON.stringify(data));
      var content = data.content;
      if (content) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = content.functions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var func = _step.value;

            var protoFileName = func.substring(0, func.indexOf('.')).toLowerCase();
            cmdParse.register(func, content.serviceid, protoFileName);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    };
    cmdParse.init();
  }

  /**
   * 设置客户端名称，作为登录的信息
   * 
   * @param {string} name 
   * @memberof ClientBus
   */


  _createClass(ClientBus, [{
    key: 'setClientName',
    value: function setClientName(name) {
      this._clientName = name;
    }

    /**
     * 设置心跳间隔时间秒数
     * 
     * @param {number} second 
     * @memberof ClientBus
     */

  }, {
    key: 'setHeartBeatIntervalSecond',
    value: function setHeartBeatIntervalSecond(second) {
      this._hearBeatIntervalSecond = second;
    }

    /**
     * 设置proto文件所在目录，默认在同级目录下的protobuf目录
     * 
     * @param {string} dir 
     * @memberof ClientBus
     */

  }, {
    key: 'setProtoFileDir',
    value: function setProtoFileDir(dir) {
      this._cbusCore.setProtoFileDir(dir);
    }

    /**
     * react native需要将proto文件转换为json给protobufjs使用（非react native不需要调用此接口）
     * 
     * @param {array} jsonObjList [{name: name, json: require('./protobuf/msgexpress.json')}]
     * @memberof ClientBus
     */

  }, {
    key: 'initProtoJson',
    value: function initProtoJson(jsonObjList) {
      var _this = this;

      jsonObjList.forEach(function (item) {
        if (item.name && item.json) {
          _this._cbusCore.addProtoBuilder(item.name, item.json);
        }
      });
    }

    /**
     * 设置应答超时
     * 
     * @param {number} [second=10] 
     * @memberof ClientBus
     */

  }, {
    key: 'setResponseTimeoutSecond',
    value: function setResponseTimeoutSecond() {
      var second = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;

      this._cbusCore.setResponseTimeoutSecond(second);
    }

    /**
     * 设置网络事件回调
     * 
     * @param {() => {})} onopen 网络连接成功回调
     * @param {(event) => {})} onclose 网络关闭回调
     * @param {(event) => {})} onerror 网络出错回调
     * @memberof ClientBus
     */

  }, {
    key: 'setEvent',
    value: function setEvent(onopen, onclose, onerror) {
      if (onopen && typeof onopen !== 'function') {
        throw new TypeError('onopen must be a function');
      }
      if (onclose && typeof onclose !== 'function') {
        throw new TypeError('onclose must be a function');
      }
      if (onerror && typeof onerror !== 'function') {
        throw new TypeError('onerror must be a function');
      }
      this._event.onConnectSuccess = onopen;
      this._event.onConnectClose = onclose;
      this._event.onConnectError = onerror;
    }

    /**
     * 设置推送回调
     * 
     * @param {function} onpublish = function({ topic: '', request: '', response: '', old: false, content: {}}) {}
     * @memberof ClientBus
     */

  }, {
    key: 'setPublish',
    value: function setPublish(onpublish) {
      if (typeof onpublish !== 'function') {
        throw new TypeError('onpublish must be a function');
      }
      this._publishCallback = onpublish;
    }

    /**
     * 创建一个新的连接对象
     * 
     * @returns 
     * @memberof ClientBus
     */

  }, {
    key: 'newBus',
    value: function newBus() {
      return new ClientBus();
    }

    /**
     * 打开连接，登录总线，使用多个IP进行尝试，如果都失败才返回失败
     * 
     * @param {string} wsip 地址
     * @param {string | number} wsport 端口
     * @param {string} [wspath=''] 路径
     * @returns Promise
     * @memberof ClientBus
     */

  }, {
    key: 'open',
    value: function open(wsurl, subcribeList) {
      var _this2 = this;

      var self = this;
      this._wsurlList = isArray(wsurl) ? wsurl : [wsurl];
      this._subscribeList = subcribeList || [];

      /**
       * 连接总线，登录总线，订阅
       */
      var go = function go() {
        return new Promise(function (resolve, reject) {
          _this2._cbusCore.connect(_this2.pickUrl(), {
            onConnectSuccess: function onConnectSuccess() {
              self._cbusCore.setConnectOptions(self._event);
              self._event.onConnectSuccess();
              self._cbusCore.setPushDataFactory(function (topic, content) {
                self.dispatchPublishMessage(topic, content);
              });
              self.loginBus().then(function (json) {
                if (self._subscribeList.length === 0) {
                  return resolve(json);
                } else {
                  self.subscribe(self._subscribeList).then(function (json) {
                    if (json.retcode === 0) {
                      return resolve(json);
                    }
                    return reject(json.msg && json.msg.length ? json.msg : 'subscribe failed');
                  }).catch(function (err) {
                    return reject(err);
                  });
                }
              }).catch(function (err) {
                return reject(err);
              });
            },
            onConnectError: function onConnectError(err) {
              self._cbusCore.setConnectOptions(self._event);
              self._event.onConnectError(err);
              return reject(err);
            },
            onConnectClose: function onConnectClose(err) {
              self._cbusCore.setConnectOptions(self._event);
              self._event.onConnectClose(err);
              return reject(err);
            }
          });
        });
      };

      /**
       * 递归调用IP列表进行登录
       * 
       * @param {number} failedCount 
       * @param {string} failedMsg 
       */
      var loop = function loop(failedCount, failedMsg) {
        self._cbusCore.close();
        if (failedCount >= self._wsurlList.length) {
          return Promise.reject(failedMsg);
        } else {
          return go().then(function () {
            self.startHeartBeat();
            return Promise.resolve('success');
          }).catch(function (msg) {
            return loop(++failedCount, msg);
          });
        }
      };
      return loop(0);
    }

    /**
     * 获取网络连接状态
     * 
     * @returns number 0(CONNECTING), 1(OPEN）, 2(CLOSING), 3(CLOSED)
     * @memberof ClientBus
     */

  }, {
    key: 'readyState',
    value: function readyState() {
      return this._cbusCore.readyState();
    }

    /**
     * 关闭心跳和连接
     * 
     * @memberof ClientBus
     */

  }, {
    key: 'close',
    value: function close() {
      this.closeHeartBeat();
      this._cbusCore.close();
    }

    /**
     * 登录总线，open成功后会自动登录，一般情况下用户不需要调用
     * 
     * @returns promise MsgExpress.LoginResponse
     * @memberof ClientBus
     */

  }, {
    key: 'loginBus',
    value: function loginBus() {
      var loginData = {
        type: 1,
        name: this._clientName,
        group: 1,
        uuid: guid(),
        starttime: new Date().getTime(),
        auth: 'test'
      };
      return this.post('MsgExpress.LoginInfo', loginData);
    }

    /**
     * 批量订阅，支持新旧两种方式
     * 
     * @param {array} protoList 请求和应答用逗号分隔，number表示老的订阅方式，['Trade.Trade, MsgExpress.CommonResponse', 267386881]
     * @param {(data) => {}} publishCallback data={topic: string, request: string, response: string, old: bool, content: jsonObject}
     * @returns promise MsgExpress.CommonResponse
     * @memberof ClientBus
     */

  }, {
    key: 'subscribe',
    value: function subscribe(protoList) {
      var _this3 = this;

      return this._cbusCore.buildProtoObject("msgexpress", "MsgExpress.SubscribeData").then(function (obj) {
        var objList = [];
        for (var i = 0, count = protoList.length; i < count; i++) {
          var cmd = 0;
          if (isNaN(protoList[i])) {
            // proto中的协议名，新的订阅方式，如：StockServer.StockDataRequest, StockServer.StockDataResponse
            var arr = protoList[i].split(',');
            if (arr.length >= 1) {
              cmd = cmdParse.getCommand(arr[0].trim());
            } else {
              console.error('subscribe params error', protoList[i]);
            }
          } else {
            // Number老的订阅方式，如：267386881
            cmd = protoList[i];
          }
          if (cmd) {
            var newObj = JSON.parse(JSON.stringify(obj));
            newObj.subid = _this3._subIdStart++;
            newObj.topic = cmd;
            objList.push(newObj);
          }
        }
        return _this3.post("MsgExpress.ComplexSubscribeData", {
          sub: objList
        });
      });
    }

    /**
     * 发送消息
     * 
     * @param {string} protoRequest 请求协议名
     * @param {string} protoResponse 应答协议名
     * @param {object} requestObj 请求传入的数据，结构对应请求的协议名
     * @returns promise protoResponse对应的结构
     * @memberof ClientBus
     */

  }, {
    key: 'post',
    value: function post(protoRequest, requestObj) {
      return this.postProto(cmdParse.getProtoFileName(protoRequest), protoRequest, requestObj);
    }

    /**
     * 发送消息，指定对应的proto文件名
     * 
     * @param {any} protoFileName proto文件名
     * @param {any} protoRequest 请求协议名
     * @param {any} protoResponse 应答协议名
     * @param {any} requestObj 请求传入的数据，结构对应请求的协议名
     * @returns promise protoResponse对应的结构
     * @memberof ClientBus
     */

  }, {
    key: 'postProto',
    value: function postProto(protoFileName, protoRequest, requestObj) {
      var _this4 = this;

      console.log('post:' + protoFileName + ',' + protoRequest);
      var self = this;
      return new Promise(function (resolve, reject) {
        var cmd = cmdParse.getCommand(protoRequest);
        if (!cmd) {
          console.error('command error, request:' + protoRequest);
          return reject('command error, request:' + protoRequest);
        }

        ++self._sendqueue;
        //console.log('postProto cmd:' + cmd + ', file:' + protoFileName + ', request:' + protoRequest + ', response:' + protoRequest)
        _this4._cbusCore.requestOnce(cmd, protoFileName, protoRequest, {
          fillRequest: function fillRequest(request) {
            Object.assign(request, requestObj);
          },
          handleResponse: function handleResponse(response) {
            ++self._receivequeue;
            return resolve(response);
          },
          handlerError: function handlerError(err) {
            return reject(err);
          }
        }).catch(function (err) {
          console.log('request once error', err);
        });
      });
    }

    /**
     * 开启心跳，默认会开启，用户不需要调用
     * 
     * @memberof ClientBus
     */

  }, {
    key: 'startHeartBeat',
    value: function startHeartBeat() {
      var _this5 = this;

      this.closeHeartBeat();

      // 心跳失败次数
      var heartbeatFailedCount = 0;
      // 正在登录中
      var isOpening = false;

      /**
       * 处理心跳失败，如果失败3次则进行重连
       */
      var handleHeartbeatError = function handleHeartbeatError() {
        ++heartbeatFailedCount;
        console.log('heartbeat failed, count:' + heartbeatFailedCount + ', isOpening:' + isOpening);
        if (!isOpening && heartbeatFailedCount >= 3) {
          heartbeatFailedCount = 0;
          isOpening = true;
          _this5.open(_this5._wsurlList, _this5._subscribeList).then(function () {
            isOpening = false;
          }).catch(function () {
            isOpening = false;
          });
        }
      };

      /**
       * 开始心跳Timer
       */
      this._heartBeatTimer = setInterval(function () {
        if (_this5.readyState() !== 1) {
          handleHeartbeatError('readystate is not open, readyState:' + _this5.readyState);
          return;
        }

        var data = {
          cpu: 0,
          topmemory: 0,
          memory: 0,
          sendqueue: _this5._sendqueue,
          receivequeue: _this5._receivequeue
        };

        if (_this5._sendqueue % 10 === 0) {
          console.log('heartbeat', data);
        }

        _this5.post("MsgExpress.HeartBeat", data).then(function (res) {
          console.log('heartbeat response:' + JSON.stringify(res));
        }).catch(function (err) {
          handleHeartbeatError(err);
        });
      }, this._hearBeatIntervalSecond * 1000);
    }

    /**
     * 关闭心跳
     * 
     * @memberof ClientBus
     */

  }, {
    key: 'closeHeartBeat',
    value: function closeHeartBeat() {
      if (this._heartBeatTimer) {
        clearInterval(this._heartBeatTimer);
      }
    }

    /**
     * 
     * 轮询挑选一个url 
     * @returns 
     * @memberof ClientBus
     */

  }, {
    key: 'pickUrl',
    value: function pickUrl() {
      var newIndex = this._wsurlList.indexOf(this._lastConnectUrl) + 1;
      newIndex = newIndex < this._wsurlList.length ? newIndex : 0;
      this._lastConnectUrl = this._wsurlList[newIndex];
      return this._lastConnectUrl;
    }

    /**
     * 派发推送的消息，用户不需要调用
     * 
     * @param {string} topic 
     * @param {object} content 
     * @returns 
     * @memberof ClientBus
     */

  }, {
    key: 'dispatchPublishMessage',
    value: function dispatchPublishMessage(topic, content) {
      var _this6 = this;

      if (!this._publishCallback) {
        return;
      }

      var proto = cmdParse.getClassName(topic);
      if (!proto || !content || !content.length) {
        console.log('get proto from command failed, topic:' + topic + ',content:' + content);
        return;
      }

      var data = {};
      data.topic = topic;
      data.request = proto;
      return this._cbusCore.buildProtoObject(cmdParse.getProtoFileName(proto), proto).then(function (Msg) {
        try {
          data.content = Msg.decode(content);
          if (proto === 'MsgExpress.RegisterService' && _this6._onRegisterService) {
            _this6._onRegisterService(data);
          } else {
            _this6._publishCallback(data);
          }
        } catch (e) {
          console.log('dispatchPublishMessage', proto.request, e);
        }
      });
    }
  }]);

  return ClientBus;
}();

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  CmdParse.prototype.init = function() {
    this.register('MsgExpress.ErrMessage', 0, 'msgexpress')
    this.register('MsgExpress.CommonResponse', 0, 'msgexpress')
    this.register('MsgExpress.PublishData', 0, 'msgexpress')
    this.register('MsgExpress.LoginInfo', 0, 'msgexpress')
    this.register('MsgExpress.LoginResponse', 0, 'msgexpress')
    this.register('MsgExpress.Logout', 0, 'msgexpress')
    this.register('MsgExpress.HeartBeat', 0, 'msgexpress')
    this.register('MsgExpress.HeartBeatResponse', 0, 'msgexpress')
    this.register('MsgExpress.SimpleSubscription', 0, 'msgexpress')
    this.register('MsgExpress.SubscribeData', 0, 'msgexpress')
    this.register('MsgExpress.UnSubscribeData', 0, 'msgexpress')
    this.register('MsgExpress.ComplexSubscribeData', 0, 'msgexpress')
    this.register('MsgExpress.GetAppList', 0, 'msgexpress')
    this.register('MsgExpress.AppList', 0, 'msgexpress')
    this.register('MsgExpress.GetAppInfo', 0, 'msgexpress')
    this.register('MsgExpress.AppInfo', 0, 'msgexpress')
    this.register('MsgExpress.UpdateAppStatus', 0, 'msgexpress')
    this.register('MsgExpress.AppServerList', 0, 'msgexpress')
    this.register('MsgExpress.BrokerInfo', 0, 'msgexpress')
    this.register('MsgExpress.RegisterService', 0, 'msgexpress')

    this.register('Gateway.CommonResponse', 1, 'gateway')
    this.register('Gateway.Login', 1, 'gateway')
    this.register('Gateway.Logout', 1, 'gateway')
    this.register('Gateway.Subscribe', 1, 'gateway')
    this.register('Gateway.SubscribeResult', 1, 'gateway')
  }

  CmdParse.prototype.register = function(className, serviceId, protoFileName) {
    this.commandCache[className] = {
      command: this.hashCode(className),
      serviceId: serviceId,
      protoFileName: protoFileName || '',
    }
  }

  CmdParse.prototype.hashCode = function(str) {
    let code = 0;
    for (let i = 0; i < str.length; i++) {
        code = code * 31 + str.charCodeAt(i);
        code &= code;
    }
    return code
  }

  CmdParse.prototype.getCommand = function(className) {
    if (this.commandCache[className]) {
      return this.commandCache[className].command;
    }
    console.error('getCommand error, className:' + className);
    return -1;
  }
  
  CmdParse.prototype.getClassName = function(command) {
    for (let key in this.commandCache) {
      if (this.commandCache[key].command == command) {
          return key;
      }
    }
    console.error('getClassName error, command:' + command);
    return '';
  }

  CmdParse.prototype.getServiceId = function(classNameOrCommand) {
    let info = undefined;
    if (typeof(classNameOrCommand) === 'string') {
      info = this.commandCache[className];
    } else {
      info = this.commandCache[this.getClassName(classNameOrCommand)];
    }
    if (info) {
      return info.serviceId;
    }
    console.error('getServiceId error, classNameOrCommand:' + classNameOrCommand);
    return -1;
  }

  CmdParse.prototype.getProtoFileName = function (classNameOrCommand) {
    let info = undefined;
    if (typeof(classNameOrCommand) === 'string') {
      info = this.commandCache[classNameOrCommand];
    } else {
      info = this.commandCache[this.getClassName(classNameOrCommand)];
    }
    if (info) {
      return info.protoFileName;
    }
    console.error('getServiceId error, classNameOrCommand:' + classNameOrCommand);
    return '';
  }

  return new ClientBus();
});
