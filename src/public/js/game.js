var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: true//,gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  } 
};

var game = new Phaser.Game(config);

function preload() {
  //this.load.spritesheet("player", "assets/tiny16/Characters/characters.png", {frameHeight: 32, frameWidth: 32});
  this.load.image('ship', 'assets/rpg-pack/chars/hat-guy/hat-guy.png');
  this.load.image('otherPlayer', 'assets/rpg-pack/chars/sensei/sensei.png');
  this.load.image('star', 'assets/rpg-pack/props/generic-rpg-tree01.png');
  this.load.image("terrain", "assets/tiny16/Tilesets/A2.png");
  this.load.image("stuff", "assets/tiny16/Tilesets/B.png");

  this.load.tilemapTiledJSON('realmap', 'assets/maps/realmap.json');

  /*this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });*/
}

function create() {
  var self = this;

  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();

  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
  
  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('starLocation', function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.physics.add.overlap(self.ship, self.star, function () {
      this.socket.emit('starCollected');
    }, null, self);
  });

  const realmap = this.make.tilemap({ key: "realmap" });

  const terrain = realmap.addTilesetImage("A2", "terrain");
  const stuff = realmap.addTilesetImage("B", "stuff");

  const botLayer = realmap.createDynamicLayer("bot", terrain, 0, 0).setDepth(-1);
  const topLayer = realmap.createDynamicLayer("top", stuff, 0, 0);

  this.physics.world.setBounds(0,0, realmap.widthInPixels, realmap.heightInPixels);

    //this.physics.add.collider(this.ship, topLayer);

    botLayer.setCollisionByProperty({ collides: true });
    topLayer.setCollisionByProperty({ collides: true });

    //this.physics.add.collider(this.ship, topLayer);

  botLayer.setTileLocationCallback(1, 1, 1, 1, ()=>{
    alert("tile reached");
    //botLayer.setTileLocationCallback(10, 8, 1, 1, null)
  });

  /*
  

  this.anims.create(config);

  var player = this.add.sprite(700, 40, "player", 0);//.setScale(2);

  player.anims.delayedPlay(3, 'walky');*/

}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship');//.setOrigin(0.5, 0.5).setDisplaySize(32, 32);
  /*if (playerInfo.team === 'blue') {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }*/
  self.cameras.main.startFollow(self.ship);
  self.ship.setCollideWorldBounds(true);
  //self.ship.play('left', true);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer');//.setOrigin(0.5, 0.5).setDisplaySize(32, 32);
  /*if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }*/
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function update() {
  if (this.ship) {
    //this.ship.setVelocity(0);
    /*if (this.cursors.left.isDown) {
      this.ship.setVelocityX(-100);
      this.ship.rotation = 1;
    } else if (this.cursors.right.isDown) {
      this.ship.setVelocityX(100);
      this.ship.rotation = 2;
    }
  
    if (this.cursors.up.isDown) {
      this.ship.setVelocityY(-100);
      this.ship.rotation = 3;
    } else if (cursors.down.isDown) {
      this.ship.setVelocityY(100);
      this.ship.rotation = 0;
    }*/

    if (this.cursors.left.isDown) {
      this.ship.setVelocityX(-100);
    } else if (this.cursors.right.isDown) {
      this.ship.setVelocityX(100);
    } else {
      this.ship.setVelocityX(0);
    }
  
    if (this.cursors.up.isDown) {
      this.ship.setVelocityY(-100);
    } else if (this.cursors.down.isDown) {
      this.ship.setVelocityY(100);
    } else {
      this.ship.setVelocityY(0);
    }

    //this.ship.velocity.normalize();

    // emit player movement
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
    }
    // save old position data
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }
}