/*
  Calcule la projection orthogonale du point a sur le vecteur b
  a et b sont des vecteurs calculés comme ceci :
  let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
  let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
  */

let behaviorMode = "pursuit";


function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}



class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.canShoot = true; // Flag pour limiter la cadence de tir
    this.shootCooldown = 500; 
    // position du véhicule
    this.pos = createVector(x, y);
    // vitesse du véhicule
    this.vel = createVector(0, 0);
    // accélération du véhicule
    this.acc = createVector(0, 0);
    // vitesse maximale du véhicule
    this.maxSpeed = 6;
    this.wanderAngle = 0;
    // force maximale appliquée au véhicule
    this.maxForce = 0.25;
    this.color = "white";
    // à peu près en secondes
    this.dureeDeVie = 5;

    this.r_pourDessin = 16;
    // rayon du véhicule pour l'évitement
    this.r = this.r_pourDessin * 3;

    // Pour évitement d'obstacle
    this.largeurZoneEvitementDevantVaisseau = this.r / 2;
    this.isWandering = false;
    this.distanceCercle = 150; // Distance du centre du cercle
    this.wanderRadius = 50; // Rayon du cercle
    this.wanderTheta = PI / 2; // Angle initial
    this.displaceRange = 0.3;

    // chemin derrière vaisseaux
    this.path = [];
    this.pathMaxLength = 30;
  }

  // on fait une méthode applyBehaviors qui applique les comportements
  // seek et avoid
  // applyBehaviors(target, obstacles) {

  //   let seekForce = this.arrive(target);
  //   let avoidForce = this.avoid(obstacles);
  //   let separateForce = this.separate(vehicules);

  //   seekForce.mult(0.2);
  //   avoidForce.mult(3);
  //   separateForce.mult(0.3);

  //   this.applyForce(seekForce);
  //   this.applyForce(avoidForce);
  //   this.applyForce(separateForce);
  // }
  applyBehaviors(target, obstacles, vehicles) {
    if (!Array.isArray(obstacles)) {
        console.error("applyBehaviors: obstacles n'est pas un tableau", obstacles);
        return;
    }

    // Vérifier si le véhicule est en mode wander
    if (this.isWandering) {
      this.wander(obstacles); // Comportement aléatoire
      this.avoid(obstacles); // Éviter les obstacles
      this.boundaries(); // Rester dans les limites
      return; // Ne pas poursuivre la cible
  }

    const stopThreshold = 1; // Seuil pour déterminer si la cible est stationnaire
    const isTargetStopped = target.mag() < stopThreshold; // Vérifier si la cible bouge
    const followDistance = 50; // Distance entre véhicules

    // Éviter les obstacles
    let avoidForce = this.avoid(obstacles);
    this.applyForce(avoidForce);

    if (vehicles[0] === this) {
        // Comportement du leader
        if (p5.Vector.dist(this.pos, target) < stopThreshold) {
            // Arrêter le leader près de la cible
            this.vel.set(0, 0);
            this.acc.set(0, 0);
        } else {
            // Se déplacer vers la cible
            let seekForce = this.arrive(target);
            this.applyForce(seekForce);
        }
    } else {
        // Comportement des suiveurs
        let leaderIndex = vehicles.indexOf(this) - 1;
        if (leaderIndex >= 0) {
            let leader = vehicles[leaderIndex];
            let distanceToLeader = p5.Vector.dist(this.pos, leader.pos);

            if (distanceToLeader > followDistance) {
                // Suivre le leader
                let followTarget = leader.pos.copy().sub(leader.vel.copy().setMag(followDistance));
                let followForce = this.arrive(followTarget);
                this.applyForce(followForce);
            } else {
                // Arrêter à une distance sécuritaire derrière le leader
                this.vel.set(0, 0);
                this.acc.set(0, 0);
            }
        }
    }

    // Stabiliser le véhicule si sa vitesse est très faible
    if (this.vel.mag() < 0.1 && isTargetStopped) {
        this.vel.set(0, 0);
        this.acc.set(0, 0);
    }
}


wander(obstacles) {
  if (!Array.isArray(obstacles)) {
      console.error("wander: obstacles n'est pas un tableau", obstacles);
      obstacles = []; // Si undefined, on initialise à un tableau vide
  }

  // Calcul du point devant le véhicule (centre du cercle)
  let wanderPoint = this.vel.copy();
  wanderPoint.setMag(this.distanceCercle);
  wanderPoint.add(this.pos);

  // Calcul du déplacement sur le cercle
  let theta = this.wanderTheta + this.vel.heading();
  let x = this.wanderRadius * cos(theta);
  let y = this.wanderRadius * sin(theta);
  wanderPoint.add(x, y);

  // Calcul de la force de steering pour wander
  let steer = wanderPoint.sub(this.pos);
  steer.setMag(this.maxForce);

  // Ajout de l'évitement des obstacles
  let avoidForce = this.avoid(obstacles);
  steer.add(avoidForce);

  // Application de la force combinée au véhicule
  this.applyForce(steer);

  // Mise à jour de l'angle de wander
  this.wanderTheta += random(-this.displaceRange, this.displaceRange);
}



boundaries() {
  let d = 50; // Distance de détection des bords
  let steer = createVector(0, 0); // Force de steering initialisée à zéro

  // Bordure gauche
  if (this.pos.x < d) {
      this.pos.x = max(this.pos.x, 0); // Empêche de sortir du bord gauche
      let force = createVector(this.maxSpeed, this.vel.y);
      let strength = map(this.pos.x, 0, d, this.maxForce, 0); // Force décroissante
      force.setMag(strength);
      steer.add(force);
  }

  // Bordure droite
  if (this.pos.x > width - d) {
      this.pos.x = min(this.pos.x, width); // Empêche de sortir du bord droit
      let force = createVector(-this.maxSpeed, this.vel.y);
      let strength = map(this.pos.x, width, width - d, this.maxForce, 0);
      force.setMag(strength);
      steer.add(force);
  }

  // Bordure supérieure
  if (this.pos.y < d) {
      this.pos.y = max(this.pos.y, 0); // Empêche de sortir du bord supérieur
      let force = createVector(this.vel.x, this.maxSpeed);
      let strength = map(this.pos.y, 0, d, this.maxForce, 0);
      force.setMag(strength);
      steer.add(force);
  }

  // Bordure inférieure
  if (this.pos.y > height - d) {
      this.pos.y = min(this.pos.y, height); // Empêche de sortir du bord inférieur
      let force = createVector(this.vel.x, -this.maxSpeed);
      let strength = map(this.pos.y, height, height - d, this.maxForce, 0);
      force.setMag(strength);
      steer.add(force);
  }

  // Appliquer la force totale de steering si elle n'est pas nulle
  if (steer.mag() > 0) {
      steer.limit(this.maxForce); // Limiter la force maximale
      this.applyForce(steer);
  }
}


keyPressed() {
  if (key == "v") {
      vehicules.push(new Vehicle(random(width), random(height)));
  } else if (key === "w") {
        let v = new Vehicle(random(width), random(height));
        v.isWandering = true; // Activer le mode wander
        vehicules.push(v);
    } else if (key == "d") {
      Vehicle.debug = !Vehicle.debug;
  } 
  else if (key === 'd') {
    Vehicle.debug = !Vehicle.debug;
  }else if (key == "f") {
      for (let i = 0; i < 10; i++) {
          let v = new Vehicle(20, 300);
          v.vel = new p5.Vector(random(1, 5), random(1, 5));
          vehicules.push(v);
      }
  } else if (key == "l") {
      behaviorMode = behaviorMode === "pursuit" ? "followLeader" : "pursuit";
  }
}

  
  
avoid(obstacles) {
  // TODO
  // calcul d'un vecteur ahead devant le véhicule
  // il regarde par exemple 50 frames devant lui
  let ahead = this.vel.copy();
  ahead.mult(50);
  // Calcul de ahead2 situé au milieu de ahead
  let ahead2 = ahead.copy();
  ahead2.mult(0.5);

  if(Vehicle.debug) {
  // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
  this.drawVector(this.pos, ahead, "yellow");
  // on dessine le vecteur ahead2 en bleu
  this.drawVector(this.pos, ahead2, "blue");
  }

  // Calcul des coordonnées du point au bout de ahead
  let pointAuBoutDeAhead = this.pos.copy().add(ahead);
  // Calcul des coordonnées du point au bout de ahead2
  let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);


  // Detection de l'obstacle le plus proche
  let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

  // Si pas d'obstacle, on renvoie un vecteur nul
  if (obstacleLePlusProche == undefined) {
    return createVector(0, 0);
  }

  // On calcule la distance entre l'obstacle le plus proche 
  // et le bout du vecteur ahead
  let distance = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
  // idem avec ahead2
  let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
  // idem avec la position du véhicule
  let distance3 = this.pos.dist(obstacleLePlusProche.pos);


  if(Vehicle.debug) {
  // On dessine avec un cercle le point au bout du vecteur ahead pour debugger
  fill(255, 0, 0);
  circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
  // et un au bout de ahead2
  fill(0, 255, 0);
  circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

  // On dessine la zone d'évitement
  // Pour cela on trace une ligne large qui va de la position du vaisseau
  // jusqu'au point au bout de ahead
  stroke(100, 100);
  strokeWeight(this.largeurZoneEvitementDevantVaisseau);
  line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
  }

  // Calcul de la plus petite distance entre distance et distance2
  distance = min(distance, distance2);
  // calcul de la plus petite distance entre distance et distance3
  distance = min(distance, distance3);

  // si la distance est < rayon de l'obstacle
  // il y a collision possible et on dessine l'obstacle en rouge
  if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {

    if(this.pos.dist(obstacleLePlusProche.pos) < (this.r + obstacleLePlusProche.r)) {
      // il y a VRAIMENT collision, on dessine l'obstacle en rouge
      //obstacleLePlusProche.color = "red";
    } else {
      //obstacleLePlusProche.color = "green";
    }

    // calcul de la force d'évitement. C'est un vecteur qui va
    // du centre de l'obstacle vers le point au bout du vecteur ahead
    // on va appliquer force = vitesseDesiree - vitesseActuelle
    let desiredVelocity;
    if(distance == distance2) {
       desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
    } else if(distance == distance3) {
        desiredVelocity = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
    } else {
        desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
    }

    if(Vehicle.debug) {
      // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
      this.drawVector(obstacleLePlusProche.pos, desiredVelocity, "yellow");
    }
    // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
    // on limite ce vecteur desiredVelocity à  maxSpeed
    desiredVelocity.setMag(this.maxSpeed);

    // on calcule la force à appliquer pour atteindre la cible avec la formule
    // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
    let force = p5.Vector.sub(desiredVelocity, this.vel);

    // on limite cette force à la longueur maxForce
    force.limit(this.maxForce);

    return force;
  } else {
    //obstacleLePlusProche.color = "green";
    return createVector(0, 0);
  }

}
  
  

  avoidCorrige(obstacles) {
    // calcul d'un vecteur ahead devant le véhicule
    // il regarde par exemple 50 frames devant lui
    let ahead = this.vel.copy();
    ahead.mult(30);
    //on calcue ahead2 deux fois plus petit
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
    this.drawVector(this.pos, ahead, "yellow");

    // Calcul des coordonnées du point au bout de ahead
    let pointAuBoutDeAhead = this.pos.copy().add(ahead);
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

    // Detection de l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    // Si pas d'obstacle, on renvoie un vecteur nul
    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    // On calcule la distance entre le cercle et le bout du vecteur ahead
    let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
    let distance = min(distance1, distance2);


    // On dessine le point au bout du vecteur ahead pour debugger
    fill("red");
    circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
    fill("blue");
    circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

    // On dessine la zone d'évitement
    // Pour cela on trace une ligne large qui va de la position du vaisseau
    // jusqu'au point au bout de ahead
    stroke(100, 100);
    strokeWeight(this.largeurZoneEvitementDevantVaisseau);
    line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);

    // si la distance est < rayon de l'obstacle
    // il y a collision possible et on dessine l'obstacle en rouge

    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau + this.r) {
      // collision possible 

      // calcul de la force d'évitement. C'est un vecteur qui va
      // du centre de l'obstacle vers le point au bout du vecteur ahead
      let force;
      if (distance1 < distance2) {
        force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
      }
      else {
        force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
      }
      // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
      this.drawVector(obstacleLePlusProche.pos, force, "yellow");

      // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
      // on limite ce vecteur à la longueur maxSpeed
      // force est la vitesse désirée
      force.setMag(this.maxSpeed);
      // on calcule la force à appliquer pour atteindre la cible avec la formule
      // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
      force.sub(this.vel);
      // on limite cette force à la longueur maxForce
      force.limit(this.maxForce);
      return force;
    } else {
      // pas de collision possible
      return createVector(0, 0);
    }
  }


  getObstacleLePlusProche(obstacles) {
    if (!Array.isArray(obstacles)) {
      console.error("getObstacleLePlusProche: obstacles n'est pas un tableau", obstacles);
      return null;
    }
  
    let plusPetiteDistance = Infinity;
    let obstacleLePlusProche = null;
  
    obstacles.forEach(o => {
      const distance = this.pos.dist(o.pos);
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });
  
    return obstacleLePlusProche;
  }
  

  getVehiculeLePlusProche(vehicules) {
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche;

    vehicules.forEach(v => {
      if (v != this) {
        // Je calcule la distance entre le vaisseau et le vehicule
        const distance = this.pos.dist(v.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          vehiculeLePlusProche = v;
        }
      }
    });

    return vehiculeLePlusProche;
  }


  getClosestObstacle(pos, obstacles) {
    // on parcourt les obstacles et on renvoie celui qui est le plus près du véhicule
    let closestObstacle = null;
    let closestDistance = 1000000000;
    for (let obstacle of obstacles) {
      let distance = pos.dist(obstacle.pos);
      if (closestObstacle == null || distance < closestDistance) {
        closestObstacle = obstacle;
        closestDistance = distance;
      }
    }
    return closestObstacle;
  }

  // arrive(target) {
  //   // 2nd argument true enables the arrival behavior
  //   return this.seek(target, true);
  // }

  arrive(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
  
    let speed = this.maxSpeed;
    if (d < 100) { // Si proche de la cible
      speed = map(d, 0, 100, 0, this.maxSpeed); // Réduire la vitesse
    }
    desired.setMag(speed);
  
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }
  

  seek(target, arrival = false) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;
    if (arrival) {
      let slowRadius = 100;
      let distance = force.mag();
      if (distance < slowRadius) {
        desiredSpeed = map(distance, 0, slowRadius, 0, this.maxSpeed);
      }
    }
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  
  // inverse de seek !
  flee(target) {
    return this.seek(target).mult(-1);
  }

 
  
  /* Poursuite d'un point devant la target !
     cette methode renvoie la force à appliquer au véhicule
  */
  pursue(vehicle) {
    let target = vehicle.pos.copy();
    let prediction = vehicle.vel.copy();
    prediction.mult(10);
    target.add(prediction);
    fill(0, 255, 0);
    circle(target.x, target.y, 16);
    return this.seek(target);
  }

  evade(vehicle) {
    let pursuit = this.pursue(vehicle);
    pursuit.mult(-1);
    return pursuit;
  }

  // Comportement Separation : on garde ses distances par rapport aux voisins
  // ON ETUDIERA CE COMPORTEMENT PLUS TARD !
  separate(boids) {
    let desiredseparation = this.r;
    let steer = createVector(0, 0, 0);
    let count = 0;
    // On examine les autres boids pour voir s'ils sont trop près
    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = p5.Vector.dist(this.pos, other.pos);
      // Si la distance est supérieure à 0 et inférieure à une valeur arbitraire (0 quand on est soi-même)
      if (d > 0 && d < desiredseparation) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // poids en fonction de la distance. Plus le voisin est proche, plus le poids est grand
        steer.add(diff);
        count++; // On compte le nombre de voisins
      }
    }
    // On moyenne le vecteur steer en fonction du nombre de voisins
    if (count > 0) {
      steer.div(count);
    }

    // si la force de répulsion est supérieure à 0
    if (steer.mag() > 0) {
      // On implemente : Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // applyForce est une méthode qui permet d'appliquer une force au véhicule
  // en fait on additionne le vecteurr force au vecteur accélération
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // on ajoute l'accélération à la vitesse. L'accélération est un incrément de vitesse
    // (accélératiion = dérivée de la vitesse)
    this.vel.add(this.acc);
    // on contraint la vitesse à la valeur maxSpeed
    this.vel.limit(this.maxSpeed);
    // on ajoute la vitesse à la position. La vitesse est un incrément de position, 
    // (la vitesse est la dérivée de la position)
    this.pos.add(this.vel);

    // on remet l'accélération à zéro
    this.acc.set(0, 0);

    // mise à jour du path (la trainée derrière)
    this.ajoutePosAuPath();

    // durée de vie
    this.dureeDeVie -= 0.01;
  }

  ajoutePosAuPath() {
    // on rajoute la position courante dans le tableau
    this.path.push(this.pos.copy());

    // si le tableau a plus de 50 éléments, on vire le plus ancien
    if (this.path.length > this.pathMaxLength) {
      this.path.shift();
    }
  }

  // On dessine le véhicule, le chemin etc.
  show() {
    // dessin du chemin
    this.drawPath();
    // dessin du vehicule
    this.drawVehicle();
  }


  resumeNormalBehavior() {
    this.isWandering = true; // Reprendre le comportement wander
    this.vel = p5.Vector.random2D().setMag(this.maxSpeed); // Réinitialiser une vitesse aléatoire
}

stopAndShoot(target) {
  if (!target) return; // Vérifiez si la cible (ennemi) existe

  // Arrête le véhicule
  this.vel.set(0, 0);
  this.acc.set(0, 0);

  // Tire uniquement si le véhicule peut tirer (cooldown)
  if (this.canShoot) {
    this.shoot(target);
    this.canShoot = false; // Bloque le tir
    setTimeout(() => (this.canShoot = true), this.shootCooldown); // Délai de recharge
  }
}


shoot(target) {
    if (!target) return;

    // Vérifie si une balle est déjà tirée par ce véhicule
    let bullet = new Bullet(this.pos.x, this.pos.y, target.pos);
    bullets.push(bullet);
}
  drawVehicle() {
    // formes fil de fer en blanc
    stroke(255);
    // épaisseur du trait = 2
    strokeWeight(2);

    // formes pleines
    fill(this.color);

    // sauvegarde du contexte graphique (couleur pleine, fil de fer, épaisseur du trait, 
    // position et rotation du repère de référence)
    push();
    // on déplace le repère de référence.
    translate(this.pos.x, this.pos.y);
    // et on le tourne. heading() renvoie l'angle du vecteur vitesse (c'est l'angle du véhicule)
    rotate(this.vel.heading());

    // Dessin d'un véhicule sous la forme d'un triangle. Comme s'il était droit, avec le 0, 0 en haut à gauche
    triangle(-this.r_pourDessin, -this.r_pourDessin / 2, -this.r_pourDessin, this.r_pourDessin / 2, this.r_pourDessin, 0);
    // Que fait cette ligne ?
    //this.edges();

    // cercle pour le debug
    if (Vehicle.debug) {
      stroke(255);
      noFill();
      circle(0, 0, this.r);
    }

    // draw velocity vector
    pop();
    this.drawVector(this.pos, this.vel, color(255, 0, 0));

    // Cercle pour évitement entre vehicules et obstacles
    if (Vehicle.debug) {
      stroke(255);
      noFill();
      circle(this.pos.x, this.pos.y, this.r);
    }
  }

  drawPath() {
    push();
    stroke(255);
    noFill();
    strokeWeight(1);

    fill(this.color);
    // dessin du chemin
    this.path.forEach((p, index) => {
      if (!(index % 5)) {

        circle(p.x, p.y, 1);
      }
    });
    pop();
  }
  drawVector(pos, v, color) {
    push();
    // Dessin du vecteur vitesse
    // Il part du centre du véhicule et va dans la direction du vecteur vitesse
    strokeWeight(3);
    stroke(color);
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    // dessine une petite fleche au bout du vecteur vitesse
    let arrowSize = 5;
    translate(pos.x + v.x, pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  // que fait cette méthode ?
  edges() {
    if (this.pos.x < 0) this.pos.x = 0;
    if (this.pos.x > width) this.pos.x = width;
    if (this.pos.y < 0) this.pos.y = 0;
    if (this.pos.y > height) this.pos.y = height;
  }
}

class Bullet {
  constructor(x, y, targetPos) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.target = targetPos.copy(); // Copie de la position cible
    this.speed = 8; // Vitesse de la balle
  }

  update() {
    if (this.target) {
      let force = p5.Vector.sub(this.target, this.pos);
      force.setMag(this.speed);
      this.acc = force;
    }
    this.vel.add(this.acc);
    this.pos.add(this.vel);
  }

  show() {
    fill(255);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 5, 5); // Petite balle
  }

  hits(enemy) {
    // Vérifie si la balle atteint l'ennemi
    return p5.Vector.dist(this.pos, enemy.pos) < enemy.size / 2;
  }
}



class Enemy {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 40; // Taille de l'ennemi
    this.health = 100; // Vie de l'ennemi
  }

  show() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      enemy = null; // Supprime l'ennemi une fois détruit
    }
  }
}




class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(5);
  }

  show() {
    push();
    stroke(255);
    strokeWeight(2);
    fill("#F063A4");
    push();
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);
    pop();
    pop();
  }
}