var PiyoPiyo = (function(window) {
  var FPS=60;
  var INTERVAL = 1000/FPS;
  var COLS=8;
  var LINE=8;
  var _isMobile = false;
  var theme = "default";
  var assets = {};
  var Type = {
   GREEN  : 0,
   RED    : 1,
   BLUE   : 2,
   YELLOW : 3,
   PARPLE : 4,
   HEART  : 1 << 8,
   NONE   : 16,
  }

  var State = {
    NORMAL : 1 << 0,
    SELECT : 1 << 1,
    DROP   : 1 << 2,
    FADEOUT: 1 << 3,
    DEAD   : 1 << 4,
  }

  var Position = function(x,y){
    this.x = x;
    this.y = y;
  }

  function PiyoPiyo(canvasID) {
    try {
      document.createElement("canvas").getContext("2d");
    } catch (e) {
      return;
    }
    if (uaIs("iphone") || uaIs("ipad") || uaIs("android") || uaIs("blackberry") || uaIs("iemobile") ) {
      _isMobile = true;
    }
    if ( ! _isMobile && location.hash!="#pc")
    {
      location.href="./pc.html";
    }
    if (uaIs("android")) {
      FPS = 10;
    }
    this.canvas = document.getElementById(canvasID);
    this.stage = new createjs.Stage(this.canvas);
    // this.stage.compositeOperation = "lighter";
    this.container = new createjs.Container();
    this.stage.addChild(this.container);
    this.init();
    createjs.Touch.enable(this.stage);
    createjs.Ticker.setFPS(FPS);
  }


  function uaIs(str)
  {
    return (navigator.userAgent.toString().toLowerCase().indexOf(str) != -1);
  }

  var p = PiyoPiyo.prototype;
  
  p.canvas = null;
  p.stage = null;
  p.text = null;
  p.container = null;
  p.map = null;
  p.intervalID = null;
  p.playing = false;
  p.combo = 0;

  p.showLoader = function() {
    var self = this;

    var bg = new createjs.Graphics();
    bg
      .beginLinearGradientFill(["#0088ff", "#00ff00"], [0, 1], 320, 0, 0, 320)
      .drawRect(0, 0, 640, 640);
    var shape = new createjs.Shape(bg);
    self.stage.addChild(shape);

    var fg = new createjs.Graphics();
    fg
      .beginFill("rgba(0,0,0,0.9)")
      .drawRect(0,0,640*Math.sqrt(2),640*Math.sqrt(2))
    var shape = new createjs.Shape(fg);
    shape.rotation = 45;
    shape.x = 320;
    shape.y = -320;
    self.stage.addChild(shape);

    var text = new createjs.Text("Loading","64px Days One","#FFFFFF");
    text.x=320 - text.getMeasuredWidth()/2;
    text.y=320 - text.getMeasuredHeight()/2;
    self.stage.addChild(text);

    var queue = new createjs.LoadQueue(false);
    queue.installPlugin(createjs.Sound);
    queue.loadFile({id:"panel", src:"resources/"+theme+"/images/panel.png"});
    for(var i=1;i<=10;++i)
      queue.loadFile({id:"sound_"+i, src:"resources/"+theme+"/sounds/"+i+".mp3"});
    queue.loadFile({id:"bgm", src:"resources/"+theme+"/musics/bgm.mp3"});
    queue.loadFile({id:"gameover", src:"resources/"+theme+"/sounds/gameover.mp3"});
    queue.loadFile({id:"Twitter", src:"images/Twitter.png"});
    queue.loadFile({id:"Line", src:"images/Line.png"});
    queue.addEventListener("complete", function() {
      self.stage.removeAllChildren();
      self.stage.update();
      self.showTitle();
    });
    queue.addEventListener("fileload", function(event) {
      shape.x+=640/15;
      shape.y-=640/15;
      assets[event.item.id]=event.result;
      self.stage.update();
    });
    queue.load();

    self.stage.update();
  }

  p.showTitle = function() {
    var self = this;

    var bg = new createjs.Graphics();
    bg
      .beginFill("rgba(0,0,0,0.1)")
      .drawRect(0, 0, 640, 640);
    var shape = new createjs.Shape(bg);
    self.stage.addChild(shape);

    var m = "";
    if(uaIs("iphone") && !window.navigator.standalone)
    {
      var ar = new createjs.Text("\u2193","64px Days One","#FFFFFF");
      ar.x=320 - ar.getMeasuredWidth()/2;
      ar.y=640 - 128;
      self.stage.addChild(ar);
      var text = new createjs.Text("Add to Home","64px Days One","#FFFFFF");
      text.x=320 - text.getMeasuredWidth()/2;
      text.y=320 - text.getMeasuredHeight()/2;
      self.stage.addChild(text);
    }else{

      var text = new createjs.Text("Touch to Start","64px Days One","#FFFFFF");
      text.x=320 - text.getMeasuredWidth()/2;
      text.y=320 - text.getMeasuredHeight()/2;

      text.flag=false;
      text.alpha = 0.5;
      text.onTick = function() {
        text.alpha-= (text.flag) ? 0.02 : -0.02;
        if(text.alpha < 0.1 || text.alpha > 0.9) 
          text.flag = !text.flag;
      }
      self.stage.addEventListener("click", function() {
        window.document.getElementById('help').style.display="none";
        self.stage.removeAllChildren();
        self.stage.removeAllEventListeners("click");
        self.stage.update();
        createjs.Ticker.removeEventListener("tick",self.stage);
        self.showGame();
      });
      self.stage.addChild(text);
    }


    createjs.Ticker.addEventListener("tick",self.stage);
  }
  
  p.showGameOver = function() {
    var self = this;

    self.stage.removeAllEventListeners();
    var bar = new createjs.Graphics();
    bar
      .beginFill("rgba(0,0,0,1)")
      .drawRect(0, -320, 960, 320);
    var up = new createjs.Shape(bar);
    up.x = 0;
    up.y = 320;
    up.rotation = 270;
    up.addEventListener("tick",function() {
      if(up.rotation < 360)
      {
        up.rotation += 5;
      }else{
        up.removeAllEventListeners();
      }
    })
    self.stage.addChild(up);

    var down = new createjs.Shape(bar);
    down.x = 640;
    down.y = 320;
    down.rotation = 90;
    down.addEventListener("tick",function() {
      if(down.rotation < 180)
      {
        down.rotation += 5;
      }else{
        down.removeAllEventListeners();
        self.showScore();
      }
    });
    self.stage.addChild(down);

    createjs.Sound.stop();
    createjs.Sound.play("gameover");
  }

  p.showScore = function () {
    var self = this;
    setTimeout(function() {
      var text = new createjs.Text("GameOver","96px Days One","#FFFFFF");
      text.x = 320 - text.getMeasuredWidth()/2 ;
      text.y = 32;
      self.stage.addChild(text);
    },200);

    var counter = 0;
    var addText = function(key,value,delay)
    {
      setTimeout(function() {
        var text = new createjs.Text(key + " ","36px Days One","#FFFFFF");
        text.x = 400 - text.getMeasuredWidth();
        text.y = 160 + (counter++)*42;
        text.text += ": " + value;
        self.stage.addChild(text);
      },delay);
    }

    addText("Score",self.score,1000);
    addText("Breaked Panel",self.breaked,2000);
    addText("Max Combo",self.maxcombo,3000);
    addText("GameSpeed",(~~( self.gamespeed*100)),4000);
    addText("PlayTime",~~(self.playtime / 100),5000);

    var counter2 = -0.5;
    var addShareButton = function(name,url,flag) {
      setTimeout(function() {
        var bitmap = new createjs.Bitmap(assets[name]);
        bitmap.x = 320 + 80 * (counter2++)*2 - 40;
        bitmap.y = 400;
        self.stage.addChild(bitmap);

        bitmap.addEventListener("click",function() {
          var text = "PiyoPiyoPuzzle\u3067\u30b9\u30b3\u30a2"+self.score+"\u3092\u9054\u6210\u3057\u305f\u3088\uff01 \u4e00\u7dd2\u306b\u30d7\u30ec\u30a4\u3057\u3088\u3046 ";
          if(flag)
          text += "http://www.aki017.info/works/game/PiyoPiyo/";
          window.location=url+encodeURIComponent(text);
        });
      },5000);
    }
    addShareButton("Twitter","https://twitter.com/intent/tweet?url=http%3A%2F%2Fwww.aki017.info%2Fworks%2Fgame%2FPiyoPiyo%2F&hashtags=PiyoPiyoPuzzle&via=PiyoPiyoPuzzle&related=PiyoPiyoPuzzle&text=",false);
    addShareButton("Line","http://line.naver.jp/R/msg/text/?",true);



    var button = new createjs.Text("<< TITLE >> ","36px Days One","#F0F000");
    button.x = 320 - button.getMeasuredWidth()/2;
    button.y = 520;
    button.addEventListener("click",function() {
      self.restart();
    });
    self.stage.addChild(button);

  }



  p.restart = function() {
    var self = this;
    self.stage.removeAllChildren();
    createjs.Sound.stop();
    self.stage.removeAllEventListeners();
    self.init();
    self.showTitle();
  }

  p.showGame = function() {
    var self = this;
    self.time = 0;
    self.score = 0;
    self.baginDate = new Date();

    self.startTime = new Date();
    handleDown = function(e) {
      if(self.containState(~State.NORMAL))return;
      var x=~~(e.stageX/80);
      var y=~~(e.stageY/80);
      self.field[y][x].state=State.SELECT;
      self.stage.addEventListener("stagemousemove", handleMove);
    }
    handleMove = function(e) {
      var x=~~(e.stageX/80);
      var y=~~(e.stageY/80);
      self.field[y][x].state=State.SELECT;
    }
    handleUp = function(e) {
      if(!self.containState(State.SELECT))return;
      self.stage.removeEventListener("stagemousemove", handleMove);
      for(var i=0;i<self.field.length;++i)
      {
        for(var j=0;j<self.field[i].length;++j)
        {
          if(self.field[i][j].state===State.SELECT)self.field[i][j].state=State.FADEOUT;
        }
        self.gamespeed += Math.max(0,(5 - self.combo))*0.0005
        self.combo=0;
      }
    }
    this.stage.addEventListener("stagemousedown", handleDown);
    this.stage.addEventListener("stagemouseup", handleUp);
    createjs.Sound.play("bgm",null,null,null,100);

    self.field = new Array(COLS);
    for(var i=0;i<COLS;++i)
    {
      self.field[i]= new Array(LINE);
      for(var j=0;j<LINE;++j)
      {
        self.field[i][j] = self.createPiyo(this.stage,j,i,~~(Math.random()*5));
      }
    }

    createjs.Ticker.addListener(this.stage);
    this.start();
  }

  p.init = function() {
    this.field = null;
    this.gamespeed = 1.0;
    this.breaked = 0;
    this.maxcombo = 0;
    this.playtime = 0;
  }

  p.start = function() {
    var self = this;
    this.intervalID = setInterval(function() {
      self.drop();
      self.down();
      
      var old = self.startTime;
      self.startTime = new Date();
      self.time += (self.startTime - old) * self.gamespeed;

      if( self.time > (self.score /10 + 60)*1000  )
      {
        clearInterval(self.intervalID);
        self.playtime = self.beginDate - new Date();
        self.showGameOver();
      }
      var limit = ((self.score / 10 + 60)*1000 - self.time)

      document.getElementById("bar").style.width = ""+ Math.min(100,limit/(60*1000)*100) + "%";
      if(limit > 60 * 1000) {
        document.getElementById("bar2").style.width = ""+ Math.min(100,(limit-60*1000)/(120*1000)*100) + "%";
      }else{
        document.getElementById("bar2").style.width = "0%";
      }
      if(limit > 180 * 1000) {
        document.getElementById("bar3").style.width = ""+ Math.min(100,(limit-180*1000)/(180*1000)*100) + "%";
      }else{
        document.getElementById("bar3").style.width = "0%";
      }
      document.getElementById("score").innerHTML = "Score : " + self.score;
    }, INTERVAL);
    this.playing = true;
  };
  
  p.stop = function() {
    clearInterval(this.intervalID);
    this.intervalID = null;
    var self = this;
    this.playing = false;
  };

  p.drop = function(){
    var self = this;
    if(self.containState(~State.NORMAL))return;
    var drop = false
    for(var i = 0;i<self.field.length;++i)
    {
      for(var j = 0;j<self.field[i].length;++j)
      {
        if(self.getSurround(i,j)>=4) {
          drop = true;
          self.score += (self.combo+1);
          self.breaked++;
          self.stage.addChild(showCombo(this.combo+1,i,j));
          self.field[i][j].state=State.FADEOUT;
        }
      }
    }
    if(drop) {
      self.combo++;
      self.maxcombo = (self.maxcombo < self.combo) ? self.combo : self.maxcombo;
      createjs.Sound.play("sound_"+Math.min(this.combo,10));
    }
  }

  p.containState = function( s, flag)
  {
    var self = this;
    flag = flag | false;
    for(var i = 0;i<self.field.length;++i)
    {
      for(var j = 0;j<self.field[i].length;++j)
      {
        if(flag && self.field[i][j]===null)continue;
        if(self.field[i][j]===null) return true;
        if(self.field[i][j].state & s) return true;
      }
    }
    return false;
  }

  p.down = function(){
    var self = this;
    if(self.containState(State.FADEOUT,true))
      return;
    for(var i = self.field.length-1;i>=0;--i)
    {
      for(var j = 0;j<self.field[i].length;++j)
      {
        if(self.field[i][j]===null)
        {
          if(i > 0) {
            if ( self.field[i-1][j] !== null && self.field[i-1][j].state != State.FADEOUT) {
              self.field[i][j]= self.field[i-1][j];
              self.field[i-1][j]=null;
              self.field[i][j].state = State.DROP;
              self.field[i][j].setPosition(j,i);
            }
          }else{
            self.field[i][j]= self.createPiyo(this.stage,j,i,~~(Math.random()*5));
          }
        }
      }
    }
  }

  p.getSurround = function(x,y){
    var self = this;
    var cache = new Array(self.field.length);
    for(var i=0;i<self.field.length;++i)
    {
      cache[i]= new Array(self.field[i].length);
    }
    return self._getSurround(cache,x,y);
  }

  p._getSurround = function(cache,i,j){
    var self = this;
    var rtn = 1;
    var type=self.field[i][j].type;

    cache[i][j]=true;
    var n = [[-1,0],[0,-1],[1,0],[0,1]];
    for(var c=0;c<4;++c)
    {
      _n = n[c];
      _n[0] += i;
      _n[1] += j;
      if(_n[0] < 0 || _n[0] >= self.field.length) continue;
      if(_n[1] < 0 || _n[1] >= self.field[_n[0]].length) continue;

      var target = self.field[_n[0]][_n[1]];
      if( !cache[_n[0]][_n[1]] &&target.type==type) rtn += self._getSurround(cache,_n[0],_n[1]);
    }
    return rtn;
  }

  p.createPiyo = function(stage,x, y, type){
    var self=this;
    var piyo = new createjs.Bitmap(assets["panel"]);
    piyo.set({
      sourceRect : new createjs.Rectangle(0,80*type,80,80)
    });

    piyo.cache(0,0,80,80);
    piyo.x = x*80;
    piyo.y = -80;
    piyo.position = new Position(x,y);
    piyo.type = type;
    piyo.state = State.DROP;
    piyo.onTick = function(time){
      for(var iiii=0;iiii<60/FPS;++iiii)
      {
        switch(piyo.state){
          case State.NORMAL:
            break;
          case State.DROP:
            if( piyo.y < piyo.position.y * 80) {
              piyo.y -= (piyo.y - (piyo.position.y * 80)) / 16 * self.gamespeed;
              piyo.y += 1;
            }else{
              piyo.y = piyo.position.y * 80;
              piyo.state = State.NONE;
            }
            break;
          case State.FADEOUT:
            if(piyo.alpha > 0.05 ) {
              piyo.x -= 0.8 * self.gamespeed;
              piyo.y -= 0.8 * self.gamespeed;
              piyo.scaleX += 0.02 * self.gamespeed;
              piyo.scaleY += 0.02 * self.gamespeed;
              piyo.alpha -= 0.03 * self.gamespeed;
            }else {
              self.field[piyo.position.y][piyo.position.x]=null;
              stage.removeChild(piyo);
            }
            break;
          case State.SELECT:
              piyo.alpha -= 0.03;
            break;
        }
      }
    }
    piyo.setPosition = function(x,y) {
      piyo.position = new Position(x,y);
    }
    stage.addChild(piyo);
    return piyo;
  }
  function showCombo(c,i,j)
  {
    var o = new createjs.Text(""+c,"48px Days One","#FFFFFF");
    o.x=j*80+40-o.getMeasuredWidth()/2;
    o.y=i*80+40-o.getMeasuredHeight()/2;

    o.onTick = function()
    {
      this.alpha -= 0.02;
      if(this.alpga < 0.02)
        stage.removeChild(o);
    }

    return o;
  }
  
  return PiyoPiyo;
}(window));



window.addEventListener("load", function(e) {
  window.removeEventListener("load", arguments.callee, false);
  var main = new PiyoPiyo("canvas");
  main.showLoader();
}, false);


// disable bounds
document.ontouchmove = function(event){
    event.preventDefault();
}
