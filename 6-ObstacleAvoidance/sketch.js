let pursuer1;
let target;
let obstacles = [];
let snakeVehicles = []; // Liste pour le snake principal
let wanderVehicles = []; // Liste pour les wanderers
let bullets = [];
let enemy = null; // Variable pour stocker l'ennemi

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Le premier véhicule suit le curseur
  pursuer1 = new Vehicle(100, 100);
  snakeVehicles.push(pursuer1);

  // Créez un obstacle au centre de l'écran
  obstacles.push(new Obstacle(width / 2, height / 2, 100, "green"));
}

function mousePressed() {
  obstacles.push(new Obstacle(mouseX, mouseY, random(20, 100), "green"));
}

function draw() {
  background(0, 0, 0, 100);
  target = createVector(mouseX, mouseY);

  fill(255);
  textSize(16);
  text(`Mode: ${behaviorMode}`, 10, 20);

  // Affiche les obstacles
  obstacles.forEach((o) => o.show());

  // Toujours afficher tous les véhicules
  snakeVehicles.forEach((v) => v.show());
  wanderVehicles.forEach((v) => v.show());

  // Si un ennemi existe, gérer son affichage et les tirs
  if (enemy) {
    enemy.show();

    // Les véhicules du snake arrêtent et tirent sur l'ennemi
    snakeVehicles.forEach((v) => {
      if (enemy) {
        v.stopAndShoot(enemy);
      }
    });

    // Les wanderers arrêtent et tirent également sur l'ennemi
    wanderVehicles.forEach((v) => {
      if (enemy) {
        v.stopAndShoot(enemy);
      }
    });

    // Gérer les balles
    bullets.forEach((bullet, index) => {
      bullet.update();
      bullet.show();

      // Si une balle touche l'ennemi
      if (enemy && bullet.hits(enemy)) {
        bullets.splice(index, 1); // Supprime la balle
        enemy.takeDamage(20); // Réduit la santé de l'ennemi
      }
    });

    // Supprimer les balles qui sortent de l'écran
    bullets = bullets.filter((bullet) => {
      return (
        bullet.pos.x >= 0 &&
        bullet.pos.x <= width &&
        bullet.pos.y >= 0 &&
        bullet.pos.y <= height
      );
    });

    // Si l'ennemi est détruit
    if (enemy && enemy.health <= 0) {
      enemy = null; // Détruit l'ennemi
      bullets = []; // Supprime toutes les balles restantes
      snakeVehicles.forEach((v) => v.resumeNormalBehavior()); // Les véhicules reprennent leur comportement normal
      wanderVehicles.forEach((v) => v.resumeNormalBehavior()); // Les wanderers reprennent leur comportement normal
    }
  } else {
    // Si aucun ennemi, le snake principal suit le curseur et les wanderers errent
    snakeVehicles.forEach((v, index) => {
      if (index === 0) {
        // Le premier véhicule suit la souris
        v.applyBehaviors(target, obstacles, snakeVehicles);
      } else {
        // Les autres véhicules suivent le véhicule précédent dans le snake
        const leader = snakeVehicles[index - 1];
        const followTarget = leader.pos.copy().sub(leader.vel.copy().setMag(50));
        v.applyBehaviors(followTarget, obstacles, snakeVehicles);
      }
      v.update();
    });

    // Les wanderers continuent leur comportement aléatoire
    wanderVehicles.forEach((v) => {
      v.wander(obstacles);
      v.update();
      v.edges(); // Empêche les wanderers de sortir du cadre
    });
  }
}


function keyPressed() {
  if (key === "f") {
    // Ajouter un nouveau véhicule à la fin du snake
    const lastVehicle = snakeVehicles[snakeVehicles.length - 1];
    const newVehicle = new Vehicle(
      lastVehicle.pos.x - 50,
      lastVehicle.pos.y - 50
    );
    newVehicle.vel = lastVehicle.vel.copy(); // Copier la vitesse du dernier véhicule du snake
    snakeVehicles.push(newVehicle);
  }

  if (key === "w") {
    // Ajouter un wanderer indépendant
    let wanderer = new Vehicle(random(width), random(height));
    wanderer.isWandering = true; // Activer le mode wander
    wanderer.color = "blue"; // Différencier les wanderers
    wanderVehicles.push(wanderer);
  }

  if (key === "e") {
    // Ajouter un ennemi à une position aléatoire
    enemy = new Enemy(random(width), random(height));
  }

  if (key === "d") {
    Vehicle.debug = !Vehicle.debug;
  }

  if (key === "v") {
    // Ajouter un véhicule à une position aléatoire (pas relié au snake)
    wanderVehicles.push(new Vehicle(random(width), random(height)));
  }
}



