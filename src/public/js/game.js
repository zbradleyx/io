class SceneA extends Phaser.Scene {

  constructor() {
      super('GameScene');
  }

  preload() {
      this.load.spritesheet("player", "assets/tiny16/Characters/characters.png", {
          frameHeight: 32,
          frameWidth: 32
      });
      this.load.spritesheet("circle", "assets/fx/circle.png", {
          frameHeight: 64,
          frameWidth: 64
      });

      this.load.image('ship', 'assets/rpg-pack/chars/hat-guy/hat-guy.png');
      this.load.image('otherPlayer', 'assets/rpg-pack/chars/sensei/sensei.png');
      this.load.image('star', 'assets/rpg-pack/props/generic-rpg-tree01.png');
      this.load.image("terrain", "assets/tiny16/Tilesets/A2.png");
      this.load.image("stuff", "assets/tiny16/Tilesets/B.png");

      this.load.tilemapTiledJSON('realmap', 'assets/maps/realmap.json');

  }

  create() {
      var self = this;

      this.socket = io();
      this.otherPlayers = this.physics.add.group();
      this.myself = this.physics.add.group();

      this.socket.on('currentPlayers', function(players) {
          Object.keys(players).forEach(function(id) {
              if (players[id].playerId === self.socket.id) {
                  addPlayer(self, players[id]);
              } else {
                  addOtherPlayers(self, players[id]);
              }
          });
      });
      this.socket.on('newPlayer', function(playerInfo) {
          addOtherPlayers(self, playerInfo);
      });
      this.socket.on('disconnect', function(playerId) {
          self.otherPlayers.getChildren().forEach(function(otherPlayer) {
              if (playerId === otherPlayer.playerId) {
                  otherPlayer.destroy();
              }
          });
      });
      this.socket.on('playerMoved', function(playerInfo) {
          self.otherPlayers.getChildren().forEach(function(otherPlayer) {
              if (playerInfo.playerId === otherPlayer.playerId) {
                  otherPlayer.setPosition(playerInfo.x, playerInfo.y);
              }
          });
      });
      this.cursors = this.input.keyboard.createCursorKeys();

      /*this.blueScoreText = this.add.text(16, 16, '', {
          fontSize: '32px',
          fill: '#0000FF'
      });
      this.redScoreText = this.add.text(584, 16, '', {
          fontSize: '32px',
          fill: '#FF0000'
      });

      this.socket.on('scoreUpdate', function(scores) {
          self.blueScoreText.setText('Blue: ' + scores.blue);
          self.redScoreText.setText('Red: ' + scores.red);
      });

      this.socket.on('starLocation', function(starLocation) {
          if (self.star) self.star.destroy();
          self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
          self.physics.add.overlap(self.ship, self.star, function() {
              this.socket.emit('starCollected');
          }, null, self);
      });*/

      var realmap = this.add.tilemap("realmap");

      var terrain = realmap.addTilesetImage("A2", "terrain");
      var stuff = realmap.addTilesetImage("B", "stuff");

      var botLayer = realmap.createDynamicLayer("bot", [terrain], 0, 0).setDepth(-1);
      var topLayer = realmap.createDynamicLayer("top", [stuff], 0, 0);

      this.physics.world.setBounds(0, 0, realmap.widthInPixels, realmap.heightInPixels);

      this.physics.add.collider(this.myself, topLayer);
      this.physics.add.collider(this.myself, botLayer);

      botLayer.setCollisionByProperty({
          collides: true
      });
      topLayer.setCollisionByProperty({
          collides: true
      });

      this.anims.create({
          key: 'down',
          frames: this.anims.generateFrameNumbers("player", {
              start: 0,
              end: 2,
              first: 2
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'standDown',
          frames: this.anims.generateFrameNumbers("player", {
              start: 1,
              end: 1,
              first: 1
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'left',
          frames: this.anims.generateFrameNumbers("player", {
              start: 12,
              end: 14,
              first: 14
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'standLeft',
          frames: this.anims.generateFrameNumbers("player", {
              start: 13,
              end: 13,
              first: 13
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'right',
          frames: this.anims.generateFrameNumbers("player", {
              start: 24,
              end: 26,
              first: 26
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'standRight',
          frames: this.anims.generateFrameNumbers("player", {
              start: 25,
              end: 25,
              first: 25
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'up',
          frames: this.anims.generateFrameNumbers("player", {
              start: 36,
              end: 38,
              first: 38
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'standUp',
          frames: this.anims.generateFrameNumbers("player", {
              start: 37,
              end: 37,
              first: 37
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'spin',
          frames: this.anims.generateFrameNumbers("player", {
              frames: [12, 0, 24, 36]
          }),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'circleAtt',
          frames: this.anims.generateFrameNumbers("circle", {
              start: 0,
              end: 8,
              first: 0
          }),
          frameRate: 10,
          repeat: -1
      });

  }

  addPlayer(self, playerInfo) {
      self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player');
      self.ship.anims.play("standDown", true);
      /*if (playerInfo.team === 'blue') {
        self.ship.setTint(0x0000ff);
      } else {
        self.ship.setTint(0xff0000);
      }*/
      self.cameras.main.startFollow(self.ship);
      self.ship.setCollideWorldBounds(true);
      self.myself.add(self.ship);
  }

  addOtherPlayers(self, playerInfo) {
      const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer');
      /*if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x0000ff);
      } else {
        otherPlayer.setTint(0xff0000);
      }*/
      otherPlayer.playerId = playerInfo.playerId;
      self.otherPlayers.add(otherPlayer);
  }

  update() {

      var isBusy = false;
      var newCircle;

      if (this.ship) {

          const speed = 100;
          const prevVelocity = this.ship.body.velocity.clone();

          if (!isBusy) {
              if (this.cursors.left.isDown) {
                  this.ship.setVelocityX(-speed);
              } else if (this.cursors.right.isDown) {
                  this.ship.setVelocityX(speed);
              } else {
                  this.ship.setVelocityX(0);
              }

              if (this.cursors.up.isDown) {
                  this.ship.setVelocityY(-speed);
              } else if (this.cursors.down.isDown) {
                  this.ship.setVelocityY(speed);
              } else {
                  this.ship.setVelocityY(0);
              }
          } else {
              this.ship.setVelocityX(0);
              this.ship.setVelocityY(0);
          }

          this.input.keyboard.on("keydown-F", () => {
              this.ship.anims.play("spin", true);
              isBusy = true;
              if (!newCircle)
                  newCircle = this.add.sprite(this.ship.x, this.ship.y, 'circle');
              else {
                  newCircle.x = this.ship.x;
                  newCircle.y = this.ship.y;
              }
              newCircle.visible = true;
              newCircle.anims.play('circleAtt', true);
          });

          this.input.keyboard.on("keyup-F", () => {
              this.ship.anims.stop();
              isBusy = false;
              newCircle.visible = false;
              newCircle.anims.stop();
          });

          if (isBusy) {} else if (this.cursors.up.isDown) {
              this.ship.anims.play("up", true);
          } else if (this.cursors.down.isDown) {
              this.ship.anims.play("down", true);
          } else if (this.cursors.left.isDown) {
              this.ship.anims.play("left", true);
          } else if (this.cursors.right.isDown) {
              this.ship.anims.play("right", true);
          } else if (prevVelocity.x < 0) this.ship.anims.play("standLeft", true);
          else if (prevVelocity.x > 0) this.ship.anims.play("standRight", true);
          else if (prevVelocity.y < 0) this.ship.anims.play("standUp", true);
          else if (prevVelocity.y > 0) this.ship.anims.play("standDown", true);
          else this.ship.anims.stop();

          //this.ship.velocity.normalize.scale(speed);

          // emit player movement
          var x = this.ship.x;
          var y = this.ship.y;
          var r = this.ship.rotation;
          if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
              this.socket.emit('playerMovement', {
                  x: this.ship.x,
                  y: this.ship.y,
                  rotation: this.ship.rotation
              });
          }
          // save old position data
          this.ship.oldPosition = {
              x: this.ship.x,
              y: this.ship.y,
              rotation: this.ship.rotation
          };
      }
  }
}

class SceneB extends Phaser.Scene {

  constructor() {
      super({
          key: 'UIScene',
          active: true
      });

      this.score = 0;
  }

  create() {
      //  Our Text object to display the Score
      let info = this.add.text(10, 10, 'Score: 0', {
          font: '48px Arial',
          fill: '#000000'
      });

      //  Grab a reference to the Game Scene
      let ourGame = this.scene.get('GameScene');

      //  Listen for events from it
      ourGame.events.on('addScore', function() {

          this.score += 10;

          info.setText('Score: ' + this.score);

      }, this);
  }
}

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
      default: 'arcade',
      arcade: {
          debug: true
      }
  },
  scene: [SceneA, SceneB]
};

var game = new Phaser.Game(config);